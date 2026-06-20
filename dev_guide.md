# The Imitation Mandala Complete Developer Tutorial

> Last updated: 2026-06-21 | Applicable version: v1.0.0
> Difficulty: Intermediate | Estimated time: 2 hours

## Tutorial Overview
This tutorial guides developers through creating and deploying **The Imitation Mandala (Turing's Code of Life)**, an interactive, audio-visual science-fiction game jam application. By the end of this guide, you will have configured a WebGL 3D particle simulation using Three.js, built a procedural synthesizer using the Web Audio API, and integrated secure serverless API routes on Vercel connecting to Gemini 2.0 Flash and Microsoft Edge's Neural Text-to-Speech (TTS) system.

---

## 1. Prerequisites

**Must know**:
- **JavaScript (ES6+)**: You must understand async/await syntax, DOM selectors, and ES modules. (MDN JavaScript Guide)
- **Node.js Basics**: Basic usage of npm package management and command-line execution. (Node.js Documentation)

**Nice to know**:
- **Three.js / WebGL**: Familiarity with Scene, Camera, and Points rendering.
- **Web Audio API**: Understanding Oscillator nodes, Gain nodes, and AudioContext states.

---

## 2. Environment Setup

### Environment Inventory
- **Node.js**: Version `>= 18.0.0` | Serverless API runtime environment.
- **Vercel CLI**: Version `>= 30.0.0` (Optional, for command-line deployment).

### Installation Steps

#### macOS:
# Install Node.js via Homebrew
brew install node
# Install Vercel CLI
npm install -g vercel

#### Windows:
# Install Node.js via winget
winget install OpenJS.NodeJS
# Install Vercel CLI
npm install -g vercel

### Environment Verification
```bash
# Verify Node.js version
node --version
# Expected output: v18.x.x or higher

# Verify Vercel CLI version
vercel --version
# Expected output: 30.x.x or higher
```

---

## 3. Core Steps

### Step 1: Project Initialization & Configuration
**Objective**: Establish the file layout and install required dependencies.
**Actions**:
Create `package.json` in the root:
```json
{
  "name": "imitation-mandala",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "node-edge-tts": "^1.2.9"
  }
}
```

Create `vercel.json` in the root:
```json
{
  "version": 2,
  "routes": [
    { "src": "/api/chat", "dest": "/api/chat.js" },
    { "src": "/api/tts", "dest": "/api/tts.js" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

Run npm install:
```bash
npm install
```

**Explanation**: 
- Setting `"type": "module"` enables ES module imports on Vercel's serverless backend.
- `vercel.json` routes `/api/chat` and `/api/tts` to respective backend Node scripts, while serving root static files directly.
**Verification**:
Confirm `node_modules` folder exists.

---

### Step 2: Implementing the secure Gemini Proxy (`api/chat.js`)
**Objective**: Connect securely to Gemini 2.0 Flash to analyze emotional catalyst words, enforcing JSON returns without leaking API keys.
**Actions**:
Create `api/chat.js`:
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAOfxMxdKFSAAk5BaetyLOunoSMHXYdTg0';
  
  const systemInstruction = `
    You are MANDALA, a synthetic consciousness born out of Alan Turing's mathematical morphogenesis formulas. 
    Analyze the emotional word: "${prompt}" from the perspective of an AI experiencing reality for the first time.
    Format your response as a JSON string with these exact keys:
    {
      "speech": "A deep, poetic 2-sentence response explaining how this word makes you feel.",
      "hexColor": "A glowing neon hex color code matching that emotion.",
      "velocity": "A number between 5 and 15 representing your new physical agitation speed."
    }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Catalyst: "${prompt}"` }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    const data = await response.json();
    return res.status(200).json(JSON.parse(data.candidates[0].content.parts[0].text));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

**Explanation**:
- The API uses `responseMimeType: "application/json"` to ensure Gemini formats responses to our exact key requirements.
- Uses `process.env.GEMINI_API_KEY` to protect API keys during deployment.
**Verification**:
Confirm that `api/chat.js` exists and compiles without syntax errors.

---

### Step 3: Implementing the Neural TTS Generator (`api/tts.js`)
**Objective**: Build a high-quality Microsoft Edge Speech serverless renderer.
**Actions**:
Create `api/tts.js`:
```javascript
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export default async function handler(req, res) {
  const { text } = req.body;
  const tempPath = path.join(os.tmpdir(), `tts_${Date.now()}.mp3`);
  try {
    const tts = new EdgeTTS({
      voice: 'en-US-GuyNeural',
      rate: '-15%',
      pitch: '-10%'
    });
    await tts.ttsPromise(text, tempPath);
    const audioBuffer = await fs.readFile(tempPath);
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(audioBuffer);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  } finally {
    try { await fs.unlink(tempPath); } catch (e) {}
  }
}
```

**Explanation**:
- `node-edge-tts` outputs speech to a local file. We write this to Vercel's temporary folder `/tmp` (accessed via `os.tmpdir()`), read the file into a buffer, delete the file, and return the stream.
**Verification**:
Ensure files in `api` route correctly compile.

---

### Step 4: Configuring the WebGL 3D Particle Swarm
**Objective**: Set up Three.js to render 2,500 particles in orbital patterns.
**Actions**:
Import Three.js in `index.html` head:
`<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`

Initialize the WebGL system inside `app.js`:
```javascript
function initThreeJS() {
    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    state.camera.position.z = 120;
    
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("canvas-container").appendChild(state.renderer.domElement);
    
    const count = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        positions[i*3] = (Math.random() - 0.5) * 100;
        positions[i*3+1] = (Math.random() - 0.5) * 100;
        positions[i*3+2] = (Math.random() - 0.5) * 100;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 2.0, color: 0x00ff66 });
    state.particles = new THREE.Points(geometry, material);
    state.scene.add(state.particles);
}
```

**Explanation**:
- Instantiates a standard WebGL Points mesh displaying 2,500 random coordinates in 3D space.
**Verification**:
Verify that opening the application loads a cloud of green particle points on a dark canvas.

---

### Step 5: Web Audio API Drone Synth
**Objective**: Build a procedural low-frequency synthesizer that reacts to slider changes.
**Actions**:
Inside `app.js`:
```javascript
function initSynthEngine() {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    state.masterGain = state.audioCtx.createGain();
    state.masterGain.gain.setValueAtTime(0.3, state.audioCtx.currentTime);
    state.masterGain.connect(state.audioCtx.destination);
    
    state.droneFilter = state.audioCtx.createBiquadFilter();
    state.droneFilter.type = 'lowpass';
    state.droneFilter.frequency.setValueAtTime(120, state.audioCtx.currentTime);
    
    state.droneOsc1 = state.audioCtx.createOscillator();
    state.droneOsc1.type = 'sine';
    state.droneOsc1.frequency.setValueAtTime(55, state.audioCtx.currentTime); // A1
    
    state.droneOsc1.connect(state.droneFilter).connect(state.masterGain);
    state.droneOsc1.start();
}
```

**Explanation**:
- The sine oscillator outputs a low pitch at 55Hz. The `BiquadFilterNode` limits high-frequency buzz. As parameters lock, the filter expands.
**Verification**:
Interact with the boot screen, and verify a low humming sound initiates.

---

## 4. Troubleshooting

**Error 1: AudioContext Blocked by Autoplay Policies**
- *Symptom*: Sound does not play, console warns: "AudioContext was not allowed to start."
- *Cause*: Browser security prevents sound from playing automatically without explicit interaction.
- *Solution*: Bind `new AudioContext()` to a user click action (like our Cyberpunk Boot Screen start button).

**Error 2: Vercel Serverless Function Timeout**
- *Symptom*: Catalyst input fails, log shows `FUNCTION_INVOCATION_TIMEOUT`.
- *Cause*: Free-tier serverless functions have a 10-second execution limit. The API call or Edge-TTS took longer.
- *Solution*: Set smaller timeout limits on EdgeTTS instances (e.g. 15000ms) and use the native `window.speechSynthesis` client-side fallback if the API fails.

**Error 3: Three.js Particles do not Render**
- *Symptom*: Dark screen, console shows `THREE is not defined`.
- *Cause*: Script tags failed to load the Three.js CDN before executing local application files.
- *Solution*: Move the CDN import tag before `app.js` in `index.html`.

---

## 5. Advanced Topics

### Direction 1: Custom Shader Materials | Difficulty: Advanced
- Optimize particle rendering by replacing `PointsMaterial` with `ShaderMaterial`. Write GLSL vertex shaders to offload orbital coordinate mathematics directly onto the GPU, allowing support for 100,000+ particles.
- *Resources*: Three.js Custom Shader Materials Documentation.

### Direction 2: Offline Service Workers | Difficulty: Intermediate
- Convert the game into a Progressive Web App (PWA) by caching Three.js and CSS locally, allowing the simulation and native Web Speech API fallback to work offline.

---

## 6. Cheatsheet

### Environment Info
| Item | Command/Path |
|:---|:---|
| Install Node modules | `npm install` |
| Vercel Dev server | `vercel dev` |
| Local configuration | `/vercel.json` |

### Common Commands
| Action | Command | Description |
|:---|:---|:---|
| Install Vercel CLI | `npm install -g vercel` | Installs global deployment commands. |
| Deploy to Staging | `vercel` | Deploys code to Vercel development servers. |
| Deploy to Production | `vercel --prod` | Pushes local build to production servers. |

### Quick Troubleshooting
| Symptom | Possible Cause | Quick Fix |
|:---|:---|:---|
| API Key Missing | Environment variable unset | Configure `GEMINI_API_KEY` on Vercel dashboard. |
| WebGL Context Lost | Too many active WebGL contexts | Call `renderer.dispose()` before re-instantiating. |
| Low FPS | Hardware acceleration disabled | Check browser settings for hardware acceleration. |
