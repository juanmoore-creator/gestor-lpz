import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import type { SavedValuation } from '../types';

export function useValuations(propertyId: string) {
    const { user } = useAuth();
    const [valuations, setValuations] = useState<SavedValuation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !propertyId) return;

        const q = query(
            collection(db, `users/${user.uid}/saved_valuations`),
            where('inmuebleId', '==', propertyId),
            orderBy('date', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const vals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedValuation));
            setValuations(vals);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching valuations:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [user, propertyId]);

    const addValuation = async (valuationData: Partial<SavedValuation>) => {
        if (!user) return;
        return await addDoc(collection(db, `users/${user.uid}/saved_valuations`), {
            ...valuationData,
            inmuebleId: propertyId,
            date: Date.now()
        });
    };

    return { valuations, loading, addValuation };
}
