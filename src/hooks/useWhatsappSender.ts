import { useState } from 'react';

interface SendMessageResponse {
    success: boolean;
    message_id?: string;
    error?: string;
    details?: any;
}

export const useWhatsappSender = () => {
    const [isSending, setIsSending] = useState(false);

    const sendMessage = async (phoneNumber: string, text: string): Promise<SendMessageResponse> => {
        setIsSending(true);
        try {
            const response = await fetch('/api/whatsapp/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: phoneNumber,
                    text: text.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || 'Error sending message',
                    details: data.details
                };
            }

            return {
                success: true,
                message_id: data.message_id
            };
        } catch (error: any) {
            console.error('WhatsApp Sender Hook Error:', error);
            return {
                success: false,
                error: error.message || 'Network error or server unavailable'
            };
        } finally {
            setIsSending(false);
        }
    };

    return {
        sendMessage,
        isSending
    };
};
