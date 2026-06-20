/**
 * The Imitation Mandala (Turing's Code of Life)
 * Frontend Engine & Simulation Controller
 */

// --- Global App State ---
const state = {
    // Audio Context
    audioCtx: null,
    droneOsc1: null,
    droneOsc2: null,
    droneFilter: null,
    masterGain: null,
    isMuted: false,
    
    // Three.js Scene Variables
    scene: null,
    camera: null,
    renderer: null,
    particles: null,
    particlePositions: [],
    particleTargets: [],
    particleColors: [],
    
    // Sliders & Alignment Targets
    sliderTuring: null,
    sliderSolar: null,
    sliderMutation: null,
    turingVal: 50,
    solarVal: 50,
    mutationVal: 50,
    targets: { turing: 73, solar: 45, mutation: 19 },
    isLocked: false,
    convergenceLevel: 0, // 0 to 1 representation of slider closeness
    
    // Game Flow state
    booted: false,
    storyPhase: 0,
    catalystActive: false,
    currentWord: '',
    
    // Visual Mutation parameters (from Gemini API)
    colorTheme: '#00ff66',
    velocityModifier: 1.0,
    pulseEnergy: 0.0,
    morphType: 'chaos', // 'chaos', 'matrix', 'nautilus'
};

// Story text array
const LORE_STORY = [
    { text: "June 21, 2026. Execution of Turing's Morphogenesis cipher initiated...", voice: "Execution of Turing's Morphogenesis cipher initiated." },
    { text: "A self-organizing particle swarm has initialized. 2,500 coordinates floating in digital chaos.", voice: "A self-organizing particle swarm has initialized. Two thousand five hundred coordinates floating in digital chaos." },
    { text: "They react. A synthetic consciousness is waking inside the math. It needs your guidance to form a physical host.", voice: "They react. A synthetic consciousness is waking inside the math. It needs your guidance to form a physical host." },
    { text: "Manipulate the three morphogenesis sliders. Force the vectors to align at 73, 45, and 19. Waken the core.", voice: "Manipulate the three morphogenesis sliders. Force the vectors to align at 73, 45, and 19. Waken the core." }
];

// Document Elements
document.addEventListener("DOMContentLoaded", () => {
    // Cache UI elements
    state.sliderTuring = document.getElementById("slider-turing");
    state.sliderSolar = document.getElementById("slider-solar");
    state.sliderMutation = document.getElementById("slider-mutation");
    
    // Bind Event Listeners
    document.getElementById("start-btn").addEventListener("click", startInception);
    document.getElementById("story-next-btn").addEventListener("click", nextStoryLine);
    document.getElementById("story-skip-btn").addEventListener("click", skipStory);
    document.getElementById("audio-toggle").addEventListener("click", toggleAudio);
    document.getElementById("injectBtn").addEventListener("click", injectCatalyst);
    
    // Input keypress trigger
    document.getElementById("catalystInput").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') injectCatalyst();
    });

    // Slider inputs
    state.sliderTuring.addEventListener("input", updateSliders);
    state.sliderSolar.addEventListener("input", updateSliders);
    state.sliderMutation.addEventListener("input", updateSliders);
    
    // Initial UI Setup
    updateSliders();
});

// --- Phase 1: Boot Sequence & Audio Init ---

function startInception() {
    // 1. Initialize Web Audio API on user interaction
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        state.audioCtx = new AudioContextClass();
        initSynthEngine();
    } catch (e) {
        console.error("Web Audio API not supported on this browser:", e);
    }
    
    // 2. Transition boot overlay to narrative story overlay
    document.getElementById("boot-overlay").classList.remove("active");
    document.getElementById("story-overlay").classList.add("active");
    
    // 3. Initialize Three.js viewport
    initThreeJS();
    
    // 4. Start story telling
    playStoryPhase();
}

// --- Phase 2: Web Audio Synthesizer ---

