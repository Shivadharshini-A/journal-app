import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({ apiKey });
}

// Multi-turn Brainstorming Chat Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, contextEntry, persona = 'creative_partner', customInstructions } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getGeminiClient();

    let systemInstruction = `You are a thoughtful, perceptive, and creative brainstorming partner in a Personal Journal application called "Personal Gemini Journal".
Your purpose is to help the user unpack their thoughts, explore new creative angles, reflect deeper on their experiences, connect dots between past entries, and turn raw reflections into actionable ideas.
Always be constructive, engaging, empathetic, and intellectually curious. Use clear formatting with bullet points, bold key insights, and ask 1-2 thoughtful follow-up questions when relevant to keep the brainstorm momentum going.`;

    if (persona === 'socratic_mentor') {
      systemInstruction += `
Adopt a gentle Socratic Mentor style: ask penetrating yet supportive questions, challenge hidden assumptions constructively, and help the user find clarity within themselves.`;
    } else if (persona === 'creative_spark') {
      systemInstruction += `
Adopt an imaginative Creative Muse style: offer unconventional perspectives, lateral thinking metaphors, writing prompts, and intriguing scenarios.`;
    } else if (persona === 'empathetic_listener') {
      systemInstruction += `
Adopt a warm, compassionate, and validating tone: focus on emotional resonance, mindful grounding, self-compassion, and gentle reflections.`;
    } else if (persona === 'action_planner') {
      systemInstruction += `
Adopt a structured Action Strategist style: help turn journal reflections and insights into concrete, realistic micro-habits, next steps, and decision frameworks.`;
    }

    if (contextEntry && (contextEntry.title || contextEntry.content)) {
      systemInstruction += `\n\n[CURRENT JOURNAL ENTRY CONTEXT]:
Title: ${contextEntry.title || 'Untitled'}
Date: ${contextEntry.date || 'Recent'}
Mood: ${contextEntry.mood || 'Unspecified'}
Tags: ${Array.isArray(contextEntry.tags) ? contextEntry.tags.join(', ') : 'None'}
Entry Content:
"""
${contextEntry.content || ''}
"""
Use this journal entry context naturally to ground your responses, offer relevant connections, and brainstorm related ideas.`;
    }

    if (customInstructions) {
      systemInstruction += `\n\nUser specific custom focus: ${customInstructions}`;
    }

    // Format messages for @google/genai SDK
    // SDK expects contents: Array of { role: 'user' | 'model', parts: [{ text: '...' }] }
    const formattedContents = messages.map((m: { role: string; text?: string; content?: string }) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text || m.content || '' }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.75,
        maxOutputTokens: 2048,
      },
    });

    const replyText = response.text || 'I have reflected on your thoughts. What direction would you like to explore next?';
    
    // Also extract 2-3 quick follow-up prompt chips if possible
    res.json({
      reply: replyText,
      model: 'gemini-1.5-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate response from Gemini',
    });
  }
});

// Deep Journal Analysis & Reflection Generator
app.post('/api/gemini/analyze-entry', async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Entry content is required' });
    }

    const ai = getGeminiClient();

    const prompt = `Analyze this personal journal entry and provide structured reflections in JSON format.
Entry Title: ${title || 'Untitled'}
Reported Mood: ${mood || 'Not specified'}
Existing Tags: ${Array.isArray(tags) ? tags.join(', ') : 'None'}

Entry Content:
"""
${content}
"""

Return a valid JSON object matching this schema:
{
  "oneSentenceSummary": "A concise, meaningful 1-sentence synthesis of the core theme or emotional beat.",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "detectedMood": "e.g. Grateful, Pensive, Excited, Overwhelmed, Peaceful, Energized",
  "growthReflection": "A warm, uplifting, or grounding psychological reflection to consider.",
  "brainstormStarters": ["A thought-provoking question to brainstorm about next", "Another creative angle to explore"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        oneSentenceSummary: 'Reflective personal entry captured with depth.',
        keyInsights: ['Captures honest personal thoughts and contemplation.'],
        suggestedTags: ['reflection', 'journal'],
        detectedMood: mood || 'Pensive',
        growthReflection: 'Taking time to document your thoughts creates space for clarity and personal insight.',
        brainstormStarters: ['What is one small action that could build on this reflection today?'],
      };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze-entry:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze journal entry',
    });
  }
});

// Daily & Contextual Prompts Generator
app.post('/api/gemini/suggest-prompts', async (req, res) => {
  try {
    const { recentThemes, preferredCategory = 'mixed', timeOfDay } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate 4 inspiring and unique personal journal prompts for a user.
Category Preference: ${preferredCategory}
Time of Day: ${timeOfDay || 'Current'}
Recent themes/tags in user's journal: ${Array.isArray(recentThemes) ? recentThemes.join(', ') : 'General life, growth, creativity'}

Return a valid JSON array of objects:
[
  {
    "id": "1",
    "category": "Mindfulness | Creativity | Strategy | Gratitude | Self-Discovery",
    "title": "Short Catchy Hook",
    "prompt": "The full journaling prompt question or thought exercise.",
    "starterSnippet": "Suggested first words to jumpstart writing..."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.85,
      },
    });

    const text = response.text || '[]';
    let prompts;
    try {
      prompts = JSON.parse(text);
    } catch {
      prompts = [
        {
          id: '1',
          category: 'Gratitude',
          title: 'Unsung Anchor',
          prompt: 'What was a small, quiet moment today that brought you unexpected peace?',
          starterSnippet: 'Today, I found unexpected stillness when...',
        },
        {
          id: '2',
          category: 'Self-Discovery',
          title: 'Energy Audit',
          prompt: 'What activity gave you the most energy this week, and what drained it?',
          starterSnippet: 'Looking back at my week, what fueled me most was...',
        },
      ];
    }

    res.json({ prompts });
  } catch (error: any) {
    console.error('Error in /api/gemini/suggest-prompts:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate prompts',
    });
  }
});

// Writer's Block Assistant & Entry Continuation
app.post('/api/gemini/continue-writing', async (req, res) => {
  try {
    const { title, currentContent, direction = 'deepen' } = req.body;
    const ai = getGeminiClient();

    const prompt = `The user is writing a personal journal entry and requested gentle assistance.
Current Title: ${title || 'Untitled'}
Direction requested: ${direction} (options: deepen reflection, explore what-ifs, unpack emotion, summarize thoughts, find silver lining)

Current Draft:
"""
${currentContent || ''}
"""

Provide 3 distinct writing continuation options or thought seeds that the user can copy or be inspired by.
Return a valid JSON object:
{
  "suggestions": [
    {
      "type": "Reflective Question",
      "text": "A question to answer in the next paragraph"
    },
    {
      "type": "Continuation Sentence",
      "text": "A smooth sentence opening that continues their exact train of thought"
    },
    {
      "type": "New Perspective",
      "text": "An intriguing alternative angle or what-if scenario to explore"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { suggestions: [] };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/gemini/continue-writing:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate suggestions',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Gemini Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
