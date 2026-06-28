import fetch from 'node-fetch';

async function test() {
    try {
        const response = await fetch('http://127.0.0.1:54321/functions/v1/generate-daily-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);
    } catch(e) {
        console.error(e);
    }
}
test();
