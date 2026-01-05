import React, { useState } from 'react';
import { ConversationList } from '../components/whatsapp/ConversationList';
import { ChatWindow } from '../components/whatsapp/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useWhatsappConversations } from '../hooks/useWhatsappConversations';

const WhatsappAdminPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const { conversations } = useWhatsappConversations(user?.uid);

    const selectedConv = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar / List - Hidden on mobile if conversation selected */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <ConversationList
                    userId={user?.uid}
                    selectedId={selectedConversationId}
                    onSelectConversation={setSelectedConversationId}
                />
            </div>

            {/* Main Chat Area - Hidden on mobile if no conversation selected */}
            <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <ChatWindow
                    conversationId={selectedConversationId}
                    phoneNumber={selectedConv?.contactPhoneNumber}
                    contactName={selectedConv?.contactName}
                    onBack={() => setSelectedConversationId(null)}
                />
            </div>
        </div>
    );
};

export default WhatsappAdminPage;
