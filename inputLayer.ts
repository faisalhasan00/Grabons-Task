import chokidar from 'chokidar';
import crypto from 'crypto';
import fs from 'fs';
import { CONFIG } from './config.js';

/**
 * INPUT LAYER (Node.js Edition)
 * 
 * How: Uses 'chokidar' for high-performance, event-driven file watching.
 * Why: Unlike Python's polling, this layer is notified by the OS 
 * immediately when a file changes. It's more efficient and "pro."
 */
export class InputLayer {
    private fileHashes: Map<string, string> = new Map();
    private watcher: chokidar.FSWatcher;

    constructor(private onFileChanged: (filePath: string) => void) {
        this.watcher = chokidar.watch(CONFIG.TARGET_REPO, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true
        });

        this.setupWatcher();
    }

    private calculateHash(filePath: string): string {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    }

    private setupWatcher() {
        this.watcher.on('change', (path) => {
            const currentHash = this.calculateHash(path);
            const previousHash = this.fileHashes.get(path);

            if (currentHash !== previousHash) {
                console.log(`[InputLayer] File changed: ${path}`);
                this.fileHashes.set(path, currentHash);
                this.onFileChanged(path);
            }
        });

        this.watcher.on('add', (path) => {
            const currentHash = this.calculateHash(path);
            this.fileHashes.set(path, currentHash);
            console.log(`[InputLayer] New file detected: ${path}`);
            this.onFileChanged(path);
        });
    }

    public stop() {
        this.watcher.close();
    }
}