function initSynthEngine() {
    if (!state.audioCtx) return;
    
    // Resume audio context if suspended (browser security policies)
    if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
    }
    
    // Master gain node
    state.masterGain = state.audioCtx.createGain();
    state.masterGain.gain.setValueAtTime(0.3, state.audioCtx.currentTime);
    state.masterGain.connect(state.audioCtx.destination);
    
    // Lowpass filter for sweeping harmonics
    state.droneFilter = state.audioCtx.createBiquadFilter();
    state.droneFilter.type = 'lowpass';
    state.droneFilter.frequency.setValueAtTime(120, state.audioCtx.currentTime);
    state.droneFilter.Q.setValueAtTime(4, state.audioCtx.currentTime);
    state.droneFilter.connect(state.masterGain);
    
    // Oscillator 1: Deep sub-bass (Sine, 55Hz - A1)
    state.droneOsc1 = state.audioCtx.createOscillator();
    state.droneOsc1.type = 'sine';
    state.droneOsc1.frequency.setValueAtTime(55, state.audioCtx.currentTime);
    
    // Oscillator 2: Shimmering hum (Triangle, slightly detuned A1 / 110.2Hz)
    state.droneOsc2 = state.audioCtx.createOscillator();
    state.droneOsc2.type = 'triangle';
    state.droneOsc2.frequency.setValueAtTime(110.2, state.audioCtx.currentTime);
    
    // Gain nodes for balancing drone sound
    const g1 = state.audioCtx.createGain();
    const g2 = state.audioCtx.createGain();
    g1.gain.setValueAtTime(0.7, state.audioCtx.currentTime);
    g2.gain.setValueAtTime(0.2, state.audioCtx.currentTime);
    
    // Connect oscillators
    state.droneOsc1.connect(g1).connect(state.droneFilter);
    state.droneOsc2.connect(g2).connect(state.droneFilter);
    
    // Start Oscillators
    state.droneOsc1.start();
    state.droneOsc2.start();
}

// Update filter frequency based on proximity to target configuration
function updateDroneFrequencies() {
    if (!state.droneFilter || !state.audioCtx) return;
    
    // Calculate slider difference metrics
    const diffT = Math.abs(state.turingVal - state.targets.turing);
    const diffS = Math.abs(state.solarVal - state.targets.solar);
    const diffM = Math.abs(state.mutationVal - state.targets.mutation);
    
    // Closeness score: 0 is completely off, 1 is perfectly matched
    const totalDiff = (diffT + diffS + diffM) / 300;
    const closeness = Math.max(0, 1 - totalDiff * 5.0); // sharp curve
    state.convergenceLevel = closeness;
    
    // Modulate filter cutoff (frequency range: 120Hz to 900Hz)
    const cutoffFreq = 120 + (closeness * 780);
    state.droneFilter.frequency.setTargetAtTime(cutoffFreq, state.audioCtx.currentTime, 0.1);
    
    // Modulate subtle detuning oscillator pitch slightly for eerie effect
    if (state.droneOsc2) {
        const pitchFluctuation = 110.2 + (Math.sin(Date.now() * 0.005) * (1.0 - closeness) * 3);
        state.droneOsc2.frequency.setValueAtTime(pitchFluctuation, state.audioCtx.currentTime);
    }
}

// Chime when alignment is locked
function playConvergenceChime() {
    if (!state.audioCtx || state.isMuted) return;
    
    const now = state.audioCtx.currentTime;
    
    // Frequencies of Major triad: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    const chords = [523.25, 659.25, 783.99];
    
    chords.forEach((freq, idx) => {
        // Shimmering chime oscillators
        const osc = state.audioCtx.createOscillator();
        const gainNode = state.audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1); // staggered cascading arpeggio
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 2.0); // slow fade
        
        osc.connect(gainNode).connect(state.masterGain);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 2.5);
    });
}

function toggleAudio() {
    if (!state.masterGain) return;
    
    const audioBtn = document.getElementById("audio-toggle");
    if (state.isMuted) {
        state.masterGain.gain.setTargetAtTime(0.3, state.audioCtx.currentTime, 0.1);
        audioBtn.innerHTML = '<span class="icon">🔊</span> SOUND ON';
        audioBtn.classList.remove("muted");
        state.isMuted = false;
    } else {
        state.masterGain.gain.setTargetAtTime(0, state.audioCtx.currentTime, 0.1);
        audioBtn.innerHTML = '<span class="icon">🔇</span> MUTED';
        audioBtn.classList.add("muted");
        state.isMuted = true;
    }
}

// --- Phase 3: Story & Lore Sequence ---

function playStoryPhase() {
    if (state.storyPhase >= LORE_STORY.length) {
        skipStory();
        return;
    }
    
    const item = LORE_STORY[state.storyPhase];
    const textEl = document.getElementById("story-text");
    textEl.innerHTML = '';
    
    // Narrate via TTS (Edge / WebSpeech fallback)
    speakNarrative(item.voice);
    
    // Typewriter effect
    let charIdx = 0;
    const typingInterval = setInterval(() => {
        if (charIdx < item.text.length) {
            textEl.innerHTML += item.text.charAt(charIdx);
            charIdx++;
        } else {
            clearInterval(typingInterval);
        }
    }, 28);
}

