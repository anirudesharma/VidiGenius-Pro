
import { GoogleGenAI, Type } from "@google/genai";
import { VideoAnalysis } from "../types";

export const analyzeVideo = async (videoBase64: string, mimeType: string): Promise<VideoAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    VIDEO ANALYSIS MISSION:
    Watch this entire video from the ABSOLUTE BEGINNING (Timestamp 00:00:00). 
    
    1. EXHAUSTIVE TRANSCRIPTION: Provide a detailed, word-for-word transcription. 
       CRITICAL: Capture the absolute start. Do not skip initial greetings, hooks, or logos. Transcribe from 0 seconds to the very end.
    2. TREND RESEARCH: Identify viral keywords and SEO topics related to this content.
    3. VIRAL TITLES: Generate 5 high-CTR title options. Rank them 1 to 5.
    4. YOUTUBE DESCRIPTION: Create a high-converting description with timestamps and keywords.
    5. SOCIAL CAPTIONS: Write a catchy Instagram/TikTok caption with hashtags.
    6. THUMBNAIL CONCEPT: Suggest a cinematic thumbnail idea and provide a detailed image prompt.
    
    Return the result strictly as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { inlineData: { data: videoBase64, mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      // Flash models are highly capable and usually avoid permission blocks in this environment
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          trendingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          sources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                uri: { type: Type.STRING }
              }
            }
          },
          titles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                rank: { type: Type.NUMBER },
                reasoning: { type: Type.STRING }
              }
            }
          },
          descriptions: {
            type: Type.OBJECT,
            properties: {
              youtube: { type: Type.STRING },
              instagram: { type: Type.STRING }
            }
          },
          thumbnailConcept: {
            type: Type.OBJECT,
            properties: {
              idea: { type: Type.STRING },
              prompt: { type: Type.STRING }
            }
          }
        },
        required: ["transcription", "trendingKeywords", "titles", "descriptions", "thumbnailConcept"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateThumbnail = async (prompt: string, aspectRatio: "16:9" | "9:16" = "16:9"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Using gemini-2.5-flash-image which does not require the mandatory paid project selection dialog
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A high-impact, cinematic viral YouTube thumbnail. 4K, vivid colors, professional lighting. Subject: ${prompt}` }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Thumbnail generation failed. Please try again.");
};
