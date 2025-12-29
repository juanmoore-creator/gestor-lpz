import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
    doc, onSnapshot, setDoc, collection,
    deleteDoc, query, orderBy, writeBatch, getDocs
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import type { SavedValuation, TargetProperty, Comparable } from '../types/index';

// --- Types for function arguments ---
interface SavePayload {
    target: TargetProperty;
    comparables: Comparable[];
    clientName: string;
    currentValuationId: string | null;
}

interface LoadPayload {
    valuation: SavedValuation;
    isDirty: boolean;
}

// --- Helper to get Firestore paths ---
const getPaths = (uid: string | undefined) => {
    if (!uid) return null;
    return {
        savedPath: `users/${uid}/saved_valuations`,
        // We also need comparables path for the load operation
        comparablesPath: `users/${uid}/comparables`,
        targetPath: `users/${uid}/data/valuation_active`,
    };
};

export function useSavedValuations() {
    const { user } = useAuth();
    const [savedValuations, setSavedValuations] = useState<SavedValuation[]>([]);

    // --- Effect for Data Syncing ---
    useEffect(() => {
        if (!user?.uid || !db) return;

        const paths = getPaths(user.uid);
        if (!paths) return;

        // Subscribe to saved valuations
        const qSaved = query(collection(db, paths.savedPath), orderBy('date', 'desc'));
        const unsubSaved = onSnapshot(qSaved, (snapshot) => {
            const saved = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedValuation));
            setSavedValuations(saved);
        }, (error) => {
            console.error("Error syncing saved valuations:", error);
        });

        return () => unsubSaved();
    }, [user]);

    // --- Actions ---

    const handleSaveValuation = async (
        payload: SavePayload,
        // Callback to update the ID in the active hook
        onSaveSuccess: (id: string) => void
    ) => {
        if (!user) return alert("Debes estar conectado para guardar.");
        const paths = getPaths(user.uid);
        if (!paths) return;

        const { target, comparables, clientName, currentValuationId } = payload;

        if (!currentValuationId && savedValuations.length >= 30) {
            return alert("Has alcanzado el límite de 30 tasaciones guardadas.");
        }
        if (!target.address || target.address.trim() === '') {
            return alert("Ingresa una dirección válida para la propiedad antes de guardar.");
        }

        try {
            const valuationName = `${target.address} - ${new Date().toLocaleDateString()}`;
            const valuationData = {
                date: Date.now(),
                target: target,
                comparables: comparables,
                name: valuationName,
                clientName: clientName,
            };

            const docRef = currentValuationId
                ? doc(db, paths.savedPath, currentValuationId)
                : doc(collection(db, paths.savedPath));

            await setDoc(docRef, valuationData, { merge: true });

            onSaveSuccess(docRef.id);
            alert("Tasación guardada correctamente.");
        } catch (error: any) {
            console.error("Save Error:", error);
            alert("Error al guardar: " + (error?.message || error));
        }
    };

    const handleDeleteValuation = async (id: string, onAfterDelete: (deletedId: string) => void) => {
        if (!user || !confirm("¿Estás seguro de eliminar esta tasación?")) return;
        
        const paths = getPaths(user.uid);
        if (!paths) return;

        try {
            await deleteDoc(doc(db, paths.savedPath, id));
            onAfterDelete(id); // Let the active hook know if it was the one deleted
        } catch (error: any) {
            console.error("Delete Error:", error);
            alert("Error al eliminar.");
        }
    };

    const handleLoadValuation = async (
        payload: LoadPayload,
        // Callback to update the active valuation state
        onLoadSuccess: (valuation: SavedValuation) => void
    ) => {
        const { valuation, isDirty } = payload;
        if (isDirty && !confirm("Cargar esta tasación reemplazará los datos actuales. ¿Continuar?")) return;
        
        const paths = getPaths(user?.uid);
        if (!user || !paths) return;

        try {
            const sanitizedComparables = valuation.comparables.map(c => {
                 let safeId = c.id;
                if (!safeId || safeId.startsWith('0.') || safeId.length < 5) {
                    safeId = doc(collection(db, paths.comparablesPath)).id;
                }
                return { ...c, id: safeId };
            });

            const loadedValuation = { ...valuation, comparables: sanitizedComparables };
            
            // This now becomes the responsibility of the calling component/hook
            onLoadSuccess(loadedValuation);

            // Sync the backend state
            const batch = writeBatch(db);
            
            // 1. Update Target
            batch.set(doc(db, paths.targetPath), loadedValuation.target, { merge: true });
            
            // 2. Clear & set comparables
            const snapshot = await getDocs(query(collection(db, paths.comparablesPath)));
            snapshot.docs.forEach(d => batch.delete(d.ref));
            loadedValuation.comparables.forEach(c => {
                batch.set(doc(db, paths.comparablesPath, c.id), c);
            });

            await batch.commit();

        } catch (error: any) {
            console.error("Load Error:", error);
            alert("Error al cargar tasación.");
        }
    };


    return {
        savedValuations,
        handleSaveValuation,
        handleDeleteValuation,
        handleLoadValuation,
    };
}
