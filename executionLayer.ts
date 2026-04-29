import { exec } from 'child_process';
import { CONFIG } from './config.js';

/**
 * EXECUTION LAYER (Node.js)
 * 
 * How: Executes shell commands via 'child_process' exec.
 * Why: To validate code in a real runtime environment.
 */
export class ExecutionLayer {
    public async runTests(filePath: string): Promise<{ success: boolean; output: string }> {
        return new Promise((resolve) => {
            // In a real project, we might run 'npm test filePath'
            const command = `${CONFIG.AGENT.TEST_COMMAND} ${filePath}`;
            
            exec(command, (error, stdout, stderr) => {
                const output = stdout + stderr;
                resolve({
                    success: !error,
                    output: output
                });
            });
        });
    }
}
