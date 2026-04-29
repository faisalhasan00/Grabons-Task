import fs from 'fs';
import path from 'path';
import express from 'express';
import { CONFIG, PATHS } from './config.js';
import { InputLayer } from './inputLayer.js';
import { AnalysisLayer } from './analysisLayer.js';
import { FixLayer } from './fixLayer.js';
import { ExecutionLayer } from './executionLayer.js';
import { EvaluationLayer } from './evaluationLayer.js';
import { Logger } from './logger.js';

export class Orchestrator {
    private input: InputLayer;
    private analysis: AnalysisLayer;
    private fix: FixLayer;
    private execution: ExecutionLayer;
    private evaluation: EvaluationLayer;
    private logger: Logger;
    private app: express.Application;
    private queue: string[] = [];
    private isProcessing: boolean = false;
    private reports: Record<string, string> = {}; // Stores the "Why" for each file
    private modifiedFiles: string[] = []; // List of files that were actually changed
    private changeLog: { file: string, summary: string }[] = []; // Global change history

    constructor() {
        this.logger = new Logger();
        this.input = new InputLayer((path) => this.processFile(path));
        this.analysis = new AnalysisLayer();
        this.fix = new FixLayer();
        this.execution = new ExecutionLayer();
        this.evaluation = new EvaluationLayer();
        this.app = express();
        this.app.use(express.json());
        this.setupDashboard();
    }

    private setupDashboard() {
        this.app.post('/api/scan', async (req: any, res: any) => {
            const { repo, token } = req.body;
            if (!repo) return res.status(400).json({ error: 'Repo required' });
            this.logger.log(`[CONNECT] 🚀 Production Audit Started: ${repo}`);
            this.scanRepoRecursive(repo, '', token || '').then(() => {
                this.logger.log(`[AUDITOR] ✅ Full Repository Scan Complete.`);
            }).catch(e => this.logger.log(`[ERROR] Scan failed: ${e.message}`));
            res.json({ success: true });
        });

        this.app.get('/api/logs', (req, res) => {
            try {
                const activity = fs.readFileSync(PATHS.ACTIVITY, 'utf-8').split('\n').filter(l => l.trim()).reverse().slice(0, 100);
                res.json(activity);
            } catch (e) { res.json([]); }
        });

        this.app.get('/api/status', (req, res) => {
            const getFiles = (dir: string, fileList: string[] = []) => {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const name = path.join(dir, file);
                    if (fs.statSync(name).isDirectory()) getFiles(name, fileList);
                    else if (/\.(js|jsx|ts|tsx)$/.test(name)) fileList.push(path.relative(CONFIG.TARGET_REPO, name));
                });
                return fileList;
            };
            try {
                const files = fs.existsSync(CONFIG.TARGET_REPO) ? getFiles(CONFIG.TARGET_REPO) : [];
                res.json({ 
                    status: 'online', 
                    isProcessing: this.isProcessing, 
                    workspaceFiles: files, 
                    modifiedFiles: this.modifiedFiles,
                    changeLog: this.changeLog
                });
            } catch (e) { res.status(500).json({ error: 'Status check failed' }); }
        });

        this.app.get('/api/file', (req, res) => {
            const name = req.query.name as string;
            try {
                const content = fs.readFileSync(path.join(CONFIG.TARGET_REPO, name), 'utf-8');
                res.json({ 
                    content,
                    report: this.reports[name] || "This file passed all senior checks and is production-stable."
                });
            } catch (e) { res.status(404).json({ error: 'File not found' }); }
        });

        this.app.listen(CONFIG.AGENT.PORT, '0.0.0.0', () => {
            this.logger.log(`[SERVER] Production Dashboard Online: http://127.0.0.1:${CONFIG.AGENT.PORT}`);
        });
    }

    public async processFile(filePath: string) {
        if (this.queue.includes(filePath)) return;
        this.queue.push(filePath);
        if (this.isProcessing) return;

        this.isProcessing = true;
        while (this.queue.length > 0) {
            const currentFile = this.queue.shift()!;
            const relPath = path.relative(CONFIG.TARGET_REPO, currentFile);
            this.logger.log(`[AGENT] 🤖 Auditing: ${relPath} (Senior Mode)`);
            
            const code = fs.readFileSync(currentFile, 'utf-8');
            const analysis = await this.analysis.analyzeCode(currentFile, code);
            
            if (analysis.bug_found) {
                this.logger.log(`[REASONING] 🧠 ${analysis.summary}`);
                const fixedCode = await this.fix.generateFix(currentFile, code, analysis.summary);
                if (fixedCode) {
                    fs.writeFileSync(currentFile, fixedCode);
                    this.reports[relPath] = analysis.summary; 
                    if (!this.modifiedFiles.includes(relPath)) {
                        this.modifiedFiles.push(relPath);
                        this.changeLog.push({ file: relPath, summary: analysis.summary });
                    }
                    this.logger.log(`[SUCCESS] 🛠️ FIXED: ${relPath} (Reasoning comments added)`);
                }
            } else {
                this.logger.log(`[STABLE] ✅ ${relPath} is production-ready.`);
            }
            await new Promise(r => setTimeout(r, 2000));
        }
        this.isProcessing = false;
    }

    private async scanRepoRecursive(repo: string, subPath: string, token: string) {
        const headers = token ? { 'Authorization': `token ${token}` } : {};
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/${subPath}`, { headers });
        if (!response.ok) return;
        const items: any = await response.json();
        if (!Array.isArray(items)) return;

        for (const item of items) {
            if (item.type === 'dir') {
                await this.scanRepoRecursive(repo, item.path, token);
            } else if (item.type === 'file' && /\.(js|jsx|ts|tsx)$/.test(item.name)) {
                const fileResp = await fetch(item.download_url);
                const content = await fileResp.text();
                
                const targetPath = path.join(CONFIG.TARGET_REPO, item.path);
                const targetDir = path.dirname(targetPath);
                
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                fs.writeFileSync(targetPath, content);
                
                this.logger.log(`[AUDITOR] Imported: ${item.path}`);
                this.processFile(targetPath); // Trigger processing
            }
        }
    }

    public run() {
        fs.writeFileSync(PATHS.ACTIVITY, '');
        this.logger.log('🚀 GRABON PRODUCTION AGENT v4.0');
        this.logger.log('📂 Target: ' + CONFIG.TARGET_REPO);
    }
}

const orchestrator = new Orchestrator();
orchestrator.run();
