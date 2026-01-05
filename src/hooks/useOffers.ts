import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import type { Offer } from '../types';

export function useOffers(propertyId: string) {
    const { user } = useAuth();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !propertyId) return;

        const q = query(
            collection(db, 'offers'),
            where('propertyId', '==', propertyId),
            orderBy('date', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
            setOffers(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching offers:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [user, propertyId]);

    const addOffer = async (offerData: Omit<Offer, 'id' | 'propertyId'>) => {
        if (!user) return;
        return await addDoc(collection(db, 'offers'), {
            ...offerData,
            propertyId,
            userId: user.uid,
            createdAt: serverTimestamp()
        });
    };

    const updateOfferStatus = async (offerId: string, status: Offer['status']) => {
        const offerRef = doc(db, 'offers', offerId);
        return await updateDoc(offerRef, { status });
    };

    return { offers, loading, addOffer, updateOfferStatus };
}
