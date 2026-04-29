import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// ==========================================
// CONFIGURATION LAYER (TypeScript Edition)
// ==========================================
// Why: Type-safe configuration ensures that we catch missing 
// environment variables before the agent starts its loop.

export const CONFIG = {
    TARGET_REPO: process.env.TARGET_REPO || './Project',
    LOG_DIR: path.resolve('./logs'),

    // Multi-LLM Strategy (Verified Direct Google Gemini 2.5)
    MODELS: {
        REASONING: {
            provider: 'google',
            name: 'gemini-2.5-flash',
            apiKey: process.env.GEMINI_API_KEY
        },
        FIXING: {
            provider: 'google',
            name: 'gemini-2.5-flash',
            apiKey: process.env.GEMINI_API_KEY
        },
        EVALUATION: {
            provider: 'google',
            name: 'gemini-2.5-flash',
            apiKey: process.env.GEMINI_API_KEY
        }
    },

    AGENT: {
        POLLING_INTERVAL: 10000,
        MAX_RETRIES: 3,
        TEST_COMMAND: 'npm test',
        PORT: Number(process.env.PORT) || 3000
    }
};

// Ensure log directory exists
if (!fs.existsSync(CONFIG.LOG_DIR)) {
    fs.mkdirSync(CONFIG.LOG_DIR);
}

export const PATHS = {
    STATS: path.join(CONFIG.LOG_DIR, 'stats.json'),
    ACTIVITY: path.join(CONFIG.LOG_DIR, 'agent_activity.log'),
    PERFORMANCE: path.join(CONFIG.LOG_DIR, 'performance_log.json')
};
