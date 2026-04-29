/**
 * GRABON AGENT - FRONTEND LOGIC
 */

const repoInput = document.getElementById('repo-url');
const connectBtn = document.getElementById('connect-btn');
const fileList = document.getElementById('file-list');
const codeContent = document.getElementById('code-content');
const currentFileName = document.getElementById('current-file-name');
const shareBtn = document.getElementById('share-btn');
const pushBtn = document.getElementById('push-btn');
const repoBadge = document.getElementById('repo-badge');
const telemetryLogs = document.getElementById('telemetry-logs');
const githubTokenInput = document.getElementById('github-token');
const tabGithub = document.getElementById('tab-github');
const tabAgent = document.getElementById('tab-agent');
const agentStatusText = document.getElementById('agent-status-text');

let connectedRepo = null;
let currentView = 'github'; // 'github' or 'agent'
let navigationStack = [];
let currentFileData = { name: '', content: '', path: '' };

// --- TABS LOGIC ---

tabGithub.onclick = () => {
    currentView = 'github';
    tabGithub.classList.add('active');
    tabAgent.classList.remove('active');
    refreshView();
};

tabAgent.onclick = () => {
    currentView = 'agent';
    tabAgent.classList.add('active');
    tabGithub.classList.remove('active');
    refreshView();
};

async function refreshView() {
    if (!connectedRepo) return;
    if (currentView === 'github') {
        const contents = await fetchRepoContents(connectedRepo, navigationStack[navigationStack.length - 1] || '');
        renderFileList(contents, navigationStack.length > 0);
    } else {
        const response = await fetch('/api/status');
        const data = await response.json();
        renderLocalFileList(data.workspaceFiles || []);
    }
}

// --- GITHUB API LOGIC ---

async function fetchRepoContents(repo, path = '') {
    const token = githubTokenInput.value.trim();
    const headers = {};
    if (token) headers['Authorization'] = `token ${token}`;

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers });
        if (!response.ok) throw new Error('Repository not found or API limit reached');
        return await response.json();
    } catch (err) {
        addLog(`[ERROR] GitHub API: ${err.message}`);
        return [];
    }
}

async function fetchFileRaw(downloadUrl) {
    const response = await fetch(downloadUrl);
    return await response.text();
}

function renderFileList(contents, isSubdir = false) {
    fileList.innerHTML = '';
    if (isSubdir) {
        const back = document.createElement('div');
        back.className = 'file-item folder';
        back.innerHTML = `<span>⬅️</span> .. (Back)`;
        back.onclick = () => {
            navigationStack.pop();
            refreshView();
        };
        fileList.appendChild(back);
    }

    contents.sort((a, b) => (b.type === 'dir' ? 1 : -1) - (a.type === 'dir' ? 1 : -1));

    contents.forEach(item => {
        const div = document.createElement('div');
        div.className = item.type === 'dir' ? 'file-item folder' : 'file-item';
        div.innerHTML = `<span>${item.type === 'dir' ? '📁' : '📄'}</span> ${item.name}`;
        
        if (item.type === 'dir') {
            div.onclick = () => {
                navigationStack.push(item.path);
                refreshView();
            };
        } else {
            div.onclick = (e) => selectFile(item, e);
        }
        fileList.appendChild(div);
    });
}

function renderLocalFileList(files, modifiedFiles = []) {
    fileList.innerHTML = '';
    if (files.length === 0) {
        fileList.innerHTML = '<p class="empty-state">Agent is still processing...</p>';
        return;
    }

    files.forEach(name => {
        const isFixed = modifiedFiles.includes(name);
        const div = document.createElement('div');
        div.className = isFixed ? 'file-item fixed-file' : 'file-item';
        div.innerHTML = `
            <span>${isFixed ? '🛠️' : '⚡'}</span> 
            ${name} 
            ${isFixed ? '<span class="status-badge-mini">FIXED</span>' : ''}
        `;
        div.onclick = async (e) => {
            document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFileName.innerText = name;
            codeContent.innerText = 'Loading fixed version...';
            
            const resp = await fetch(`/api/file?name=${name}`);
            const data = await resp.json();
            
            codeContent.innerText = data.content;
            
            // Show Intelligence Report
            const reportEl = document.getElementById('reasoning-report');
            const reportText = document.getElementById('reasoning-text');
            reportEl.classList.remove('hidden');
            
            const actionLabel = isFixed ? '🛠️ ACTION: Modified & Optimized' : '✅ STATUS: Production Stable';
            reportText.innerHTML = `<strong>File: ${name}</strong><br><small>${actionLabel}</small><br><br>${data.report}`;
            
            pushBtn.disabled = false;
        };
        fileList.appendChild(div);
    });
}

