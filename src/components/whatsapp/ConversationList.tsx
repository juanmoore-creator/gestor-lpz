import React from 'react';
import { useWhatsappConversations } from '../../hooks/useWhatsappConversations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, User, Clock, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

interface ConversationListProps {
    userId: string | undefined;
    selectedId: string | null;
    onSelectConversation: (id: string) => void;
    onNewChat: (phone: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    userId,
    selectedId,
    onSelectConversation,
    onNewChat
}) => {
    const { conversations, loading, error } = useWhatsappConversations(userId);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [newPhone, setNewPhone] = useState('');

    const handleStartNewChat = () => {
        if (!newPhone.trim()) return;
        onNewChat(newPhone.trim());
        setIsNewChatModalOpen(false);
        setNewPhone('');
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 w-full bg-slate-100 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500 text-sm">Error al cargar conversaciones</div>;
    }

    return (
        <div className="flex flex-col overflow-y-auto h-full bg-white relative">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-600" />
                    Chats de WhatsApp
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsNewChatModalOpen(true)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Nuevo Chat"
                    >
                        <Plus size={18} />
                    </button>
                    <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-1 rounded-full">
                        {conversations.length}
                    </span>
                </div>
            </div>

            {/* New Chat Modal/Overlay */}
            {isNewChatModalOpen && (
                <div className="absolute inset-0 bg-white z-20 animate-in slide-in-from-top duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Enviar Nuevo Mensaje</h3>
                        <button onClick={() => setIsNewChatModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Número de Teléfono</label>
                            <input
                                autoFocus
                                type="tel"
                                placeholder="Ej: 5491112345678"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleStartNewChat()}
                            />
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                <span className="font-bold text-blue-500">Importante:</span> Incluye código de país.<br />
                                Para Argentina móvil: <span className="font-mono bg-slate-100 px-1">54 + 9 + área + número</span>
                            </p>
                        </div>
                        <button
                            onClick={handleStartNewChat}
                            disabled={!newPhone.trim()}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                        >
                            Comenzar Chat
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-400 text-center">
                        <MessageSquare size={40} className="mb-3 opacity-20" />
                        <p className="text-sm">No hay conversaciones activas</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelectConversation(conv.id)}
                            className={clsx(
                                "w-full p-4 flex items-start gap-4 transition-all duration-200 border-b border-slate-50 relative",
                                selectedId === conv.id ? "bg-blue-50/50" : "hover:bg-slate-50"
                            )}
                        >
                            {selectedId === conv.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r" />
                            )}

                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border-2 border-white shadow-sm">
                                <User size={24} />
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h3 className="font-semibold text-slate-800 truncate">
                                        {conv.contactName || conv.contactPhoneNumber}
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2 flex items-center gap-1">
                                        <Clock size={10} />
                                        {conv.lastMessageTimestamp && format(conv.lastMessageTimestamp.toDate(), 'HH:mm', { locale: es })}
                                    </span>
                                </div>
                                <p className={clsx(
                                    "text-sm truncate pr-4",
                                    conv.unread ? "text-slate-900 font-semibold" : "text-slate-500"
                                )}>
                                    {conv.lastMessageText || 'Sin mensajes'}
                                </p>
                            </div>

                            {conv.unread && (
                                <div className="h-2.5 w-2.5 rounded-full bg-blue-600 mt-1.5 ring-4 ring-white" />
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
