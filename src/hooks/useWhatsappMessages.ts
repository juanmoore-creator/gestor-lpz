import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface WhatsappMessage {
    id: string;
    text: string;
    timestamp: Timestamp;
    direction: 'incoming' | 'outgoing';
    status: 'sent' | 'delivered' | 'read' | 'received';
}

export const useWhatsappMessages = (conversationId: string | null) => {
    const [messages, setMessages] = useState<WhatsappMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'whatsapp_conversations', conversationId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as WhatsappMessage[];
                setMessages(msgs);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching messages:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [conversationId]);

    return { messages, loading, error };
};
