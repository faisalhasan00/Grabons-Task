import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function checkOpenRouter() {
    const apiKey = process.env.openRouter;
    if (!apiKey) {
        console.error('openRouter key is missing');
        return;
    }

    try {
        console.log('Fetching OpenRouter models...');
        const response = await axios.get('https://openrouter.ai/api/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        const freeModels = response.data.data
            .filter((m: any) => m.id.includes(':free'))
            .map((m: any) => m.id);

        console.log('--- AVAILABLE OPENROUTER FREE MODELS ---');
        console.log(freeModels.slice(0, 10));

        // Test the first one
        if (freeModels.length > 0) {
            const testModel = freeModels[0];
            console.log(`Testing ${testModel}...`);
            const testResp = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: testModel,
                messages: [{ role: 'user', content: 'Say OK' }]
            }, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            console.log(`Test Result: ${testResp.data.choices[0].message.content}`);
        }
    } catch (e: any) {
        console.error('OpenRouter Check Failed:', e.message);
    }
}

checkOpenRouter();
