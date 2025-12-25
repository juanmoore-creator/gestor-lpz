import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { db } from '../lib/firebase';
import {
    doc, onSnapshot, setDoc, collection,
    updateDoc, deleteDoc, query, orderBy, getDocs, writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import Papa from 'papaparse';
import type { TargetProperty, Comparable, SavedValuation, SurfaceType } from '../types/index';
import { DEFAULT_FACTORS, SURFACE_TYPES } from '../constants';

interface ValuationContextType {
    target: TargetProperty;
    setTarget: React.Dispatch<React.SetStateAction<TargetProperty>>;
    updateTarget: (updates: Partial<TargetProperty>) => Promise<void>;
    comparables: Comparable[];
    setComparables: React.Dispatch<React.SetStateAction<Comparable[]>>;
    addComparable: (initialData?: Partial<Omit<Comparable, 'id'>>) => Promise<void>;
    updateComparable: (id: string, updates: Partial<Comparable>) => Promise<void>;
    deleteComparable: (id: string) => Promise<void>;
    processedComparables: (Comparable & { hSurface: number; hPrice: number })[];
    savedValuations: SavedValuation[];
    handleNewValuation: () => Promise<void>;
    handleSaveValuation: () => Promise<void>;
    handleDeleteValuation: (id: string) => Promise<void>;
    handleLoadValuation: (valuation: SavedValuation) => Promise<void>;
    sheetUrl: string;
    setSheetUrl: React.Dispatch<React.SetStateAction<string>>;
    handleImportFromSheet: () => Promise<void>;
    brokerName: string;
    setBrokerName: React.Dispatch<React.SetStateAction<string>>;
    matricula: string;
    setMatricula: React.Dispatch<React.SetStateAction<string>>;
    pdfTheme: { primary: string; secondary: string };
    setPdfTheme: React.Dispatch<React.SetStateAction<{ primary: string; secondary: string }>>;
    stats: { avg: number; min: number; max: number; terciles: number[] };
    valuation: { low: number; market: number; high: number };
    targetHomogenizedSurface: number;
    // UI State for Modals that need to be triggered from Nav
    savedValuationsModalOpen: boolean;
    setSavedValuationsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    geminiModalOpen: boolean;
    setGeminiModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    clientName: string;
    setClientName: React.Dispatch<React.SetStateAction<string>>;
    isDirty: boolean;
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
}

const ValuationContext = createContext<ValuationContextType | undefined>(undefined);

export function ValuationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // State
    const [target, setTarget] = useState<TargetProperty>({
        address: '',
        coveredSurface: 0,
        uncoveredSurface: 0,
        surfaceType: 'Balcón',
        homogenizationFactor: 0.10,
        rooms: 0,
        bedrooms: 0,
        bathrooms: 0,
        age: 0,
        garage: false,
        semiCoveredSurface: 0,
        toilettes: 0,
        floorType: '',
        isCreditEligible: false,
        isProfessional: false,
        hasFinancing: false,
        images: [],
        mapImage: ''
    });

    const [comparables, setComparables] = useState<Comparable[]>([]);
    const [savedValuations, setSavedValuations] = useState<SavedValuation[]>([]);
    const [currentValuationId, setCurrentValuationId] = useState<string | null>(null);

    const [brokerName, setBrokerName] = useState('');
    const [matricula, setMatricula] = useState('');
    const [pdfTheme, setPdfTheme] = useState({
        primary: '#4f46e5', // indigo-600
        secondary: '#cbd5e1' // slate-300
    });

    // UI Globals
    const [savedValuationsModalOpen, setSavedValuationsModalOpen] = useState(false);
    const [geminiModalOpen, setGeminiModalOpen] = useState(false);
    const [clientName, setClientName] = useState('');
    const [isDirty, setIsDirty] = useState(false);


    // --- Helpers ---

    // Helper to get formatted paths and ensure user exists
    const getPaths = () => {
        if (!user || !user.uid) {
            // console.warn("Attempted to get paths with no user");
            return null;
        }
        return {
            basePath: `users/${user.uid}`,
            targetPath: `users/${user.uid}/data/valuation_active`,
            comparablesPath: `users/${user.uid}/comparables`,
            savedPath: `users/${user.uid}/saved_valuations`,
            oldBasePath: `artifacts/tasadorpro/users/${user.uid}`
        };
    };

    // --- Effects ---

    useEffect(() => {
        if (!user?.uid || !db) return;

        const paths = getPaths();
        if (!paths) return;

        const { targetPath, comparablesPath, savedPath } = paths;

        // Logging paths for debugging
        // console.log("Setting up listeners with paths:", { targetPath, comparablesPath, savedPath });

        // Subscriptions
        const targetRef = doc(db, targetPath);
        const comparablesRef = collection(db, comparablesPath);
        const savedRef = collection(db, savedPath);

        const unsubTarget = onSnapshot(targetRef, (doc) => {
            if (doc.exists()) {
                setTarget(doc.data() as TargetProperty);
            }
        }, (error) => {
            console.error("Error syncing target:", error);
        });

        const q = query(comparablesRef, orderBy('daysOnMarket', 'asc'));
        const unsubComparables = onSnapshot(q, (snapshot) => {
            const comps = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Comparable));
            setComparables(comps);
        }, (error) => {
            console.error("Error syncing comparables:", error);
        });

        const qSaved = query(savedRef, orderBy('date', 'desc'));
        const unsubSaved = onSnapshot(qSaved, (snapshot) => {
            const saved = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedValuation));
            setSavedValuations(saved);
        }, (error) => {
            console.error("Error syncing saved valuations:", error);
        });

        return () => {
            unsubTarget();
            unsubComparables();
            unsubSaved();
        };
    }, [user]);

    // --- Actions ---

    const addLog = (msg: string) => console.log(`${new Date().toLocaleTimeString()}: ${msg}`);

    const updateTarget = async (updates: Partial<TargetProperty>) => {
        const newTarget = { ...target, ...updates };
        setTarget(newTarget); // Optimistic
        setIsDirty(true);

        const paths = getPaths();
        if (!paths) return;

        if (user && db) {
            // console.log("Updating target at:", paths.targetPath);
            await setDoc(doc(db, paths.targetPath), newTarget, { merge: true });
        }
    };

    const addComparable = async (initialData?: Partial<Omit<Comparable, 'id'>>) => {
        const paths = getPaths();
        if (!paths) return;

        // Generate ID securely if connected
        let newId = Math.random().toString();
        let docRef = null;

        if (user && db) {
            docRef = doc(collection(db, paths.comparablesPath));
            newId = docRef.id;
        }

        const newComp: Comparable = {
            id: newId,
            address: 'Nueva Propiedad',
            price: 100000,
            coveredSurface: 50,
            uncoveredSurface: 0,
            surfaceType: 'Ninguno',
            homogenizationFactor: 0,
            daysOnMarket: 0,
            rooms: 0,
            bedrooms: 0,
            bathrooms: 0,
            age: 0,
            garage: false,
            semiCoveredSurface: 0,
            toilettes: 0,
            floorType: '',
            apartmentsInBuilding: 0,
            isCreditEligible: false,
            isProfessional: false,
            hasFinancing: false,
            images: [],
            ...initialData
        };

        // Optimistic
        setComparables([...comparables, newComp]);
        setIsDirty(true);

        if (user && db && docRef) {
            const { id, ...data } = newComp;
            // console.log("Adding comparable to:", paths.comparablesPath);
            await setDoc(docRef, data);
        }
    };

    const updateComparable = async (id: string, updates: Partial<Comparable>) => {
        // Optimistic
        setComparables(comparables.map(c => c.id === id ? { ...c, ...updates } : c));
        setIsDirty(true);

        const paths = getPaths();
        if (user && db && paths) {
            const compPath = `${paths.comparablesPath}/${id}`;
            // console.log("Updating comparable at:", compPath);
            await updateDoc(doc(db, compPath), updates);
        }
    };

    const deleteComparable = async (id: string) => {
        // Optimistic update
        const previousComparables = [...comparables];
        setComparables(comparables.filter(c => c.id !== id));
        setIsDirty(true);

        const paths = getPaths();
        if (user && db && paths) {
            try {
                const compPath = `${paths.comparablesPath}/${id}`;
                console.log("Deleting comparable at:", compPath);
                await deleteDoc(doc(db, compPath));
            } catch (error) {
                console.error("Error deleting comparable:", error);
                // Rollback on error
                setComparables(previousComparables);
                alert("Error al eliminar comparable.");
            }
        }
    };

    const handleNewValuation = async () => {
        if (isDirty && (comparables.length > 0 || target.address)) {
            if (!confirm("¿Estás seguro de crear una nueva tasación? Se perderán los datos actuales no guardados.")) return;
        }

        const paths = getPaths();
        if (!paths) return;

        const emptyTarget: TargetProperty = {
            address: '',
            coveredSurface: 0,
            uncoveredSurface: 0,
            surfaceType: 'Balcón',
            homogenizationFactor: 0.10,
            rooms: 0,
            bedrooms: 0,
            bathrooms: 0,
            age: 0,
            garage: false,
            semiCoveredSurface: 0,
            toilettes: 0,
            floorType: '',
            apartmentsInBuilding: 0,
            isCreditEligible: false,
            isProfessional: false,
            hasFinancing: false,
            images: [],
            mapImage: ''
        };

        setTarget(emptyTarget);
        setComparables([]);
        setCurrentValuationId(null);
        setClientName('');
        setIsDirty(false);

        if (user && db) {
            console.log("Starting new valuation reset");
            const batch = writeBatch(db);

            // 1. Reset Target
            const targetRef = doc(db, paths.targetPath);
            batch.set(targetRef, emptyTarget);

            // 2. Clear Comparables
            const compsRef = collection(db, paths.comparablesPath);
            const q = query(compsRef);
            // Must fetch to get IDs
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(d => {
                batch.delete(d.ref);
            });

            await batch.commit();
            console.log("New valuation reset committed");
        }
    };


    const handleSaveValuation = async () => {
        if (!user || !db) {
            window.alert("Debes estar conectado para guardar.");
            return;
        }

        const paths = getPaths();
        if (!paths) {
            window.alert("Error: Usuario no identificado correctamente.");
            return;
        }

        // LIMIT CHECK
        if (!currentValuationId && savedValuations.length >= 30) {
            window.alert("Has alcanzado el límite de 30 tasaciones guardadas.");
            return;
        }

        // VALIDATION
        if (!target.address || target.address.trim() === '') {
            window.alert("Ingresa una dirección válida para la propiedad antes de guardar.");
            return;
        }

        try {
            // WAKE UP / ENSURE USER EXISTS
            await setDoc(doc(db, 'users', user.uid), { lastActive: Date.now() }, { merge: true });

            const valuationName = `${target.address} - ${new Date().toLocaleDateString()}`;
            const valuationData = {
                date: Date.now(),
                target: target,
                comparables: comparables,
                name: valuationName,
                clientName: clientName // Include clientName in saved data
            };

            let docRef;

            if (currentValuationId) {
                docRef = doc(db, paths.savedPath, currentValuationId);
            } else {
                docRef = doc(collection(db, paths.savedPath));
            }

            // UNIFIED WRITE - ALWAYS setDoc with Merge
            await setDoc(docRef, valuationData, { merge: true });

            // IMMEDIATE SYNC
            setCurrentValuationId(docRef.id);
            setIsDirty(false);

            window.alert("Tasación guardada correctamente.");

        } catch (error: any) {
            console.error("Save Error:", error);
            window.alert("Error al guardar: " + (error?.message || error));
        }
    };

    const handleDeleteValuation = async (id: string) => {
        const paths = getPaths();
        if (!user || !db || !paths) return;

        if (!confirm("¿Estás seguro de eliminar esta tasación?")) return;
        try {
            const docPath = `${paths.savedPath}/${id}`;
            await deleteDoc(doc(db, docPath));

            if (id === currentValuationId) {
                setCurrentValuationId(null);
            }
        } catch (error: any) {
            console.error("Delete Error:", error);
            alert("Error al eliminar.");
        }
    };

    const handleLoadValuation = async (valuation: SavedValuation) => {
        if (isDirty && (comparables.length > 0 || target.address)) {
            if (!confirm("Cargar esta tasación reemplazará los datos actuales. ¿Continuar?")) return;
        }

        const paths = getPaths();
        if (!paths) return;

        try {
            // 0. PREPARE IDs STRICTLY
            // distinct ID generation to match State <-> Firestore 1:1
            const sanitizedComparables = valuation.comparables.map(c => {
                let safeId = c.id;
                // If ID is missing or looks like a temp ID (random math), generate a real one
                if (!safeId || safeId.startsWith('0.') || safeId.length < 5) {
                    if (user && db) {
                        safeId = doc(collection(db, paths.comparablesPath)).id;
                    } else {
                        safeId = Math.random().toString();
                    }
                }
                return { ...c, id: safeId };
            });

            // 1. Update State (Optimistic but strict)
            setTarget(valuation.target);
            setComparables(sanitizedComparables);
            setCurrentValuationId(valuation.id);
            setClientName(valuation.clientName || '');
            setIsDirty(false);

            if (user && db) {
                const batch = writeBatch(db);

                // 2. Update Target in DB
                const targetRef = doc(db, paths.targetPath);
                batch.set(targetRef, valuation.target, { merge: true });

                // 3. Clear Existing Comparables in DB
                const compsRef = collection(db, paths.comparablesPath);
                const snapshot = await getDocs(query(compsRef));
                snapshot.docs.forEach(d => batch.delete(d.ref));

                // 4. Add New Comparables (using STRICLY the same IDs as state)
                sanitizedComparables.forEach(c => {
                    const newRef = doc(db, paths.comparablesPath, c.id);
                    batch.set(newRef, c);
                });

                await batch.commit();
            }
        } catch (error: any) {
            console.error("Load Error:", error);
            alert("Error al cargar tasación.");
        }
    };

    // --- Google Sheets Integration ---

    const [sheetUrl, setSheetUrl] = useState('');

    const getSheetCsvUrl = (url: string) => {
        try {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match && match[1]) {
                return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv`;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const handleImportFromSheet = async () => {
        if (!sheetUrl) {
            alert("Por favor ingresa el link de tu Google Sheet (debe ser público).");
            return;
        }

        const csvUrl = getSheetCsvUrl(sheetUrl);
        if (!csvUrl) {
            alert("Link inválido. Asegúrate de copiar el link completo de tu Google Sheet.");
            return;
        }

        const paths = getPaths();

        try {
            addLog("Fetching data from Google Sheet...");
            const urlWithCacheBuster = `${csvUrl}&t=${Date.now()}`;
            const response = await fetch(urlWithCacheBuster);
            if (!response.ok) throw new Error("Failed to fetch sheet");
            const text = await response.text();

            Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (h: string) => h.trim(),
                complete: async (results: any) => {
                    try {
                        const rows = results.data as any[];
                        const newComps: Omit<Comparable, 'id'>[] = [];

                        const cleanNumber = (val: any): number => {
                            if (!val) return 0;
                            let str = val.toString();
                            str = str.replace(/[Uu$sSDdm²\s]/g, '');
                            str = str.replace(/\./g, '').replace(',', '.');
                            return parseFloat(str) || 0;
                        };

                        for (const row of rows) {
                            const address = row['Dirección'] || row['Address'] || 'Sin dirección';
                            if ((!address || address === 'Sin dirección') && !row['Precio']) continue;

                            const price = cleanNumber(row['Precio'] || row['Price']);
                            const covered = cleanNumber(row['Sup. Cubierta'] || row['Covered Surface']);
                            const uncovered = cleanNumber(row['Sup. Descubierta'] || row['Uncovered Surface']);

                            const typeRaw = (row['Tipo Sup'] || row['Surface Type'] || '').trim();
                            const type = SURFACE_TYPES.includes(typeRaw as any) ? (typeRaw as SurfaceType) : 'Ninguno';

                            const factorRaw = row['Factor'] ? cleanNumber(row['Factor']) : NaN;
                            const factor = (factorRaw > 0) ? factorRaw : DEFAULT_FACTORS[type] || 1;

                            const days = cleanNumber(row['Días'] || row['Days']);

                            newComps.push({
                                address,
                                price,
                                coveredSurface: covered,
                                uncoveredSurface: uncovered,
                                surfaceType: type,
                                homogenizationFactor: factor,
                                daysOnMarket: days
                            });
                        }

                        if (user && db && paths) {
                            const batch = writeBatch(db);
                            newComps.forEach(c => {
                                const newRef = doc(collection(db, paths.comparablesPath));
                                batch.set(newRef, c);
                            });
                            await batch.commit();
                        } else {
                            setComparables(prev => [...prev, ...newComps.map(c => ({ ...c, id: Math.random().toString() }))]);
                        }

                        addLog(`Successfully imported ${newComps.length} rows from Sheet`);
                    } catch (err: any) {
                        console.error("Parse Logic Error:", err);
                        alert(`Error processing data: ${err.message}`);
                    }
                },
                error: (err: any) => {
                    console.error("CSV Parse Error:", err);
                    alert("Error parsing Sheet data.");
                }
            });
        } catch (error: any) {
            console.error("Sheet Import Error:", error);
            alert("Error importando desde Sheet. Asegúrate que esté configurada como 'Cualquiera con el enlace puede ver'.");
        }
    };

    // --- Calculations ---

    const calculateHomogenizedSurface = (covered: number, uncovered: number, factor: number) => {
        return covered + (uncovered * factor);
    };

    const calculateHomogenizedPrice = (price: number, hSurface: number) => {
        if (hSurface === 0) return 0;
        return price / hSurface;
    };

    const targetHomogenizedSurface = calculateHomogenizedSurface(target.coveredSurface, target.uncoveredSurface, target.homogenizationFactor);

    const processedComparables = useMemo(() => {
        return comparables.map(c => {
            const hSurface = calculateHomogenizedSurface(c.coveredSurface, c.uncoveredSurface, c.homogenizationFactor);
            const hPrice = calculateHomogenizedPrice(c.price, hSurface);
            return { ...c, hSurface, hPrice };
        }).filter(c => c.hPrice > 0);
    }, [comparables]);

    const stats = useMemo(() => {
        if (processedComparables.length === 0) return { avg: 0, min: 0, max: 0, terciles: [0, 0, 0] };
        const prices = processedComparables.map(c => c.hPrice).sort((a, b) => a - b);
        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = sum / prices.length;
        const min = prices[0];
        const max = prices[prices.length - 1];
        const t1 = prices[Math.floor(prices.length / 3)];
        const t2 = prices[Math.floor(2 * prices.length / 3)];
        return { avg, min, max, terciles: [t1, avg, t2] };
    }, [processedComparables]);

    const valuation = useMemo(() => {
        if (!targetHomogenizedSurface) return { low: 0, market: 0, high: 0 };
        return {
            low: stats.terciles[0] * targetHomogenizedSurface,
            market: stats.avg * targetHomogenizedSurface,
            high: stats.terciles[2] * targetHomogenizedSurface
        };
    }, [stats, targetHomogenizedSurface]);

    return (
        <ValuationContext.Provider value={{
            target, setTarget, updateTarget,
            comparables, setComparables, addComparable, updateComparable, deleteComparable, processedComparables,
            savedValuations, handleNewValuation, handleSaveValuation, handleDeleteValuation, handleLoadValuation,
            sheetUrl, setSheetUrl, handleImportFromSheet,
            brokerName, setBrokerName,
            matricula, setMatricula,
            pdfTheme, setPdfTheme,
            stats, valuation, targetHomogenizedSurface,
            savedValuationsModalOpen, setSavedValuationsModalOpen,
            geminiModalOpen, setGeminiModalOpen,
            clientName, setClientName,
            isDirty, setIsDirty
        }}>
            {children}
        </ValuationContext.Provider>
    );
}

export const useValuation = () => {
    const context = useContext(ValuationContext);
    if (context === undefined) {
        throw new Error('useValuation must be used within a ValuationProvider');
    }
    return context;
};
