"use client";

import ChatWindow from "../components/ChatWindow";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/50 to-purple-50/50 py-8 px-4">
      <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)]">
        {/* Optional: Floating decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative h-full">
          <ChatWindow />
        </div>
      </div>

      {/* Footer with helpful text */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>TTS Study Chatbot • Powered by Groq Llama &amp; Web Speech API</p>
      </footer>
    </main>
  );
}