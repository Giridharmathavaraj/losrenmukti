import selfsigned from 'selfsigned';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define localhost attributes
const attrs = [
  { name: 'commonName', value: 'localhost' },
];

async function run() {
    try {
        const pems = await selfsigned.generate(attrs, { 
            days: 365,
            keySize: 2048,
            algorithm: 'sha256',
            extensions: [{
                name: 'subjectAltName',
                altNames: [{
                    type: 2, // DNS
                    value: 'localhost'
                }, {
                    type: 7, // IP
                    ip: '127.0.0.1'
                }]
            }]
        });

        const certDir = path.join(__dirname, 'backend', 'certs');
        if (!fs.existsSync(certDir)) {
            fs.mkdirSync(certDir, { recursive: true });
        }

        fs.writeFileSync(path.join(certDir, 'localhost-cert.pem'), pems.cert);
        fs.writeFileSync(path.join(certDir, 'localhost-key.pem'), pems.private);

        console.log('✅ Legit self-signed certificates generated successfully in backend/certs/');
    } catch (err) {
        console.error('Failed to generate certs:', err);
    }
}

run();
