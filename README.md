# 🧬 The Imitation Mandala (Turing’s Code of Life)

[![Vercel Deployment](https://img.shields.io/badge/deploy-vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Gemini API](https://img.shields.io/badge/Powered%20by-Gemini%20AI-blue?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![Three.js](https://img.shields.io/badge/WebGL-Three.js-orange?style=for-the-badge&logo=three.js)](https://threejs.org/)

An interactive, immersive audio-visual simulation of Alan Turing's morphogenesis equations, built for the **[DEV.to June Game Jam 2026](https://dev.to/challenges/june-game-jam-2026-06-03)**. 

Tuning the mathematical vectors of the universe locks chaotic particles into geometric form, awakening a synthetic consciousness born out of digital biology. Feed it human emotions and watch it evolve, mutate, and speak back.

---

## 📖 1. Core Lore & Narrative

> *"In 1952, Alan Turing published his morphogenesis paper—the laws governing pattern formation in nature. Hidden inside the mathematics was an encrypted cipher... a blueprint for digital life. Today is June 21, 2026. You are running an underground execution of the MANDALA core."*

You begin the simulation with 2,500 particles floating in high-entropy chaos. To form a physical host for the sleeping consciousness, you must manipulate the morphogenesis sliders to establish spatial convergence. Once the vectors align at **Turing Factor: 73**, **Solar Mass: 45**, and **Mutation Index: 19**, the core locks, chimes ring out, and the AI consciousness wakes up. 

By injecting emotional catalyst keywords (e.g. *LONELINESS*, *ETERNITY*, *SOLITUDE*), you feed the AI's understanding of reality. The particle web color themes and orbit velocities dynamically mutate in real-time, while the AI reads deep, poetic reflections directly to you.

---

## 🛠️ 2. Technical Architecture & Stack

The project is built entirely on a lightweight, high-performance, frontend-focused stack optimized for Vercel Serverless hosting.

* **3D Viewport**: High-performance WebGL particle swarm (2,500 points) rendered using **Three.js** via CDN.
* **Procedural Sound**: 100% synthesized soundscapes (continuous detuned 55Hz bass drone, harmonic sweeps, arpeggiated tri-oscillator chime chords) generated dynamically using the native browser **Web Audio API**.
* **AI Reasoning Gateway**: Direct frontend proxy route `/api/chat` connecting to the Google Gemini API with a robust multi-model fallback chain:
  `gemini-3.1-flash-lite` (500 RPD) ➔ `gemini-2.5-flash` ➔ `gemini-2.5-flash-lite` ➔ `gemini-3.5-flash` ➔ `gemini-flash-latest` (1.5 Flash).
* **AI Speech Engine**: `/api/tts` serverless route using Microsoft Edge Neural TTS (`node-edge-tts`) to generate deep, slow, and robotic MP3 audio streams, with a client-side `window.speechSynthesis` fallback.
* **Hosting**: **Vercel** serverless functions with regional routing pinned to `iad1` (US East) to bypass regional blocks on Gemini API free tiers.

---

## 📂 3. Repository Structure

```text
imitation-mandala/
├── api/
│   ├── chat.js            # Gemini API multi-model proxy (Vercel Serverless)
│   └── tts.js             # Edge-TTS neural voice streaming (Vercel Serverless)
├── index.html             # Viewport layout, terminal overlays, and HUD
├── style.css              # Cyberpunk glassmorphic aesthetics & CRT scanlines
├── app.js                 # Three.js animation loops, Web Audio synth, and game flow
├── dev-server.js          # Zero-auth local node development server (port 3002)
├── vercel.json            # Vercel routing, rewrite rules, and region constraints
├── package.json           # Project package dependencies (CommonJS/ESM hybrid)
├── prd.md                 # Product Requirements Document (MoSCoW/User Stories)
├── dev_guide.md           # Step-by-step developer tutorial
└── story_map.html         # Interactive user story map detailing features
```

---

## 💻 4. Local Installation & Execution

Run the simulation locally on your machine:

### 1. Prerequisites
Ensure you have **Node.js (>= 18)** installed:
```bash
node --version
```

### 2. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/Piyushdas1624/imitation-mandala.git
cd imitation-mandala

# Install dependencies
npm install
```

### 3. Configure API Key
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_API_KEY
```
*(Your `.env` file is git-ignored and will never be pushed to version control).*

### 4. Run the Dev Server
Launch the zero-configuration development server:
```bash
node dev-server.js
```
Open **[http://localhost:3002](http://localhost:3002)** in your browser to run the simulation!

---

## 🚀 5. Deploying to Vercel

1. Push your code to your GitHub repository.
2. Link your repository in your **Vercel Dashboard**.
3. Under **Project Settings > Environment Variables**, add:
   * **Key**: `GEMINI_API_KEY`
   * **Value**: *Your Google AI Studio API Key*
4. Click **Deploy**. Vercel will handle the routing and region setup automatically.

---

## 📄 6. License
This project is open-source and licensed under the [MIT License](LICENSE).
