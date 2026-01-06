// since the user has firebase-admin in package.json, let's use it for server-side logic.

import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ?
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

        const projectId = serviceAccount?.project_id ||
            process.env.VITE_FIREBASE_PROJECT_ID ||
            process.env.FIREBASE_PROJECT_ID;

        admin.initializeApp({
            credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
            projectId: projectId
        });
        console.log(`Firebase Admin (WhatsAppDB) initialized for project: ${projectId}`);
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
}

const firestore = admin.firestore();

/**
 * Saves a message to a conversation.
 * Finds conversation by phone number or creates a new one.
 * @param {Object} params
 * @param {string} params.from - Phone number
 * @param {string} params.text - Message content
 * @param {string} params.direction - 'incoming' or 'outgoing'
 * @param {number} [params.timestamp] - Unix ms timestamp
 */
export async function saveMessageToConversation({ from, text, direction, timestamp = Date.now() }) {
    const conversationsRef = firestore.collection('whatsapp_conversations');

    // 1. Find conversation by phoneNumber
    const q = await conversationsRef.where('contactPhoneNumber', '==', from).limit(1).get();

    let conversationId;
    let conversationData;

    if (q.empty) {
        // 2. Create new conversation
        const newConv = {
            contactPhoneNumber: from,
            contactName: from, // Default to phone number until we get more info
            assignedTo: 'system', // Default assignment, logic can be added later
            lastMessageTimestamp: admin.firestore.Timestamp.fromMillis(timestamp),
            lastMessageText: text,
            unread: direction === 'incoming'
        };
        const docRef = await conversationsRef.add(newConv);
        conversationId = docRef.id;
        conversationData = newConv;
    } else {
        // 3. Update existing conversation
        const doc = q.docs[0];
        conversationId = doc.id;
        conversationData = doc.data();

        await doc.ref.update({
            lastMessageTimestamp: admin.firestore.Timestamp.fromMillis(timestamp),
            lastMessageText: text,
            unread: direction === 'incoming' ? true : false
        });
    }

    // 4. Add message to subcollection
    const messagesRef = conversationsRef.doc(conversationId).collection('messages');
    await messagesRef.add({
        text,
        timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
        direction,
        status: direction === 'outgoing' ? 'sent' : 'received'
    });

    return conversationId;
}
