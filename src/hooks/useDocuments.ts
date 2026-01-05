import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import type { PropertyDocument } from '../types';

export function useDocuments(propertyId: string) {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<PropertyDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !propertyId) return;

        const q = query(
            collection(db, 'documents'),
            where('propertyId', '==', propertyId),
            orderBy('uploadedAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyDocument));
            setDocuments(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching documents:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [user, propertyId]);

    const addDocument = async (documentData: Omit<PropertyDocument, 'id' | 'propertyId'>) => {
        if (!user) return;
        return await addDoc(collection(db, 'documents'), {
            ...documentData,
            propertyId,
            userId: user.uid,
            uploadedAt: serverTimestamp()
        });
    };

    return { documents, loading, addDocument };
}
