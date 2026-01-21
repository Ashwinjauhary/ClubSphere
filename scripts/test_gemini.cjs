const fs = require('fs');
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY || process.argv[2];

if (!API_KEY) {
    console.error("Error: API Key not found. Please set GEMINI_API_KEY env var or pass as argument.");
    process.exit(1);
}

const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const output = [];
            if (json.models) {
                output.push("Available Models:");
                json.models.forEach(m => {
                    if (m.supportedGenerationMethods.includes("generateContent")) {
                        output.push(`- ${m.name}`);
                    }
                });
            } else {
                output.push("Error: " + JSON.stringify(json));
            }
            fs.writeFileSync('scripts/models_utf8.txt', output.join('\n'), 'utf8');
            console.log("Written to scripts/models_utf8.txt");
        } catch (e) {
            console.error("Parse Error:", e);
        }
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
