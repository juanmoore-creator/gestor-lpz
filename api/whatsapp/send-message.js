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

    let { to, text, context } = req.body;

    // Sanitize phone number: remove all non-digits
    if (to) {
        to = to.replace(/\D/g, '');
    }

    if (!to || !text) {
        return res.status(400).json({ error: 'Missing "to" or "text" fields' });
    }

    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiToken || !phoneNumberId) {
        console.error('Missing WhatsApp environment variables');
        return res.status(500).json({ error: 'WhatsApp API not configured' });
    }


    // Helper function for Argentina routing
    function formatNumberForArgentinaRouting(number) {
        // Ensure it's a string
        const numStr = String(number);

        // Check if it starts with 549 (Argentina Mobile standard format)
        if (numStr.startsWith('549')) {
            // Remove the '9' (which is at index 2)
            // 549... -> 54...
            let cleanNumber = '54' + numStr.substring(3);

            // Logic to detect area code and insert '15'
            // We need to look at what comes after '54'
            // If it's '11' (Buenos Aires), area code length is 2.
            // Otherwise, we assume standard 3 digit area code for other major/minor cities.

            const rest = cleanNumber.substring(2); // Everything after 54

            let areaCode = '';
            let localNumber = '';

            if (rest.startsWith('11')) {
                areaCode = '11';
                localNumber = rest.substring(2);
            } else {
                // Assume 3 digits for other areas (e.g. 221, 351, etc)
                areaCode = rest.substring(0, 3);
                localNumber = rest.substring(3);
            }

            // Construct new format: 54 + Area + 15 + Local
            return `54${areaCode}15${localNumber}`;
        }

        // Fallback: return original if it doesn't match criteria
        return numStr;
    }

    // Apply formatting logic just before sending to Meta
    // Note: We keep the original 'to' for saving to database to maintain consistency with incoming webhooks
    const originalTo = to;
    const metaTo = formatNumberForArgentinaRouting(to);

    try {
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: metaTo,
            type: 'text',
            text: {
                preview_url: false,
                body: text
            }
        };

        if (context?.message_id) {
            payload.context = {
                message_id: context.message_id
            };
        }

        const response = await fetch(
            `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
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
                timestamp: Date.now(),
                ...(context?.message_id && { reply_to_message_id: context.message_id }),
                whatsapp_id: data.messages?.[0]?.id
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
