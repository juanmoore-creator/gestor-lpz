import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

import type { WhatsappConversation } from '../types/index';

export const useWhatsappConversations = (userId: string | undefined) => {
    const [conversations, setConversations] = useState<WhatsappConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'whatsapp_conversations'),
            where('assignedTo', 'in', [userId, 'system']) // Included 'system' as default for unassigned
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const convs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as WhatsappConversation[];
                setConversations(convs);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching conversations:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    return { conversations, loading, error };
};
