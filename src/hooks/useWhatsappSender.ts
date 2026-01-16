import { useState } from 'react';

interface SendMessageResponse {
    success: boolean;
    message_id?: string;
    error?: string;
    details?: any;
}

export const useWhatsappSender = () => {
    const [isSending, setIsSending] = useState(false);

    const sendMessage = async (phoneNumber: string, text: string, replyToMessageId?: string): Promise<SendMessageResponse> => {
        setIsSending(true);
        try {
            const body: any = {
                to: phoneNumber,
                text: text.trim(),
            };

            if (replyToMessageId) {
                body.context = {
                    message_id: replyToMessageId
                };
            }

            const response = await fetch('/api/whatsapp/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
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
