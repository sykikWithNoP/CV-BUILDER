const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  keyGenerator: (req) => req.user?.userId || req.ip,
  handler: (_, res) => res.status(429).json({ error: 'Daily AI generation limit reached (5/day). Try again tomorrow.' }),
});

/**
 * Call Google Gemini API to generate structured CV data from a text prompt.
 */
async function generateWithGemini(prompt) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY not configured');

  const systemPrompt = `You are a professional CV/resume writer. Given the user's career information, generate a complete, well-structured CV in JSON format. The JSON must match this exact schema:
{
  "firstName": "string",
  "lastName": "string",
  "jobTitle": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string (optional)",
  "github": "string (optional)",
  "summary": "string (2-3 sentences professional summary)",
  "experience": [{"title": "string", "company": "string", "start": "string", "end": "string", "description": "string (2-3 lines)"}],
  "education": [{"degree": "string", "school": "string", "year": "string"}],
  "skills": [{"name": "string"}],
  "languages": [{"name": "string", "level": "string"}],
  "hobbies": "string (comma separated)"
}
Make the content professional, concise, and ATS-friendly. Use action verbs. Quantify achievements where possible. If information is missing, generate reasonable professional defaults. Return ONLY valid JSON, no markdown or explanation.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser's career information:\n${prompt}` }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from AI');

  // Parse and validate the JSON
  const cvData = JSON.parse(text);
  const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

  return { cvData, tokensUsed };
}

/* ---------- GENERATE CV ---------- */
router.post(
  '/generate-cv',
  verifyToken,
  aiLimiter,
  [
    body('prompt').trim().isLength({ min: 20, max: 5000 }).withMessage('Prompt must be 20-5000 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { prompt } = req.body;
    const db = req.app.locals.db;

    try {
      const { cvData, tokensUsed } = await generateWithGemini(prompt);

      // Log generation
      await db.runAsync(
        `INSERT INTO ai_generation_logs (user_id, prompt_summary, tokens_used, created_at)
         VALUES (?, ?, ?, datetime('now'))`,
        [req.user.userId, prompt.substring(0, 200), tokensUsed]
      );

      res.json({ cvData, tokensUsed });
    } catch (e) {
      console.error('AI generation error:', e.message);
      res.status(500).json({ error: 'AI generation failed: ' + e.message });
    }
  }
);

/* ---------- GENERATION HISTORY ---------- */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const rows = await req.app.locals.db.allAsync(
      'SELECT id, prompt_summary, tokens_used, created_at FROM ai_generation_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

module.exports = router;
