import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
    collection, onSnapshot, query, orderBy, deleteDoc, doc, addDoc, updateDoc
} from 'firebase/firestore';
import type { Inmueble } from '../types/index';
import { useAuth } from '../context/AuthContext';

export function useInmuebles() {
    const { user } = useAuth();
    const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!db) {
            console.warn("useInmuebles: Database not initialized");
            return;
        }

        if (!user) {
            console.log("useInmuebles: No authenticated user, skipping fetch");
            setInmuebles([]);
            setIsLoading(false);
            return;
        }

        console.log(`useInmuebles: Starting snapshot for user ${user.uid} on 'inmuebles' collection`);
        setIsLoading(true);

        const q = query(
            collection(db, 'inmuebles'),
            orderBy('fechaCreacion', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`useInmuebles: Received snapshot with ${snapshot.docs.length} properties`);
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Inmueble));
            setInmuebles(items);
            setIsLoading(false);
        }, (err) => {
            console.error("useInmuebles: Error fetching properties:", err);
            setError("Error al cargar los inmuebles.");
            setIsLoading(false);
        });

        return () => {
            console.log("useInmuebles: Unsubscribing from 'inmuebles'");
            unsubscribe();
        };
    }, [user]);

    const deleteInmueble = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'inmuebles', id));
        } catch (err) {
            console.error("Error deleting inmueble:", err);
            throw err;
        }
    };

    const addInmueble = async (data: Partial<Inmueble>) => {
        if (!db) return;
        try {
            await addDoc(collection(db, 'inmuebles'), {
                ...data,
                fechaCreacion: Date.now(),
                fechaActualizacion: Date.now(),
                status: data.status || 'Disponible'
            });
        } catch (err) {
            console.error("Error adding inmueble:", err);
            throw err;
        }
    };

    const updateInmueble = async (id: string, data: Partial<Inmueble>) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, 'inmuebles', id), {
                ...data,
                fechaActualizacion: Date.now()
            });
        } catch (err) {
            console.error("Error updating inmueble:", err);
            throw err;
        }
    };

    // Helper to get properties for a specific client
    const getInmueblesByPropietario = (propietarioId: string) => {
        return inmuebles.filter(i => i.propietarioId === propietarioId);
    };

    return {
        inmuebles,
        isLoading,
        error,
        addInmueble,
        updateInmueble,
        deleteInmueble,
        getInmueblesByPropietario
    };
}
