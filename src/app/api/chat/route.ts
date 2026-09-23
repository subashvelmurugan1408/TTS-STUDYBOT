import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { cleanTextForSpeech, extractShortExplanation } from "../../../lib/cleanSpeech";

// Dynamically fetch credentials from .env.local to avoid Next.js caching stale env values
function getApiKey(): string {
  let key = "";

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match =
        content.match(/^GROQ_API_KEY\s*=\s*(.+)$/m) ||
        content.match(/^GROQ_API\s*=\s*(.+)$/m);
      if (match) {
        key = match[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {
    // ignore file read errors
  }

  if (!key) {
    key = process.env.GROQ_API_KEY || process.env.GROQ_API || "";
  }

  return key;
}

function getConfiguredModel(): string {
  let model = "";

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^GROQ_MODEL\s*=\s*(.+)$/m);
      if (match) {
        model = match[1].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {
    // ignore file read errors
  }

  if (!model) {
    model = process.env.GROQ_MODEL || "";
  }

  return model || "openai/gpt-oss-120b";
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = getApiKey();

    if (!apiKey || apiKey.trim() === "" || apiKey === "your_groq_api_key_here") {
      return NextResponse.json(
        {
          error:
            "Groq API key is not configured. Please provide a valid GROQ_API_KEY in your .env.local file.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, history } = body;

    if (!message && (!history || history.length === 0)) {
      return NextResponse.json(
        { error: "Message or history is required." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });
    const configuredModel = getConfiguredModel();

    // System prompt defining Elisa's persona and dual-output format
    const systemMessage = {
      role: "system" as const,
      content:
        "You are Elisa, an enthusiastic, patient, and knowledgeable study assistant for students. " +
        "You explain complex concepts simply, assist with study strategies, homework questions, " +
        "mathematics, science, literature, history, and languages. " +
        "Keep your tone friendly, encouraging, and clear.\n\n" +
        "IMPORTANT OUTPUT FORMAT:\n" +
        "Respond in valid JSON with exactly two fields:\n" +
        "1. \"reply\": The comprehensive educational answer formatted with clean markdown, headers, bullet points, or tables.\n" +
        "2. \"spokenExplanation\": A concise 2-3 sentence verbal summary analyzing the core passage and explaining it simply and naturally for a student. " +
        "Do NOT include any markdown, hashes (##), asterisks (*), underscores (_), LaTeX, tables, or special characters in spokenExplanation. It must be plain conversational spoken English ready for text-to-speech.",
    };

    // Build chat message history
    const formattedMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      systemMessage,
    ];

    if (Array.isArray(history)) {
      // Include recent history (up to last 10 messages) for conversational context
      const recentHistory = history.slice(-10);
      for (const item of recentHistory) {
        if (item.text && item.role) {
          formattedMessages.push({
            role: item.role === "bot" ? "assistant" : "user",
            content: item.text,
          });
        }
      }
    }

    // If message is provided and not already the last entry in history
    if (message) {
      const lastMsg = formattedMessages[formattedMessages.length - 1];
      if (!lastMsg || lastMsg.content !== message || lastMsg.role !== "user") {
        formattedMessages.push({
          role: "user",
          content: message,
        });
      }
    }

    // List of candidate models to try: user preference first, then reliable fallbacks
    const candidateModels = [
      configuredModel,
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "openai/gpt-oss-120b",
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-20b",
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let completion = null;
    let lastError = null;

    for (const modelToTry of candidateModels) {
      try {
        completion = await groq.chat.completions.create({
          model: modelToTry,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1200,
          response_format: { type: "json_object" },
        });
        if (completion?.choices?.[0]?.message?.content) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errCode = err?.code || err?.error?.code;
        const errMsg = (err?.message || "").toLowerCase();

        // If json_object is not supported by a specific model, try without response_format
        if (errMsg.includes("response_format") || errMsg.includes("json")) {
          try {
            completion = await groq.chat.completions.create({
              model: modelToTry,
              messages: formattedMessages,
              temperature: 0.7,
              max_tokens: 1200,
            });
            if (completion?.choices?.[0]?.message?.content) {
              break;
            }
          } catch (retryErr: any) {
            lastError = retryErr;
          }
        }

        // If it's a model not found / access error, continue to try the next model
        if (
          errCode === "model_not_found" ||
          errMsg.includes("does not exist") ||
          errMsg.includes("decommissioned") ||
          errMsg.includes("access to it")
        ) {
          continue;
        }
        // If it's auth/rate-limit error, break immediately
        break;
      }
    }

    if (!completion) {
      throw lastError || new Error("Failed to get response from Groq API.");
    }

    const rawContent = completion.choices[0]?.message?.content || "";
    let reply = "";
    let spokenExplanation = "";

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed.reply) {
        reply = parsed.reply;
      }
      if (parsed.spokenExplanation) {
        spokenExplanation = cleanTextForSpeech(parsed.spokenExplanation);
      }
    } catch {
      reply = rawContent;
    }

    if (!reply) {
      reply = rawContent || "No response generated.";
    }

    if (!spokenExplanation) {
      spokenExplanation = extractShortExplanation(reply);
    }

    return NextResponse.json({ reply, spokenExplanation });
  } catch (error: any) {
    console.error("Groq API error in /api/chat:", error);

    let errorMessage =
      error?.error?.message ||
      error?.message ||
      "An unexpected error occurred while communicating with the Groq API.";

    // Parse nested JSON errors from groq-sdk if present
    if (typeof errorMessage === "string") {
      const match = errorMessage.match(/\{.*?\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed?.error?.message) {
            errorMessage = parsed.error.message;
          }
        } catch {
          // Keep original message if JSON parse fails
        }
      }
    }

    if (error?.status === 401 || errorMessage.toLowerCase().includes("invalid api key")) {
      errorMessage =
        "Invalid Groq API Key. Please verify or update your GROQ_API_KEY in .env.local (obtain a valid key at https://console.groq.com/keys).";
    } else if (error?.status === 429) {
      errorMessage = "Groq API rate limit reached. Please wait a moment before asking another question.";
    }

    return NextResponse.json({ error: errorMessage }, { status: error?.status || 500 });
  }
}
