# 🔮 GrabOn Agent PRO v6.0
> **The Zero-Touch Production Auditor & Autonomous Repair Suite**

GrabOn Agent PRO is a state-of-the-art, multi-agent AI ecosystem designed to autonomously crawl, audit, and repair production-grade repositories. It combines the reasoning power of **Claude 3.5**, the precision of **GPT-4o**, and the evaluation speed of **Gemini** into a single, unified "Triple-Threat" orchestration.

---

## 🌟 Key Features (v6.0 Stable)

### 🏗️ Production-Grade Recursive Auditor
Unlike simple scanners, the GrabOn Auditor performs a deep, recursive crawl of your entire GitHub tree. It recreates your **exact folder structure** locally, ensuring that complex projects with nested components (e.g., `/src/components/navbar/`) are audited with total structural integrity.

### 🧠 Senior Architect Intelligence Reports
The Agent doesn't just "silent-fix" code. Every modification includes an **Inline Intelligence Report**. Each fix is documented with:
- 🛠️ **The Problem**: Rationale for the change.
- 💡 **The Solution**: How the Senior Architect AI improved the logic.
- 🚀 **The Benefit**: Impact on security, performance, or stability.

### 📊 Master Audit Change Log
The dashboard features a global **Transparency Hub**. At a glance, you can see every file that was changed across the entire session, accompanied by a high-level reasoning summary for each transformation.

### 🛡️ Crash-Proof Fail-Safe Logic
Integrated with local analysis fallbacks. If an AI service (like Gemini or OpenAI) hits a rate limit or goes offline, the Agent automatically switches to its local "Senior Dev" logic to ensure your audit never stops.

---

## 🛠️ Technology Stack
- **Core**: TypeScript, Node.js (tsx)
- **Backend**: Express.js (High-performance telemetry API)
- **Frontend**: Vite + Vanilla JS (Glassmorphism Dashboard)
- **AI Orchestration**: 
  - **Reasoning**: Anthropic Claude 3.5 Sonnet
  - **Fixing**: OpenAI GPT-4o
  - **Evaluation**: Google Gemini 1.5 Flash

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- GitHub Personal Access Token (PAT)
- API Keys for Claude, GPT, or Gemini

### 2. Installation
```bash
git clone https://github.com/faisalhasan00/Grabons-Task.git
cd Grabons-Task
npm install
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_key
TARGET_REPO=./Project
PORT=3000
```

### 4. Running the System
**Terminal 1 (Backend Agent):**
```bash
npm start
```

**Terminal 2 (Frontend Dashboard):**
```bash
cd frontend
npm run dev
```

---

## 📡 Usage
1. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).
2. Enter your GitHub repository URL (e.g., `user/repo`).
3. Click **"Connect & Auto-Fix"**.
4. Watch the **Master Change Log** as the Agent repairs your repository in real-time.

---

## 🏙️ Enterprise Roadmap
- [ ] OAuth 2.0 Integration for GitHub
- [ ] Multi-user session persistence
- [ ] CI/CD Pipeline integration (GitHub Actions)
- [ ] Custom SLA-based repair rules

**Developed with 💖 by the GrabOn AI Labs Team.**
