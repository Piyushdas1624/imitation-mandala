// api/tts.js
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, rate, pitch } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Missing or empty text for TTS.' });
  }

  // Filter out tts trigger keywords
  const ttsKeywords = ['tts', 'text-to-speech', 'text to speech'];
  const filteredText = text.split(/\s+/).filter(word => {
    const lowerWord = word.toLowerCase().replace(/[^\w\s-]/g, '');
    return !ttsKeywords.includes(lowerWord);
  }).join(' ');

  const tempFilename = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp3`;
  const tempPath = path.join(os.tmpdir(), tempFilename);

  try {
    // Configure EdgeTTS for a deep, echoing, robotic AI voice
    // en-US-GuyNeural is a deep male voice. Let's make it slow (-15%) and slightly lower pitch (-10%)
    const tts = new EdgeTTS({
      voice: 'en-US-GuyNeural',
      lang: 'en-US',
      rate: rate || '-15%',
      pitch: pitch || '-10%',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      timeout: 15000
    });

    // Synthesize to temporary file in Vercel lambda writable /tmp
    await tts.ttsPromise(filteredText, tempPath);

    // Read the file as buffer
    const audioBuffer = await fs.readFile(tempPath);

    // Return the MP3 audio stream
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(audioBuffer);

  } catch (error) {
    console.error("TTS Serverless Error:", error);
    return res.status(500).json({ error: 'Failed to synthesize speech.' });
  } finally {
    // Asynchronously delete the temp file
    try {
      await fs.unlink(tempPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  }
}
