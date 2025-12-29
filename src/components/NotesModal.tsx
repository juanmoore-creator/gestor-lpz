import { useState, useEffect } from 'react';
import { X, Send, Save, Clock, FileText } from 'lucide-react';
import { useClients } from '../context/ClientsContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { Client } from '../types';

interface NotesModalProps {
    client: Client | null;
    isOpen: boolean;
    onClose: () => void;
}

export function NotesModal({ client, isOpen, onClose }: NotesModalProps) {
    const { updateClient } = useClients();
    const { user } = useAuth();

    // State for General Note
    const [generalNote, setGeneralNote] = useState('');
    const [isSavingGeneral, setIsSavingGeneral] = useState(false);

    // State for New Timeline Note
    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    // State for Notes History
    const [historyNotes, setHistoryNotes] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (client) {
            setGeneralNote(client.notes || '');
        }
    }, [client]);

    useEffect(() => {
        if (!isOpen || !client || !user) return;

        setLoadingHistory(true);
        const logsRef = collection(db, `users/${user.uid}/clients/${client.id}/logs`);
        const q = query(
            logsRef,
            where('type', '==', 'note'),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHistoryNotes(notes);
            setLoadingHistory(false);
        });

        return () => unsubscribe();
    }, [isOpen, client, user]);

    const handleSaveGeneralNote = async () => {
        if (!client) return;
        setIsSavingGeneral(true);
        try {
            await updateClient(client.id, { notes: generalNote });
        } catch (error) {
            console.error("Error saving specific note:", error);
        } finally {
            setIsSavingGeneral(false);
        }
    };

    const handleAddTimelineNote = async () => {
        if (!client || !user || !newNote.trim()) return;
        setIsAddingNote(true);
        try {
            const logsRef = collection(db, `users/${user.uid}/clients/${client.id}/logs`);
            await addDoc(logsRef, {
                title: 'Nota agregada',
                description: newNote,
                date: Date.now(),
                type: 'note'
            });
            setNewNote('');
        } catch (error) {
            console.error("Error adding timeline note:", error);
        } finally {
            setIsAddingNote(false);
        }
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold font-heading text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-brand" /> Notas del Cliente
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Gestiona la información de {client.name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Section 1: General Profile Note */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Nota de Perfil (General)</h4>
                            <button
                                onClick={handleSaveGeneralNote}
                                disabled={isSavingGeneral || generalNote === client.notes}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                            >
                                <Save className="w-3 h-3" />
                                {isSavingGeneral ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                        <textarea
                            value={generalNote}
                            onChange={(e) => setGeneralNote(e.target.value)}
                            className="w-full h-32 p-4 text-sm text-slate-700 bg-amber-50/50 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-300 resize-none placeholder:text-amber-800/30"
                            placeholder="Escribe información general importante sobre este cliente..."
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            * Esta nota aparece en el perfil principal del cliente.
                        </p>
                    </section>

                    <hr className="border-slate-100" />

                    {/* Section 2: Timeline Notes */}
                    <section className="flex flex-col h-full min-h-[300px]">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Historial de Notas
                        </h4>

                        {/* Add New Note Input */}
                        <div className="mb-6 flex gap-3">
                            <input
                                type="text"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTimelineNote()}
                                placeholder="Escribe una nota rápida para agregar al historial..."
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/10 focus:border-brand"
                            />
                            <button
                                onClick={handleAddTimelineNote}
                                disabled={!newNote.trim() || isAddingNote}
                                className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                        {/* History List */}
                        <div className="space-y-4">
                            {loadingHistory ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full mx-auto"></div>
                                </div>
                            ) : historyNotes.length > 0 ? (
                                historyNotes.map((note) => (
                                    <div key={note.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 ring-4 ring-white"></div>
                                            <div className="w-0.5 flex-1 bg-slate-100 group-last:hidden"></div>
                                        </div>
                                        <div className="pb-6 flex-1">
                                            <div className="bg-white border border-slate-100 p-3 rounded-lg shadow-sm hover:border-slate-200 transition-colors">
                                                <p className="text-sm text-slate-600">{note.description}</p>
                                                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                                                    <span>{new Date(note.date).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                    No hay notas en el historial.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