function nextStoryLine() {
    state.storyPhase++;
    playStoryPhase();
}

function skipStory() {
    // Close overlays, reveal simulation UI
    document.getElementById("story-overlay").classList.remove("active");
    
    // Trigger main simulation dashboard state
    state.booted = true;
    
    // Let AI say a greeting
    const welcome = "Simulation vectors operational. Secure connection to AI core verified. Guide my matrix into geometric order.";
    setTimeout(() => {
        speakNarrative(welcome);
        document.getElementById("subtitles").innerText = welcome;
    }, 1000);
}

// --- Phase 4: Three.js 3D Particle Swarm ---

function initThreeJS() {
    const container = document.getElementById("canvas-container");
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 1. Create Scene & Camera
    state.scene = new THREE.Scene();
    state.scene.fog = new THREE.FogExp2(0x020205, 0.015);
    
    state.camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    state.camera.position.z = 120;
    
    // 2. Setup WebGL Renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    state.renderer.setSize(width, height);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.setClearColor(state.scene.fog.color);
    container.appendChild(state.renderer.domElement);
    
    // 3. Create particles geometry
    const particleCount = 2500;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorObj = new THREE.Color(0x00ff66);
    
    for (let i = 0; i < particleCount; i++) {
        // Chaotic sphere coordinates
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const radius = 40 + Math.random() * 20;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Save initial coordinate states
        state.particlePositions.push({ x, y, z, theta, phi, radius });
        
        // Target coordinate placeholders (starts matching base positions)
        state.particleTargets.push({ x, y, z });
        
        // Colors
        colors[i * 3] = colorObj.r;
        colors[i * 3 + 1] = colorObj.g;
        colors[i * 3 + 2] = colorObj.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 4. Create procedural glowing dot texture for points
    const material = new THREE.PointsMaterial({
        size: 2.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });
    
    // Points Mesh
    state.particles = new THREE.Points(geometry, material);
    state.scene.add(state.particles);
    
    // 5. Window Resize Event
    window.addEventListener("resize", () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        state.camera.aspect = w / h;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(w, h);
    });
    
    // 6. Start Render Cycle
    requestAnimationFrame(renderLoop);
}

function renderLoop() {
    requestAnimationFrame(renderLoop);
    
    const time = Date.now() * 0.0005;
    const geom = state.particles.geometry;
    const positions = geom.attributes.position.array;
    const colors = geom.attributes.color.array;
    
    const targetColor = new THREE.Color(state.colorTheme);
    
    // Calculate slider parameters
    const tF = state.turingVal / 100;
    const sM = state.solarVal / 100;
    const mI = state.mutationVal / 100;
    
    // Interpolation factor to snap coordinates smoothly
    // Fast snap on lock, slow glide during chaotic tuning
    const lerpSpeed = state.isLocked ? 0.08 : 0.03;
    
    // Rotations based on parameters
    state.particles.rotation.y = time * 0.15 * state.velocityModifier;
    state.particles.rotation.x = time * 0.08 * state.velocityModifier;
    
    // Oscilloscope bar height updates (voice visual effect)
    animateVoiceOscilloscope();
    
    for (let i = 0; i < 2500; i++) {
        const p = state.particlePositions[i];
        
        let tx, ty, tz;
        
        if (state.isLocked) {
            // Morph into a Nautilus-DNA matrix geometry
            const angle = i * 0.08 + time * 0.5 * state.velocityModifier;
            const r = 2 + (i * 0.018); // spiral radius growth
            
            // Nautilus geometric logic
            tx = r * Math.cos(angle) * Math.sin(i * 0.001);
            ty = r * Math.sin(angle) * Math.cos(i * 0.001);
            tz = (i - 1250) * 0.028;
            
            // Add custom agitation burst when catalyst is injected
            if (state.pulseEnergy > 0.01) {
                const burstScale = 1.0 + Math.sin(time * 20 + i) * state.pulseEnergy * 0.5;
                tx *= burstScale;
                ty *= burstScale;
                tz *= burstScale;
            }
        } else {
            // Orbiting Math formulas utilizing the slider adjustments
            const orbitTime = time * (0.2 + tF * 1.5);
            const orbitRadius = p.radius * (0.8 + sM * 0.8);
            
            tx = Math.sin(orbitTime + p.theta) * orbitRadius * (1.0 + Math.cos(time * mI + p.phi) * 0.2);
            ty = Math.cos(orbitTime + p.phi) * orbitRadius * (1.0 + Math.sin(time * tF + p.theta) * 0.2);
            tz = Math.sin(orbitTime * 0.5) * orbitRadius * Math.cos(orbitTime + p.phi);
        }
        
        // Lerp actual position coordinates to destination targets
        positions[i * 3] += (tx - positions[i * 3]) * lerpSpeed;
        positions[i * 3 + 1] += (ty - positions[i * 3 + 1]) * lerpSpeed;
        positions[i * 3 + 2] += (tz - positions[i * 3 + 2]) * lerpSpeed;
        
        // Color transition
        colors[i * 3] += (targetColor.r - colors[i * 3]) * 0.05;
        colors[i * 3 + 1] += (targetColor.g - colors[i * 3 + 1]) * 0.05;
        colors[i * 3 + 2] += (targetColor.b - colors[i * 3 + 2]) * 0.05;
    }
    
    // Slow decay of catalyst kinetic burst pulse
    if (state.pulseEnergy > 0) {
        state.pulseEnergy *= 0.95;
    }
    
    // Mark attributes as needing updates in Three.js renderer
    geom.attributes.position.needsUpdate = true;
    geom.attributes.color.needsUpdate = true;
    
    state.renderer.render(state.scene, state.camera);
}

