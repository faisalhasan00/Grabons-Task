import { GoogleGenerativeAI } from '@google/generative-ai';
import { CONFIG } from './config.js';

/**
 * EVALUATION LAYER (Google Gemini Strategy)
 * 
 * How: Uses Gemini 1.5 Flash for high-speed triage.
 */
export class EvaluationLayer {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        if (!CONFIG.MODELS.EVALUATION.apiKey) {
            throw new Error('GEMINI_API_KEY is missing');
        }
        this.genAI = new GoogleGenerativeAI(CONFIG.MODELS.EVALUATION.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: CONFIG.MODELS.EVALUATION.name });
    }

    public async evaluate(testOutput: string): Promise<{ success: boolean; feedback: string }> {
        const prompt = `
        Analyze the following test failure.
        
        OUTPUT:
        ${testOutput}
        
        TASK:
        Extract the specific error and line of code that failed.
        Return ONLY valid JSON: {"error": "...", "line": "...", "summary": "..."}
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            if (text.startsWith('```')) {
                text = text.split('```')[1];
                if (text.startsWith('json')) text = text.substring(4);
            }

            const analysis = JSON.parse(text);
            return {
                success: false,
                feedback: `Error: ${analysis.error} at ${analysis.line}. ${analysis.summary}`
            };
        } catch (error) {
            return { success: false, feedback: 'Evaluation failed. Check logs.' };
        }
    }
}
