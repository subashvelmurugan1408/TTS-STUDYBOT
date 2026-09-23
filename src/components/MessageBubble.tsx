"use client";

import { useMemo } from "react";
import { type Message } from "../types";
import VoiceControls from "./VoiceControls";
import { type VoiceSettings } from "./VoiceControls";

interface Props {
  message: Message;
  settings: VoiceSettings;
}

export default function MessageBubble({ message, settings }: Props) {
  const isUser = message.role === "user";

  // Format timestamp
  const formattedTime = useMemo(() => {
    const date = message.timestamp;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [message.timestamp]);

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
          E
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm border ${
          isUser
            ? "bg-indigo-600 text-white border-indigo-600 rounded-br-md"
            : "bg-white text-gray-800 border-gray-200 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {message.text}
        </p>

        {/* Voice controls for bot messages */}
        {!isUser && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <VoiceControls
              text={message.text}
              spokenExplanation={message.spokenExplanation}
              settings={settings}
            />
          </div>
        )}

        <span
          className={`block text-[11px] mt-1.5 ${
            isUser ? "text-indigo-200" : "text-gray-400"
          }`}
        >
          {formattedTime}
        </span>
      </div>
    </div>
  );
}