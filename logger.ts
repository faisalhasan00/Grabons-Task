import fs from 'fs';
import { PATHS } from './config.js';

/**
 * LOGGING & TELEMETRY LAYER
 * 
 * How: Combines event logging and performance tracking.
 * Why: To provide "Observability" into the agent's autonomous loop.
 */
export class Logger {
    public log(message: string) {
        const timestamp = new Date().toISOString();
        const entry = `[${timestamp}] ${message}\n`;
        console.log(entry.trim());
        fs.appendFileSync(PATHS.ACTIVITY, entry);
    }

    public recordMetric(layer: string, model: string, durationMs: number) {
        const metric = {
            timestamp: new Date().toISOString(),
            layer,
            model,
            durationSec: durationMs / 1000
        };
        
        let metrics = [];
        if (fs.existsSync(PATHS.PERFORMANCE)) {
            metrics = JSON.parse(fs.readFileSync(PATHS.PERFORMANCE, 'utf-8'));
        }
        metrics.push(metric);
        fs.writeFileSync(PATHS.PERFORMANCE, JSON.stringify(metrics, null, 2));
    }
}