function renderChangeLog(log) {
    const container = document.getElementById('changelog-container');
    const countBadge = document.getElementById('change-count');
    
    if (log.length === 0) return;
    if (container.querySelectorAll('.change-card').length === log.length) return;

    countBadge.innerText = `${log.length} Changes`;
    container.innerHTML = '';
    
    log.forEach(item => {
        const card = document.createElement('div');
        card.className = 'change-card';
        card.innerHTML = `
            <h4>📄 ${item.file}</h4>
            <p>${item.summary}</p>
        `;
        container.appendChild(card);
    });
}

async function selectFile(file, event) {
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    currentFileName.innerText = file.name;
    codeContent.innerText = 'Loading source code...';
    shareBtn.disabled = true;

    const content = await fetchFileRaw(file.download_url);
    codeContent.innerText = content;
    
    currentFileData = { name: file.name, content: content, path: file.path };
    shareBtn.disabled = false;
}

pushBtn.onclick = async () => {
    const token = githubTokenInput.value.trim();
    if (!token) return alert('Token required to push.');
    pushBtn.innerText = 'Pushing...';
    const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: connectedRepo, path: currentFileData.path, content: codeContent.innerText, token: token })
    });
    const result = await response.json();
    if (result.success) alert('Pushed to GitHub!');
    pushBtn.innerText = 'Push Fix to GitHub';
};

connectBtn.onclick = async () => {
    let repo = repoInput.value.trim();
    if (!repo) return;
    if (repo.includes('github.com/')) {
        repo = repo.split('github.com/')[1].replace('.git', '').split('?')[0];
    }

    connectBtn.innerText = 'Connecting...';
    connectedRepo = repo;
    repoBadge.innerText = repo;
    repoBadge.style.color = 'var(--accent)';
    
    // Trigger Auto-Scan immediately
    const token = githubTokenInput.value.trim();
    addLog(`[AUTO] Triggering autonomous audit for ${repo}...`);
    fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, token: token || 'NO_TOKEN' })
    }).catch(e => console.error('Auto-scan failed:', e));

    await refreshView();
    connectBtn.innerText = 'Connect';
};

function addLog(msg) {
    const p = document.createElement('p');
    const time = new Date().toLocaleTimeString();
    let msgClass = 'log-msg';
    if (msg.includes('SUCCESS')) msgClass = 'log-success';
    p.innerHTML = `<span class="log-time">[${time}]</span> <span class="${msgClass}">${msg}</span>`;
    telemetryLogs.appendChild(p);
    telemetryLogs.scrollTop = telemetryLogs.scrollHeight;
    if (telemetryLogs.children.length > 50) telemetryLogs.removeChild(telemetryLogs.firstChild);
}

async function pollTelemetry() {
    try {
        const response = await fetch('/api/logs');
        if (response.ok) {
            const logs = await response.json();
            if (logs.length > 0) {
                const currentText = telemetryLogs.innerText;
                const newText = logs.join('\n');
                if (currentText.length !== newText.length) {
                    telemetryLogs.innerHTML = '';
                    logs.forEach(log => addLog(log));
                }
            }
        }
        const statusResp = await fetch('/api/status');
        const status = await statusResp.json();
        
        if (currentView === 'agent') {
            renderLocalFileList(status.workspaceFiles || [], status.modifiedFiles || []);
        }

        renderChangeLog(status.changeLog || []);

        agentStatusText.innerText = status.isProcessing ? 'Auditing Repo...' : 'Ready';
        if (status.isProcessing) document.querySelector('.status-indicator').classList.add('processing');
        else document.querySelector('.status-indicator').classList.remove('processing');
    } catch (e) {}
}

setInterval(pollTelemetry, 3000);
addLog('Agent is online and ready.');
