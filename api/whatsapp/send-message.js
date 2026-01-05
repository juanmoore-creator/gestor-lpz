import { saveMessageToConversation } from '../services/whatsappDB.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { to, text } = req.body;

    if (!to || !text) {
        return res.status(400).json({ error: 'Missing "to" or "text" fields' });
    }

    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiToken || !phoneNumberId) {
        console.error('Missing WhatsApp environment variables');
        return res.status(500).json({ error: 'WhatsApp API not configured' });
    }

    try {
        // 1. Send message via Meta Graph API
        // Note: Currently using 'type: text' for direct chat. 
        // For 'type: template', the body structure changes to use the 'template' field.
        const response = await fetch(
            `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'text',
                    text: { body: text },
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Meta API Error:', data);
            return res.status(response.status).json({
                error: 'Error sending message through Meta API',
                details: data
            });
        }

        // 2. Save to Firestore
        try {
            await saveMessageToConversation({
                from: to,
                text: text,
                direction: 'outgoing',
                timestamp: Date.now()
            });
        } catch (dbError) {
            console.error('Error saving outgoing message to DB:', dbError);
            // We still return success since the message was actually sent
        }

        return res.status(200).json({
            success: true,
            message_id: data.messages?.[0]?.id
        });

    } catch (error) {
        console.error('Send Message Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
