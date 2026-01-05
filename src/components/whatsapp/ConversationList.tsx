import React from 'react';
import { useWhatsappConversations } from '../../hooks/useWhatsappConversations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, User, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface ConversationListProps {
    userId: string | undefined;
    selectedId: string | null;
    onSelectConversation: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    userId,
    selectedId,
    onSelectConversation
}) => {
    const { conversations, loading, error } = useWhatsappConversations(userId);

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
        <div className="flex flex-col overflow-y-auto h-full bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-600" />
                    Chats de WhatsApp
                </h2>
                <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-1 rounded-full">
                    {conversations.length}
                </span>
            </div>

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
