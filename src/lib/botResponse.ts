import { Message } from "../types";

export interface BotResponseResult {
  reply: string;
  spokenExplanation?: string;
}

/**
 * Sends the user question and conversation history to the Groq API route.
 * Returns both the comprehensive formatted reply and a clean spoken explanation.
 */
export async function getBotResponse(
  question: string,
  history: Message[] = []
): Promise<BotResponseResult> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: question,
      history,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error || `HTTP ${response.status}: Failed to get bot response`;
    throw new Error(errorMsg);
  }

  return {
    reply: data.reply || "",
    spokenExplanation: data.spokenExplanation,
  };
}