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

    // Webhook Verification (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('WEBHOOK_VERIFIED');
            return res.status(200).send(challenge);
        } else {
            return res.status(403).end();
        }
    }

    // Event Handling (POST)
    if (req.method === 'POST') {
        console.log("🔥 PAYLOAD RECIBIDO:", JSON.stringify(req.body, null, 2));
        try {
            const body = req.body;

            // Log incoming messages for debugging
            // console.log('Incoming webhook:', JSON.stringify(body, null, 2));

            if (body.object === 'whatsapp_business_account') {
                const entry = body.entry?.[0];
                const changes = entry?.changes?.[0];
                const value = changes?.value;
                const message = value?.messages?.[0];

                if (message) {
                    const from = message.from; // Sender number
                    const text = message.text?.body;
                    const timestamp = message.timestamp;

                    if (text) {
                        try {
                            await saveMessageToConversation({
                                from,
                                text,
                                direction: 'incoming',
                                timestamp: parseInt(timestamp) * 1000, // Convert to ms
                                whatsapp_id: message.id
                            });
                        } catch (dbError) {
                            console.error('Error saving to DB:', dbError);
                        }
                    }
                }

                // Always respond with 200 OK to Meta
                return res.status(200).send('EVENT_RECEIVED');
            } else {
                return res.status(404).end();
            }
        } catch (error) {
            console.error('Webhook Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    return res.status(405).end();
}
