
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust this for production security
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid input: "messages" array is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing");
        return res.status(500).json({ error: 'Server configuration error: API Key missing.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const conversationText = messages.map(m => `${m.sender}: ${m.text}`).join('\n');

        const prompt = `
      Actúa como un asistente inmobiliario experto llamado "Copiloto".
      Analiza la siguiente conversación de WhatsApp entre un agente y un cliente.
      Tu objetivo es identificar la intención del cliente, sugerir una respuesta empática y profesional, y recomendar una acción concreta si corresponde.

      Conversación:
      ${conversationText}

      Instrucciones de salida:
      Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura (sin bloques de código markdown):
      {
        "analysis": "Un resumen breve de 1-2 frases sobre la situación y el estado de ánimo del cliente.",
        "suggestedReply": "Una respuesta sugerida lista para enviar. Debe ser amable, profesional y mover la conversación hacia el cierre o el siguiente paso.",
        "recommendedAction": "La acción recomendada para el agente."
      }

      Posibles valores para "recommendedAction":
      - "SCHEDULE_MEETING": Si el cliente muestra interés en ver una propiedad, pide una cita o reunión.
      - "CREATE_NOTE": Si el cliente da información importante que recordar (presupuesto, preferencias, etc.).
      - "NONE": Si es una conversación casual o no requiere acción específica en el sistema.

      Asegúrate de que el JSON sea válido.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        // Clean up if somehow it sends markdown code blocks despite instructions (though responseMimeType should handle it)
        let jsonStr = text;
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const data = JSON.parse(jsonStr);

        return res.status(200).json(data);

    } catch (error) {
        console.error("Error calling Gemini:", error);
        return res.status(500).json({
            error: 'Error creating analysis',
            details: error.message
        });
    }
}
