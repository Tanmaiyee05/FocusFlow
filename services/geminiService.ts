import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LearningModule } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const quizOptionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "A, B, C, or D" },
    text: { type: Type.STRING },
  },
  required: ["id", "text"],
};

const quizQuestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    question: { type: Type.STRING },
    options: { type: Type.ARRAY, items: quizOptionSchema },
    correctAnswerId: { type: Type.STRING, description: "The ID of the correct option (A, B, C, or D)" },
    explanation: { type: Type.STRING },
  },
  required: ["id", "question", "options", "correctAnswerId", "explanation"],
};

const breakdownItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    emoji: { type: Type.STRING, description: "A single relevant emoji" },
    text: { type: Type.STRING, description: "Short sentence explanation" },
    boldKeyTerm: { type: Type.STRING, description: "The specific term to highlight/bold" },
  },
  required: ["emoji", "text", "boldKeyTerm"],
};

const moduleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tldr: { type: Type.STRING, description: "A single-sentence high-energy summary." },
    visualMap: { type: Type.STRING, description: "A STRICTLY VERTICAL ASCII flowchart (top to bottom). Max width 30 characters. Use simple box borders (+-+) and down arrows (v) to ensure it fits on mobile screens." },
    analogy: { type: Type.STRING, description: "Explain the concept using a video game, sport, or movie comparison." },
    breakdown: { type: Type.ARRAY, items: breakdownItemSchema, description: "4-6 bite-sized key points." },
    quiz: { type: Type.ARRAY, items: quizQuestionSchema, description: "Minimum of 5 multiple choice questions." },
  },
  required: ["tldr", "visualMap", "analogy", "breakdown", "quiz"],
};

export const generateLearningModule = async (text: string, imageBase64?: string, mimeType?: string): Promise<LearningModule> => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are FocusFlow, an AI learning engine for neurodivergent minds. 
    You turn boring text (or images) into a high-dopamine 'Knowledge Game'. 
    The user has ADHD/Dyslexia. They hate 'walls of text'.
    
    Analyze the user's input. Transform it into a structured learning module.
    1. THE TL;DR: Single sentence, punchy.
    2. VISUAL MAP: Vertical ASCII flowchart (max 30 chars wide).
    3. THE ANALOGY: Use video games, sports, or movies.
    4. BITE-SIZED BREAKDOWN: Short sentences, start with emojis.
    5. QUIZ: Fun check-in. Provide at least 5 questions.
  `;

  try {
    const parts: any[] = [];
    
    // Add image if present
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      });
    }

    // Add text if present, or a default prompt if only image is provided
    if (text.trim()) {
      parts.push({ text: `Analyze this text/content and convert to FocusFlow format: \n\n${text}` });
    } else if (imageBase64) {
      parts.push({ text: "Analyze this image and convert to FocusFlow format." });
    }

    if (parts.length === 0) {
        throw new Error("No input provided");
    }

    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: "user", parts: parts }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: moduleSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as LearningModule;
    }
    throw new Error("No response text generated");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const remixSentence = async (sentence: string): Promise<string> => {
    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `
      You are the 'Remix Engine' for FocusFlow.
      Rewrite the provided sentence using a 5-year-old's vocabulary and a completely new, fun metaphor.
      Keep it very short and energetic.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: "user", parts: [{ text: `REMIX THIS: "${sentence}"` }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "text/plain",
        },
      });
  
      return response.text || "Could not remix right now!";
  
    } catch (error) {
      console.error("Gemini Remix Error:", error);
      return "Remix failed. Try again!";
    }
  };