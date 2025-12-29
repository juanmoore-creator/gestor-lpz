import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import {
    doc, onSnapshot, setDoc, collection,
    updateDoc, deleteDoc, query, orderBy, getDocs, writeBatch
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import type { TargetProperty, Comparable, SavedValuation } from '../types/index';

// --- Helper to get Firestore paths ---
const getPaths = (uid: string | undefined) => {
    if (!uid) return null;
    return {
        basePath: `users/${uid}`,
        targetPath: `users/${uid}/data/valuation_active`,
        comparablesPath: `users/${uid}/comparables`,
    };
};

export function useActiveValuation() {
    const { user } = useAuth();

    // --- State ---
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
    const [currentValuationId, setCurrentValuationId] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    // --- Effects for Data Syncing ---
    useEffect(() => {
        if (!user?.uid || !db) return;

        const paths = getPaths(user.uid);
        if (!paths) return;

        const { targetPath, comparablesPath } = paths;

        // Subscribe to active target
        const unsubTarget = onSnapshot(doc(db, targetPath), (doc) => {
            if (doc.exists()) {
                setTarget(doc.data() as TargetProperty);
            }
        }, (error) => {
            console.error("Error syncing target:", error);
        });

        // Subscribe to active comparables
        const q = query(collection(db, comparablesPath), orderBy('daysOnMarket', 'asc'));
        const unsubComparables = onSnapshot(q, (snapshot) => {
            const comps = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Comparable));
            setComparables(comps);
        }, (error) => {
            console.error("Error syncing comparables:", error);
        });

        return () => {
            unsubTarget();
            unsubComparables();
        };
    }, [user]);

    // --- Actions ---
    const updateTarget = async (updates: Partial<TargetProperty>) => {
        const newTarget = { ...target, ...updates };
        setTarget(newTarget); // Optimistic update
        setIsDirty(true);

        const paths = getPaths(user?.uid);
        if (paths) {
            await setDoc(doc(db, paths.targetPath), newTarget, { merge: true });
        }
    };

    const addComparable = async (initialData?: Partial<Omit<Comparable, 'id'>>) => {
        const paths = getPaths(user?.uid);
        if (!paths) return;

        const docRef = doc(collection(db, paths.comparablesPath));
        const newId = docRef.id;

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
        
        setComparables([...comparables, newComp]); // Optimistic update
        setIsDirty(true);
        
        const { id, ...data } = newComp;
        await setDoc(docRef, data);
    };

    const updateComparable = async (id: string, updates: Partial<Comparable>) => {
        setComparables(comparables.map(c => c.id === id ? { ...c, ...updates } : c)); // Optimistic
        setIsDirty(true);

        const paths = getPaths(user?.uid);
        if (paths) {
            await updateDoc(doc(db, paths.comparablesPath, id), updates);
        }
    };

    const deleteComparable = async (id: string) => {
        setComparables(comparables.filter(c => c.id !== id)); // Optimistic
        setIsDirty(true);

        const paths = getPaths(user?.uid);
        if (paths) {
            await deleteDoc(doc(db, paths.comparablesPath, id));
        }
    };
    
    const handleNewValuation = async () => {
        if (isDirty && !confirm("¿Estás seguro de crear una nueva tasación? Se perderán los datos no guardados.")) {
            return;
        }

        const emptyTarget: TargetProperty = {
            address: '', coveredSurface: 0, uncoveredSurface: 0, surfaceType: 'Balcón',
            homogenizationFactor: 0.10, rooms: 0, bedrooms: 0, bathrooms: 0, age: 0, garage: false,
            semiCoveredSurface: 0, toilettes: 0, floorType: '', isCreditEligible: false,
            isProfessional: false, hasFinancing: false, images: [], mapImage: ''
        };

        setTarget(emptyTarget);
        setComparables([]);
        setCurrentValuationId(null);
        setClientName('');
        setIsDirty(false);

        const paths = getPaths(user?.uid);
        if (paths) {
            const batch = writeBatch(db);
            batch.set(doc(db, paths.targetPath), emptyTarget);
            const snapshot = await getDocs(query(collection(db, paths.comparablesPath)));
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
    };
    
    // This function will be called by the useSavedValuations hook
    const loadActiveValuation = (valuation: SavedValuation) => {
        // This function will handle the logic of setting the active
        // valuation from a saved one. We will implement this logic
        // when we refactor the `useSavedValuations` hook.
        setTarget(valuation.target);
        setComparables(valuation.comparables);
        setCurrentValuationId(valuation.id);
        setClientName(valuation.clientName || '');
        setIsDirty(false);
    };


    // --- Calculations ---
    const calculateHomogenizedSurface = (covered: number, uncovered: number, factor: number) => {
        return covered + (uncovered * factor);
    };

    const calculateHomogenizedPrice = (price: number, hSurface: number) => {
        if (hSurface === 0) return 0;
        return price / hSurface;
    };

    const targetHomogenizedSurface = useMemo(() => 
        calculateHomogenizedSurface(target.coveredSurface, target.uncoveredSurface, target.homogenizationFactor),
        [target]
    );

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


    return {
        // State
        target,
        comparables,
        clientName,
        isDirty,
        currentValuationId,
        
        // Setters
        setTarget,
        setComparables,
        setClientName,
        setIsDirty,
        setCurrentValuationId,

        // Actions
        updateTarget,
        addComparable,
        updateComparable,
        deleteComparable,
        handleNewValuation,
        loadActiveValuation,

        // Calculated values
        processedComparables,
        stats,
        valuation,
        targetHomogenizedSurface
    };
}
