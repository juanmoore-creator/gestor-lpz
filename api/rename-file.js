import { google } from 'googleapis';
import { IncomingForm } from 'formidable';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Parse form data using formidable
        const form = new IncomingForm();
        const [fields] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        // Handle array or single value from formidable
        const fileId = Array.isArray(fields.fileId) ? fields.fileId[0] : fields.fileId;
        const newName = Array.isArray(fields.newName) ? fields.newName[0] : fields.newName;

        if (!fileId || !newName) {
            res.status(400).json({ error: 'Missing fileId or newName' });
            return;
        }

        // OAuth2 Credentials
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            console.error("ERROR: Faltan variables de OAuth2");
            throw new Error("Configuración OAuth2 incompleta en Vercel");
        }

        const oAuth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            'https://developers.google.com/oauthplayground'
        );

        oAuth2Client.setCredentials({ refresh_token: refreshToken });
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        // Call Drive API to update the file name
        const response = await drive.files.update({
            fileId: fileId,
            requestBody: {
                name: newName
            },
            fields: 'id, name', // We only need the ID and new name back
            supportsAllDrives: true,
            supportsTeamDrives: true,
        });

        res.status(200).json({
            success: true,
            id: response.data.id,
            name: response.data.name
        });

    } catch (error) {
        console.error("Google Drive Rename Error:", error);
        res.status(500).json({
            error: 'Rename failed',
            details: error.message
        });
    }
}
