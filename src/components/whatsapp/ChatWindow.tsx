import React, { useState, useRef, useEffect } from 'react';
import { useWhatsappMessages, type WhatsappMessage } from '../../hooks/useWhatsappMessages';
import { useWhatsappSender } from '../../hooks/useWhatsappSender';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, User, ChevronLeft, Search, MoreVertical, CheckCheck, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ChatWindowProps {
    conversationId: string | null;
    phoneNumber: string | undefined;
    contactName: string | undefined;
    onBack?: () => void; // For mobile view
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversationId,
    phoneNumber,
    contactName,
    onBack
}) => {
    const { messages, loading } = useWhatsappMessages(conversationId);
    const [newMessage, setNewMessage] = useState('');
    const { sendMessage, isSending } = useWhatsappSender();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [replyingTo, setReplyingTo] = useState<WhatsappMessage | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Filter messages based on search query
    const filteredMessages = messages.filter(msg =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current && !isSearching) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isSearching]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !phoneNumber || isSending) return;

        const result = await sendMessage(phoneNumber, newMessage, replyingTo?.id);

        if (result.success) {
            setNewMessage('');
            setReplyingTo(null);
        } else {
            alert(`Error: ${result.error || 'Error al enviar mensaje'}`);
        }
    };

    if (!conversationId && !phoneNumber) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400 p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                    <img src="/whatsapp.png" alt="WhatsApp" className="w-12 h-12 opacity-20 grayscale"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Bienvenido a la Central de WhatsApp</h3>
                <p className="max-w-xs text-sm">Selecciona una conversación del panel izquierdo o inicia un nuevo chat para comenzar.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5] relative">
            {/* Header */}
            <header className="bg-white px-4 py-2 flex flex-col border-b border-slate-200 z-10 shadow-sm transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-600">
                            <ChevronLeft size={24} />
                        </button>
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-tight truncate max-w-[150px] md:max-w-none">
                                {contactName || phoneNumber}
                            </h3>
                            <p className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                {conversationId ? 'En línea' : 'Nuevo Chat'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setIsSearching(!isSearching);
                                if (isSearching) setSearchQuery('');
                            }}
                            className={clsx(
                                "p-2 transition-colors",
                                isSearching ? "text-blue-600 bg-blue-50 rounded-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Search size={20} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {isSearching && (
                    <div className="mt-2 pb-1 animate-in slide-in-from-top-2 duration-200">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar en el chat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth"
                style={{ backgroundImage: 'radial-gradient(#d1d1d1 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
            >
                {loading && messages.length === 0 && conversationId && (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                )}

                {filteredMessages.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Search size={40} className="mb-3 opacity-20" />
                        <p className="text-sm">No se encontraron mensajes coincidentes</p>
                    </div>
                )}

                {filteredMessages.map((msg) => {
                    const isOutgoing = msg.direction === 'outgoing';
                    return (
                        <div
                            key={msg.id}
                            className={clsx(
                                "flex w-full group",
                                isOutgoing ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={clsx(
                                "relative max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm transition-all",
                                isOutgoing
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                            )}>
                                <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                                <div className={clsx(
                                    "flex items-center justify-end gap-1 mt-1",
                                    isOutgoing ? "text-blue-100" : "text-slate-400"
                                )}>
                                    {!isOutgoing && (
                                        <button
                                            onClick={() => {
                                                setReplyingTo(msg);
                                                textareaRef.current?.focus();
                                            }}
                                            className="mr-auto text-[10px] font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Responder
                                        </button>
                                    )}
                                    <span className="text-[10px]">
                                        {format(msg.timestamp.toDate(), 'HH:mm', { locale: es })}
                                    </span>
                                    {isOutgoing && (
                                        <CheckCheck size={14} className={msg.status === 'read' ? 'text-green-300' : ''} />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <footer className="bg-white p-3 md:p-4 border-t border-slate-200">
                <form
                    onSubmit={handleSendMessage}
                    className="flex items-end gap-2 max-w-5xl mx-auto"
                >
                    <div className="flex-1 relative flex flex-col">
                        {replyingTo && (
                            <div className="mb-2 p-2 bg-slate-100 border-l-4 border-blue-500 rounded-r flex justify-between items-start animate-in slide-in-from-bottom-2">
                                <div className="text-xs text-slate-600 max-w-[90%] overflow-hidden">
                                    <span className="text-blue-600 font-bold block mb-0.5">Respondiendo a:</span>
                                    <p className="line-clamp-2">{replyingTo.text}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReplyingTo(null)}
                                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                                >
                                    <X size={14} className="text-slate-500" />
                                </button>
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            rows={1}
                            className={clsx(
                                "w-full bg-slate-50 border border-slate-200 px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none max-h-32",
                                replyingTo ? "rounded-b-2xl rounded-tr-2xl" : "rounded-2xl"
                            )}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className={clsx(
                            "h-11 w-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0",
                            !newMessage.trim() || isSending
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                        )}
                    >
                        {isSending ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                            <Send size={20} className="ml-0.5" />
                        )}
                    </button>
                </form>
            </footer>
        </div>
    );
};
