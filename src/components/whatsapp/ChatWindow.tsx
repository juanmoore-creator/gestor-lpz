import React, { useState, useRef, useEffect } from 'react';
import { useWhatsappMessages, type WhatsappMessage } from '../../hooks/useWhatsappMessages';
import { useWhatsappSender } from '../../hooks/useWhatsappSender';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Send, User, ChevronLeft, Search, MoreVertical, CheckCheck, X, UserPlus, Link as LinkIcon, Unlink, Sparkles } from 'lucide-react';
import { SuggestionCard } from './SuggestionCard';
import { LinkClientModal } from './LinkClientModal';
import { CreateClientFromChatModal } from './CreateClientFromChatModal';
import ScheduleMeetingModal from '../modals/ScheduleMeetingModal';
import { clsx } from 'clsx';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClients } from '../../context/ClientsContext';
import type { WhatsappConversation } from '../../types/index';

interface ChatWindowProps {
    conversationId: string | null;
    phoneNumber: string | undefined;
    contactName: string | undefined;
    assignedTo?: string;
    onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversationId,
    phoneNumber,
    contactName,
    onBack
}) => {
    const navigate = useNavigate();
    const { messages, loading } = useWhatsappMessages(conversationId);
    const [newMessage, setNewMessage] = useState('');
    const { sendMessage, isSending } = useWhatsappSender();
    const { getClientById } = useClients();
    const [currentConversation, setCurrentConversation] = useState<WhatsappConversation | null>(null);
    const [showLinkClientModal, setShowLinkClientModal] = useState(false);
    const [showCreateClientModal, setShowCreateClientModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [replyingTo, setReplyingTo] = useState<WhatsappMessage | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // AI Copilot States
    const [showAnalysisMenu, setShowAnalysisMenu] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const handleAnalyzeConversation = async (count: number) => {
        setIsAnalyzing(true);
        setShowAnalysisMenu(false);
        setAnalysisResult(null);

        try {
            // 1. Prepare messages
            // Take last N messages
            const lastMessages = [...messages].slice(-count);

            // Format for API
            const formattedMessages = lastMessages.map(msg => ({
                sender: msg.direction === 'outgoing' ? 'me' : 'client',
                text: msg.text
            }));

            // 2. Call API
            const response = await fetch('/api/ai/analyze-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: formattedMessages })
            });

            if (!response.ok) throw new Error('Error en análisis');

            const data = await response.json();
            setAnalysisResult(data);
        } catch (error) {
            console.error('Error analyzing conversation:', error);
            alert('No se pudo analizar la conversación. Intenta de nuevo.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Fetch conversation details to get clientId updates
    useEffect(() => {
        if (!conversationId) {
            setCurrentConversation(null);
            return;
        }

        const unsub = onSnapshot(doc(db, 'whatsapp_conversations', conversationId), (doc) => {
            if (doc.exists()) {
                setCurrentConversation({ id: doc.id, ...doc.data() } as WhatsappConversation);
            }
        });

        return () => unsub();
    }, [conversationId]);

    const linkedClient = currentConversation?.clientId ? getClientById(currentConversation.clientId) : null;

    const handleDisconnectClient = async () => {
        if (!conversationId || !confirm('¿Estás seguro de desvincular este cliente?')) return;
        try {
            await updateDoc(doc(db, 'whatsapp_conversations', conversationId), {
                clientId: null
            });
            setShowMenu(false);
        } catch (error) {
            console.error('Error disconnecting client:', error);
            alert('Error al desvincular cliente');
        }
    };

    // Filter messages based on search query
    const filteredMessages = messages.filter(msg =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Auto scroll to bottom when new messages arrive
    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isSearching, conversationId, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !phoneNumber || isSending) return;

        // Use whatsapp_id if available (for native context), otherwise fallback to Firestore ID (though Meta API will likely reject it, it keeps the UI logic working)
        const replyId = replyingTo?.whatsapp_id || replyingTo?.id;
        const result = await sendMessage(phoneNumber, newMessage, replyId);

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
                            <h3 className="font-bold text-slate-900 leading-tight truncate max-w-[150px] md:max-w-none flex items-center gap-2">
                                {linkedClient ? (
                                    <>
                                        <span>{linkedClient.name}</span>
                                        <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                                            {contactName || phoneNumber}
                                        </span>
                                    </>
                                ) : (
                                    contactName || phoneNumber
                                )}
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

                        {/* Sparkles / Copilot Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAnalysisMenu(!showAnalysisMenu)}
                                className={clsx(
                                    "p-2 transition-colors relative",
                                    showAnalysisMenu || analysisResult ? "text-blue-600 bg-blue-50 rounded-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                                title="Copiloto IA"
                            >
                                <Sparkles size={20} />
                                {analysisResult && (
                                    <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full ring-1 ring-white" />
                                )}
                            </button>

                            {showAnalysisMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowAnalysisMenu(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2">
                                                <Sparkles size={12} /> Analizar últimos...
                                            </p>
                                        </div>
                                        <button onClick={() => handleAnalyzeConversation(5)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700">5 mensajes</button>
                                        <button onClick={() => handleAnalyzeConversation(10)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700">10 mensajes</button>
                                        <button onClick={() => handleAnalyzeConversation(20)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700">20 mensajes</button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <MoreVertical size={20} />
                            </button>

                            {showMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {linkedClient ? (
                                            <>
                                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Cliente Vinculado</p>
                                                    <p className="font-bold text-slate-800 truncate">{linkedClient.name}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (linkedClient) {
                                                            navigate('/app/clients', { state: { selectedClientId: linkedClient.id } });
                                                        }
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <User size={16} />
                                                    Ver Ficha de Cliente
                                                </button>
                                                <button
                                                    onClick={handleDisconnectClient}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Unlink size={16} />
                                                    Desvincular Cliente
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Acciones</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowCreateClientModal(true);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <UserPlus size={16} />
                                                    Crear Nuevo Cliente
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowLinkClientModal(true);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <LinkIcon size={16} />
                                                    Vincular a Existente
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
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
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
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
                    const replyContext = msg.reply_to_message_id
                        ? messages.find(m => m.whatsapp_id === msg.reply_to_message_id || m.id === msg.reply_to_message_id)
                        : undefined;

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
                                {replyContext && (
                                    <div className={clsx(
                                        "mb-2 p-2 rounded-md border-l-4 text-xs cursor-pointer active:opacity-75",
                                        isOutgoing
                                            ? "bg-blue-700/50 border-blue-300 text-blue-100"
                                            : "bg-slate-100 border-green-500 text-slate-600"
                                    )}>
                                        <p className="font-bold opacity-90 mb-0.5">
                                            {replyContext.direction === 'outgoing' ? 'Tú' : (contactName || phoneNumber)}
                                        </p>
                                        <p className="line-clamp-2 opacity-80">{replyContext.text}</p>
                                    </div>
                                )}
                                <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                                <div className={clsx(
                                    "flex items-center justify-end gap-1 mt-1",
                                    isOutgoing ? "text-blue-100" : "text-slate-400"
                                )}>
                                    <button
                                        onClick={() => {
                                            setReplyingTo(msg);
                                            textareaRef.current?.focus();
                                        }}
                                        className="mr-auto text-[10px] font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Responder
                                    </button>
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
            <footer className="bg-white p-3 md:p-4 border-t border-slate-200 relative">
                {/* AI Suggestion Card */}
                {(analysisResult || isAnalyzing) && (
                    <SuggestionCard
                        result={analysisResult}
                        isLoading={isAnalyzing}
                        onClose={() => setAnalysisResult(null)}
                        onApplyReply={(text) => {
                            setNewMessage(text);
                            // Optional: focus textarea
                            textareaRef.current?.focus();
                        }}
                        onExecuteAction={(action) => {
                            if (action === 'SCHEDULE_MEETING') {
                                setShowScheduleModal(true);
                            }
                        }}
                    />
                )}

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

            {/* Modals */}
            {
                conversationId && (
                    <>
                        <LinkClientModal
                            isOpen={showLinkClientModal}
                            onClose={() => setShowLinkClientModal(false)}
                            conversationId={conversationId as string}
                            onLinkSuccess={() => { }}
                        />
                        <CreateClientFromChatModal
                            isOpen={showCreateClientModal}
                            onClose={() => setShowCreateClientModal(false)}
                            conversationId={conversationId as string}
                            initialPhoneNumber={phoneNumber}
                            initialName={contactName}
                            onLinkSuccess={() => { }}
                        />

                        {/* Schedule Meeting Modal - connected to AI Action */}
                        <ScheduleMeetingModal
                            isOpen={showScheduleModal}
                            onClose={() => setShowScheduleModal(false)}
                            // initialClientId={linkedClient?.id} // Removed as prop does not exist
                            initialNotes={analysisResult ? `Sugerido por Copiloto:\n${analysisResult.analysis}` : ''}
                        />
                    </>
                )
            }
        </div >
    );
};