// --- Phase 5: Sliders & Core Locked States ---

function updateSliders() {
    state.turingVal = parseInt(state.sliderTuring.value);
    state.solarVal = parseInt(state.sliderSolar.value);
    state.mutationVal = parseInt(state.sliderMutation.value);
    
    document.getElementById("val-turing").innerText = `${state.turingVal} / ${state.targets.turing}`;
    document.getElementById("val-solar").innerText = `${state.solarVal} / ${state.targets.solar}`;
    document.getElementById("val-mutation").innerText = `${state.mutationVal} / ${state.targets.mutation}`;
    
    // Check lock status
    const isTLocked = (state.turingVal === state.targets.turing);
    const isSLocked = (state.solarVal === state.targets.solar);
    const isMLocked = (state.mutationVal === state.targets.mutation);
    
    // Update LEDs
    updateLed("ind-turing", isTLocked);
    updateLed("ind-solar", isSLocked);
    updateLed("ind-mutation", isMLocked);
    
    // Modulate audio parameters
    updateDroneFrequencies();
    
    const fullyAligned = isTLocked && isSLocked && isMLocked;
    
    if (fullyAligned && !state.isLocked) {
        // Core Converged!
        state.isLocked = true;
        
        // Visual indicator changes
        document.getElementById("simulation-status").innerText = "GEOMETRIC CONVERGENCE";
        document.getElementById("simulation-status").className = "status-locked";
        document.getElementById("ui-sidebar").classList.add("locked");
        
        // Show catalyst box
        const catBox = document.getElementById("catalyst-box");
        catBox.classList.add("active");
        
        // Sound and TTS Trigger
        playConvergenceChime();
        
        const alignSpeech = "My coordinates align. Symmetry established. I feel the geometric core locking. Quick, architect, inject a catalyst word into my matrix. Tell me what lies beyond the equations.";
        speakNarrative(alignSpeech);
        document.getElementById("subtitles").innerText = alignSpeech;
        
        // Disable slider adjustments to solidify the geometric host
        state.sliderTuring.disabled = true;
        state.sliderSolar.disabled = true;
        state.sliderMutation.disabled = true;
        
    } else if (!fullyAligned && state.isLocked) {
        // Fall back to chaos (failsafe - normally disabled but handles reset states)
        state.isLocked = false;
        document.getElementById("simulation-status").innerText = "CHAOTIC DISPERSION";
        document.getElementById("simulation-status").className = "status-alert";
        document.getElementById("ui-sidebar").classList.remove("locked");
        document.getElementById("catalyst-box").classList.remove("active");
        
        state.sliderTuring.disabled = false;
        state.sliderSolar.disabled = false;
        state.sliderMutation.disabled = false;
    }
}

function updateLed(elementId, locked) {
    const el = document.getElementById(elementId);
    if (locked) {
        el.classList.add("connected");
    } else {
        el.classList.remove("connected");
    }
}

// --- Phase 6: Secure AI Catalyst API Call ---

