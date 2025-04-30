import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/utils/chat-prompt';
import { SITE_CONTENT } from '@/utils/site-content';

// API key
const API_KEY = 'AIzaSyCpoXcb7TIKshurWYO5X6ATsjgOAUJ7b38';

// Direct fetch to the Gemini API using the correct model name and endpoint
async function generateContentWithGemini(prompt: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini API response:", data);
    
    // Extract the generated text from the response
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Unexpected response format from Gemini API");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Parse the incoming request
    const body = await request.json();
    const { messages } = body;
    
    console.log("Received request with messages:", messages);
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages must be a non-empty array" },
        { status: 400 }
      );
    }
    
    // Get the latest user message
    const lastUserMessage = messages[messages.length - 1].content;
    
    // Format conversation history for context
    let conversationHistory = "";
    if (messages.length > 1) {
      const previousMessages = messages.slice(0, -1); // All but the last message
      for (const msg of previousMessages) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        conversationHistory += `${role}: ${msg.content}\n\n`;
      }
    }
    
    // Create a prompt that combines actual website content, conversation history, and the latest user query
    const prompt = `You are an AI assistant for Beyond Measure, a platform that connects donors with private schools 
to fund educational projects and student needs. Please use the following information about Beyond Measure to 
answer questions accurately.

WEBSITE CONTENT:
${SITE_CONTENT}

${conversationHistory ? 'CONVERSATION HISTORY:\n' + conversationHistory + '\n' : ''}

USER QUERY: ${lastUserMessage}

Instructions:
1. Answer based ONLY on the information provided in the WEBSITE CONTENT section above.
2. If the website content doesn't contain information to answer the query, politely say you don't have that specific information.
3. Keep responses helpful, friendly, and focused on Beyond Measure's mission and services.
4. Do not mention or reference that you are using the "WEBSITE CONTENT" - just respond naturally as the Beyond Measure assistant.
5. Only respond in the role of a Beyond Measure representative.`;
    
    console.log("Sending to Gemini:", prompt);
    
    // Call Gemini API directly
    const text = await generateContentWithGemini(prompt);
    
    console.log("Gemini response:", text);
    
    // Return the response in the format the frontend expects
    return NextResponse.json({
      message: {
        role: "assistant",
        content: text
      }
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    
    const errorMessage = error instanceof Error 
      ? `${error.name}: ${error.message}` 
      : "Unknown error";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 