import React, { useState, useEffect } from 'react';
import { useClients } from '../../context/ClientsContext';
import { UserPlus, X, Mail, Phone, User, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CreateClientFromChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    initialPhoneNumber?: string;
    initialName?: string;
    onLinkSuccess: (clientName: string) => void;
}

export const CreateClientFromChatModal: React.FC<CreateClientFromChatModalProps> = ({
    isOpen,
    onClose,
    conversationId,
    initialPhoneNumber,
    initialName,
    onLinkSuccess
}) => {
    const { addClient } = useClients();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialName) setName(initialName);
            // Si el teléfono tiene formato de WhatsApp (ej: 54911...), intentamos formatearlo un poco o dejarlo como está
            if (initialPhoneNumber) setPhone(initialPhoneNumber);
        }
    }, [isOpen, initialName, initialPhoneNumber]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            // 1. Crear Cliente
            const newClientId = await addClient({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                status: 'Nuevo',
                type: 'Comprador' // Default type, could be selectable
            });

            // 2. Vincular a la conversación
            const conversationRef = doc(db, 'whatsapp_conversations', conversationId);
            await updateDoc(conversationRef, {
                clientId: newClientId
            });

            onLinkSuccess(name.trim());
            onClose();
        } catch (error) {
            console.error("Error creating/linking client:", error);
            alert("Error al crear el cliente");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-600" />
                        Crear Nuevo Cliente
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ej: Juan Pérez"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Ej: +54 9 11..."
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    placeholder="Ej: juan@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSaving}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Guardar Cliente
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
