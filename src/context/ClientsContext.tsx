import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '../lib/firebase';
import {
    doc, onSnapshot, setDoc, collection,
    updateDoc, deleteDoc, query, orderBy
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import type { Client } from '../types/index';

interface ClientsContextType {
    clients: Client[];
    addClient: (client: Omit<Client, 'id' | 'createdAt' | 'lastActivity'>) => Promise<string>;
    updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    getClientById: (id: string) => Client | undefined;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        if (!user?.uid || !db) {
            setClients([]);
            return;
        }

        const clientsPath = `users/${user.uid}/clients`;
        const q = query(collection(db, clientsPath), orderBy('lastActivity', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Client));
            setClients(clientList);
        }, (error) => {
            console.error("Error syncing clients:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'lastActivity'>) => {
        if (!user?.uid || !db) throw new Error("No authenticated user");

        const newClient: Client = {
            id: crypto.randomUUID(), // Optimistic ID
            ...clientData,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };

        const clientsPath = `users/${user.uid}/clients`;
        // Use a new doc reference for auto-ID or specified ID
        const docRef = doc(collection(db, clientsPath));
        newClient.id = docRef.id; // Use Firestore ID

        await setDoc(docRef, newClient);
        return newClient.id;
    };

    const updateClient = async (id: string, updates: Partial<Client>) => {
        if (!user?.uid || !db) return;

        const clientsPath = `users/${user.uid}/clients/${id}`;
        await updateDoc(doc(db, clientsPath), {
            ...updates,
            lastActivity: Date.now() // Touch activity on update
        });
    };

    const deleteClient = async (id: string) => {
        if (!user?.uid || !db) return;

        if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

        const clientsPath = `users/${user.uid}/clients/${id}`;
        await deleteDoc(doc(db, clientsPath));
    };

    const getClientById = (id: string) => {
        return clients.find(c => c.id === id);
    };

    return (
        <ClientsContext.Provider value={{
            clients,
            addClient,
            updateClient,
            deleteClient,
            getClientById
        }}>
            {children}
        </ClientsContext.Provider>
    );
}

export const useClients = () => {
    const context = useContext(ClientsContext);
    if (context === undefined) {
        throw new Error('useClients must be used within a ClientsProvider');
    }
    return context;
};
