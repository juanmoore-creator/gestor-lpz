import React, { useState } from 'react';
import { useClients } from '../../context/ClientsContext';
import { Search, X, User, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface LinkClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    onLinkSuccess: (clientName: string) => void;
}

export const LinkClientModal: React.FC<LinkClientModalProps> = ({ isOpen, onClose, conversationId, onLinkSuccess }) => {
    const { clients } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
    );

    const handleLink = async () => {
        if (!selectedClientId) return;

        setIsSaving(true);
        try {
            const conversationRef = doc(db, 'whatsapp_conversations', conversationId);
            await updateDoc(conversationRef, {
                clientId: selectedClientId
            });

            const client = clients.find(c => c.id === selectedClientId);
            onLinkSuccess(client?.name || 'Cliente');
            onClose();
        } catch (error) {
            console.error("Error linking client:", error);
            alert("Error al vincular el cliente");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">Vincular Cliente Existente</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredClients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Search size={40} className="mb-2 opacity-20" />
                            <p className="text-sm">No se encontraron clientes</p>
                        </div>
                    ) : (
                        filteredClients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => setSelectedClientId(client.id)}
                                className={clsx(
                                    "p-3 rounded-xl cursor-pointer transition-all border flex items-center gap-3",
                                    selectedClientId === client.id
                                        ? "bg-blue-50 border-blue-200 shadow-sm"
                                        : "bg-white border-transparent hover:bg-slate-50"
                                )}
                            >
                                <div className={clsx(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                    selectedClientId === client.id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                                )}>
                                    <User size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={clsx(
                                        "font-semibold truncate",
                                        selectedClientId === client.id ? "text-blue-900" : "text-slate-800"
                                    )}>
                                        {client.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate">{client.email || client.phone}</p>
                                </div>
                                {selectedClientId === client.id && (
                                    <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center animate-in zoom-in spin-in-90 duration-200">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleLink}
                        disabled={!selectedClientId || isSaving}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                    >
                        {isSaving ? 'Vinculando...' : 'Vincular Cliente'}
                    </button>
                </div>
            </div>
        </div>
    );
};
