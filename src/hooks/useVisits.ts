import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import type { Visit } from '../types';

export function useVisits(propertyId: string) {
    const { user } = useAuth();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !propertyId) return;

        const q = query(
            collection(db, 'visits'),
            where('propertyId', '==', propertyId),
            orderBy('date', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));
            setVisits(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching visits:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [user, propertyId]);

    const addVisit = async (visitData: Omit<Visit, 'id' | 'propertyId'>) => {
        if (!user) return;
        return await addDoc(collection(db, 'visits'), {
            ...visitData,
            propertyId,
            userId: user.uid,
            createdAt: serverTimestamp()
        });
    };

    return { visits, loading, addVisit };
}
