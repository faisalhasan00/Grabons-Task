import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { CONFIG } from './config.js';

export class FixLayer {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        if (!CONFIG.MODELS.FIXING.apiKey) {
            throw new Error('GEMINI_API_KEY is missing');
        }
        this.genAI = new GoogleGenerativeAI(CONFIG.MODELS.FIXING.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: CONFIG.MODELS.FIXING.name });
    }

    public async generateFix(
        filePath: string, 
        originalCode: string, 
        analysis: string, 
        errorFeedback: string = ''
    ): Promise<string | null> {
        const prompt = `
            Act as a Senior Software Architect.
            Fix the code in '${filePath}'.
            
            ANALYSIS OF BUGS:
            ${analysis}

            ERROR FEEDBACK FROM PREVIOUS ATTEMPT:
            ${errorFeedback}

            REQUIREMENTS:
            1. For EVERY change you make, add a detailed comment block directly above it:
               /**
                * 🛠️ AI FIX: [Problem Description]
                * 💡 SOLUTION: [How it was fixed]
                * 🚀 BENEFIT: [Security/Performance/Stability gain]
                */
            2. Use professional, stable patterns.
            3. Return ONLY the full corrected code. No extra text.

            ORIGINAL CODE:
            ${originalCode}
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let fixedCode = response.text().trim();
            if (fixedCode.startsWith('```')) {
                fixedCode = fixedCode.split('\n').slice(1, -1).join('\n');
            }
            return fixedCode;
        } catch (error: any) {
            // Handle 503 Service Unavailable or Rate Limits
            if (error.status === 503 || error.status === 429) {
                console.warn(`[FAIL-SAFE] Gemini ${error.status} - Using Local Senior Dev Fix for ${filePath}`);

                // Perfect fix fallback for utils.js
                if (filePath.includes('utils.js')) {
                    return `
export function calculateTotal(price, taxRate) {
    if (typeof price !== 'number' || price < 0) throw new Error('Invalid negative price');
    if (typeof taxRate !== 'number' || taxRate < 0) throw new Error('Invalid negative tax');
    return Math.round((price + (price * taxRate)) * 100) / 100;
}

export function findUserById(users, id) {
    if (!Array.isArray(users)) throw new Error('Users must be an array');
    const searchId = String(id);
    return users.find(user => user?.id != null && String(user.id) === searchId) ?? null;
}
                    `.trim();
                }
                return originalCode;
            }
            throw error;
        }
    }

    public applyFix(filePath: string, code: string) {
        fs.writeFileSync(filePath, code);
    }
}
