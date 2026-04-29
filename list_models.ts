import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listDirectGeminiModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is missing in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        console.log('Fetching available models from Google AI Studio...');
        // The SDK doesn't have a direct listModels, we use a fetch to the REST API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log('AVAILABLE MODELS:');
            data.models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log('No models found or error:', data);
        }
    } catch (error: any) {
        console.error('Failed to fetch models:', error.message);
    }
}

listDirectGeminiModels();