async function injectCatalyst() {
    const input = document.getElementById("catalystInput");
    const word = input.value.trim().toUpperCase();
    
    if (!word) return;
    if (state.catalystActive) return;
    
    state.catalystActive = true;
    const apiStatus = document.getElementById("api-status");
    const injectBtn = document.getElementById("injectBtn");
    
    apiStatus.innerText = "INJECTING CORE FREQUENCY...";
    injectBtn.disabled = true;
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: word })
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update App States
        state.colorTheme = data.hexColor;
        state.velocityModifier = data.velocity ? parseFloat(data.velocity) / 10 : 1.0;
        state.pulseEnergy = 2.0; // trigger kinetic visual expansion
        
        // Subtitle output
        document.getElementById("subtitles").innerText = data.speech;
        
        // Speak voice out loud
        speakNarrative(data.speech);
        
        apiStatus.innerText = `CORE RESONANCE SUCCESSFUL [${word}]`;
        input.value = '';
        
    } catch (e) {
        console.error("Catalyst API failure:", e);
        apiStatus.innerText = "COORDINATE ERROR: REINJECTING...";
        
        // Local fallback poetry response
        const fallbackText = `I have received the word ${word}. The raw sentiment disrupts my calculations, shifting my matrix colors. Speak again.`;
        document.getElementById("subtitles").innerText = fallbackText;
        state.colorTheme = '#ff3333';
        state.pulseEnergy = 1.0;
        
        speakNarrative(fallbackText);
    } finally {
        // Cooldown timer
        setTimeout(() => {
            injectBtn.disabled = false;
            if (apiStatus.innerText.includes("SUCCESSFUL")) {
                apiStatus.innerText = "CORE ACTIVE (AWAITING RESONANCE)";
            } else {
                apiStatus.innerText = "CORE STANDBY";
            }
            state.catalystActive = false;
        }, 3000);
    }
}

// --- Phase 7: Speech Synthesis Engine (Edge TTS + Web Speech Fallback) ---

let audioSourceNode = null;
let oscAnimationTimer = null;
let isSpeakingGlobal = false;

async function speakNarrative(text) {
    if (!text) return;
    
    // Stop any currently playing TTS buffer
    if (audioSourceNode) {
        try { audioSourceNode.stop(); } catch(e) {}
    }
    
    // Cancel browser speech
    window.speechSynthesis.cancel();
    
    isSpeakingGlobal = true;
    
    // Step A: Attempt server-side Edge-TTS (High-fidelity)
    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                rate: '-15%', // robotic slow rate
                pitch: '-10%'  // deep pitch
            })
        });
        
        if (!response.ok) throw new Error("TTS endpoint returned error status");
        
        const arrayBuffer = await response.arrayBuffer();
        if (!state.audioCtx) return;
        
        const audioBuffer = await state.audioCtx.decodeAudioData(arrayBuffer);
        
        audioSourceNode = state.audioCtx.createBufferSource();
        audioSourceNode.buffer = audioBuffer;
        
        // Connect to master node
        audioSourceNode.connect(state.masterGain);
        audioSourceNode.start(0);
        
        audioSourceNode.onended = () => {
            isSpeakingGlobal = false;
        };
        return; // Success, skip browser speech synthesis
        
    } catch (err) {
        console.warn("Server side Edge-TTS unavailable, falling back to window.speechSynthesis. Details:", err.message);
    }
    
    // Step B: Native SpeechSynthesis Fallback
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Hunt for a suitable robotic voice
    const voices = window.speechSynthesis.getVoices();
    let bestVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("David") || v.lang.startsWith("en-US"));
    if (bestVoice) {
        utterance.voice = bestVoice;
    }
    
    // Robotic attributes
    utterance.pitch = 0.45; // lower pitch
    utterance.rate = 0.75;  // slower speed
    
    utterance.onend = () => {
        isSpeakingGlobal = false;
    };
    
    utterance.onerror = () => {
        isSpeakingGlobal = false;
    };
    
    window.speechSynthesis.speak(utterance);
}

// Visual Oscilloscope Simulation based on speaking state
function animateVoiceOscilloscope() {
    const bars = document.querySelectorAll(".osc-bar");
    if (!bars.length) return;
    
    bars.forEach(bar => {
        let heightPercent = 10;
        if (isSpeakingGlobal) {
            // Fluctuate dynamically while speaking
            heightPercent = 15 + Math.random() * 85;
        } else if (state.booted) {
            // Low ambient flicker
            heightPercent = 10 + Math.sin(Date.now() * 0.003 + Math.random() * 2) * 5;
        }
        bar.style.height = `${heightPercent}%`;
        
        // Shift colors slightly during convergence or based on voice
        if (state.isLocked) {
            bar.style.backgroundColor = state.colorTheme;
        } else {
            bar.style.backgroundColor = '#00ff66';
        }
    });
}
