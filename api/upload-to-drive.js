import { google } from 'googleapis';
import { IncomingForm } from 'formidable';
import fs from 'fs';

// Helper to enable parsing of body in Vercel. 
// However, since we use formidable which handles streams, we actually need to disable the default body parser in Next.js/Vercel
// But in our 'local-server.js', we pass the raw 'req' which is perfect.
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
        // 1. Authenticate with Google
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Fix newlines if passed as string

        if (!clientEmail || !privateKey) {
            console.error("Missing Google Credentials");
            res.status(500).json({ error: 'Server configuration error: Missing Google Credentials' });
            return;
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 2. Parse the incoming form data
        const form = new IncomingForm();

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        // formidable v3 returns arrays for files. Get the first file.
        // The key 'file' must match what the frontend sends.
        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!uploadedFile) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // 3. Upload to Google Drive
        const fileMetadata = {
            name: uploadedFile.originalFilename || 'uploaded_file',
            // optional: parents: ['folder_id_if_needed']
        };

        const media = {
            mimeType: uploadedFile.mimetype,
            body: fs.createReadStream(uploadedFile.filepath),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink, webContentLink',
        });

        // 4. Return the result
        res.status(200).json({
            success: true,
            fileId: response.data.id,
            name: response.data.name,
            webViewLink: response.data.webViewLink,
        });

    } catch (error) {
        console.error("Google Drive Upload Error:", error);
        res.status(500).json({
            error: 'Upload failed',
            details: error.message
        });
    }
}
