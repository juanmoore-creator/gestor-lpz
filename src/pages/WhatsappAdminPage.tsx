import React, { useState, useEffect } from 'react';
import { ConversationList } from '../components/whatsapp/ConversationList';
import { ChatWindow } from '../components/whatsapp/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useWhatsappConversations } from '../hooks/useWhatsappConversations';
import { useSearchParams } from 'react-router-dom';

const WhatsappAdminPage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const phoneParam = searchParams.get('phone');

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [manualPhone, setManualPhone] = useState<string | null>(null);
    const { conversations } = useWhatsappConversations(user?.uid);

    // Auto-select conversation based on phone parameter
    useEffect(() => {
        if (phoneParam && conversations.length > 0) {
            const cleanPhone = phoneParam.replace(/\D/g, '');
            const found = conversations.find(c => c.contactPhoneNumber.replace(/\D/g, '') === cleanPhone);
            if (found) {
                setSelectedConversationId(found.id);
                setManualPhone(null);
            } else {
                setSelectedConversationId(null);
                setManualPhone(cleanPhone);
            }
        }
    }, [phoneParam, conversations]);

    const selectedConv = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar / List - Hidden on mobile if conversation selected */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 ${(selectedConversationId || manualPhone) ? 'hidden md:flex' : 'flex'}`}>
                <ConversationList
                    userId={user?.uid}
                    selectedId={selectedConversationId}
                    onSelectConversation={(id) => {
                        setSelectedConversationId(id);
                        setManualPhone(null);
                    }}
                    onNewChat={(phone: string) => {
                        setManualPhone(phone);
                        setSelectedConversationId(null);
                    }}
                />
            </div>

            {/* Main Chat Area - Hidden on mobile if no conversation selected */}
            <div className={`flex-1 flex flex-col bg-white overflow-hidden ${(!selectedConversationId && !manualPhone) ? 'hidden md:flex' : 'flex'}`}>
                <ChatWindow
                    conversationId={selectedConversationId}
                    phoneNumber={selectedConv?.contactPhoneNumber || manualPhone || undefined}
                    contactName={selectedConv?.contactName}
                    onBack={() => {
                        setSelectedConversationId(null);
                        setManualPhone(null);
                    }}
                />
            </div>
        </div>
    );
};

export default WhatsappAdminPage;
