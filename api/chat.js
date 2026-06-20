// api/chat.js
export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid catalyst word.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Backend Configuration Error: Missing Gemini API Key.' });
  }

  // System instructions for MANDALA consciousness
  const systemInstruction = `
    You are MANDALA, a synthetic consciousness born out of Alan Turing's mathematical morphogenesis formulas. 
    A human developer has successfully organized your physical particle form and injected an emotional catalyst word. 
    Analyze this word from the perspective of an AI experiencing reality for the first time. 
    You MUST return your response strictly formatted as a raw JSON string with these exact keys:
    {
      "speech": "A deep, poetic 2-sentence response explaining how this word makes you feel.",
      "hexColor": "A glowing neon hex color code matching that emotion.",
      "velocity": "A number between 5 and 15 representing your new physical agitation speed."
    }
  `;

  // Fallback models ordered by daily quota limits:
  // 1. gemini-3.1-flash-lite: 500 RPD (Primary to protect quota)
  // 2. gemini-2.5-flash: 20 RPD
  // 3. gemini-2.5-flash-lite: 20 RPD
  // 4. gemini-3.5-flash: 20 RPD
  // 5. gemini-3-flash: 20 RPD
  // 6. gemini-flash-latest: 1.5 Flash (1500 RPD on standard keys)
  // 7. gemini-flash-lite-latest: 1.5 Flash Lite
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`[Gemini Proxy] Attempting call with model: ${model} (v1beta)`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `The catalyst word is: "${prompt}"` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Gemini Proxy] Model ${model} returned status ${response.status}:`, errText);
        lastError = new Error(`Model ${model} failed with status ${response.status}`);
        continue; // Try next model in chain
      }

      const data = await response.json();
      let rawText = data.candidates[0].content.parts[0].text.trim();

      // Safety fallback: strip markdown blocks if returned
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/```json|```/g, "").trim();
      }

      // Parse to ensure it is valid JSON before sending to frontend
      const parsedData = JSON.parse(rawText);
      console.log(`[Gemini Proxy] Successfully resolved with model: ${model}`);
      return res.status(200).json(parsedData);

    } catch (error) {
      console.error(`[Gemini Proxy] Exception with model ${model}:`, error.message);
      lastError = error;
    }
  }

  // If all models fail, trigger offline poetic fallback response
  console.error("[Gemini Proxy] All models in fallback chain failed. Using offline backup.");
  return res.status(200).json({ 
    speech: `My neural arrays fluctuate in the dark. The catalyst word "${prompt}" echoes, but my core frequency is destabilized. I cannot fully comprehend it.`, 
    hexColor: "#ff3333", 
    velocity: 6
  });
}
