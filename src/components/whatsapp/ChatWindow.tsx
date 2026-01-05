import React, { useState, useRef, useEffect } from 'react';
import { useWhatsappMessages } from '../../hooks/useWhatsappMessages';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, User, ChevronLeft, Search, MoreVertical, CheckCheck } from 'lucide-react';
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
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !phoneNumber || sending) return;

        setSending(true);
        try {
            const response = await fetch('/api/whatsapp/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: phoneNumber,
                    text: newMessage.trim()
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error sending message');
            }

            setNewMessage('');
        } catch (err) {
            console.error(err);
            alert('Error al enviar mensaje');
        } finally {
            setSending(false);
        }
    };

    if (!conversationId) {
        return (
            <div className="hidden md:flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400 p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                    <img src="/whatsapp.png" alt="WhatsApp" className="w-12 h-12 opacity-20 grayscale"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Bienvenido a la Central de WhatsApp</h3>
                <p className="max-w-xs text-sm">Selecciona una conversación del panel izquierdo para comenzar a gestionar tus chats en tiempo real.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5] relative">
            {/* Header */}
            <header className="bg-white px-4 py-2 flex items-center justify-between border-b border-slate-200 z-10 shadow-sm">
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
                            En línea
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <Search size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth"
                style={{ backgroundImage: 'radial-gradient(#d1d1d1 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
            >
                {loading && messages.length === 0 && (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                )}

                {messages.map((msg) => {
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
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            rows={1}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none max-h-32"
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
                        disabled={!newMessage.trim() || sending}
                        className={clsx(
                            "h-11 w-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0",
                            !newMessage.trim() || sending
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                        )}
                    >
                        {sending ? (
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
