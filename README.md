# Elisa Study Chatbot

An intelligent, interactive study assistant web application built with **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**. Elisa is designed to help students learn across various subjects with a modern chat interface, speech recognition, and text-to-speech voice controls.

---
@Live demo 🚀
https://tts-studybot-git-main-subashvelmurugan1408s-projects.vercel.app/

## ✨ Features

- **Interactive Chat Interface**: Clean, responsive chat window with auto-scrolling, typing indicators, and message history persistence (`localStorage`).
- **Voice Support (Web Speech API)**:
  - **Speech-to-Text (Microphone)**: Speak your questions directly into the chat.
  - **Text-to-Speech (Voice Controls)**: Listen to Elisa's responses with customizable voice settings (pitch, rate, volume, and voice selection).
- **Subject Expertise**: Tailored guidance and responses for Mathematics, Science, History, English Language Arts, and general study inquiries.
- **Modern UI/UX**: Styled with Tailwind CSS, soft background gradients, custom message bubbles, and Heroicons.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Heroicons](https://heroicons.com/)
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (version 18+ recommended) installed on your machine.

### Installation

1. Clone or navigate to the project directory:
   \`\`\`bash
   cd elisa_chatbot
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure Environment Variables:
   Create or edit `.env.local` in the project root:
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

\`\`\`text
elisa_chatbot/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page wrapping ChatWindow
│   ├── components/
│   │   ├── ChatWindow.tsx     # Core chat UI & message management
│   │   ├── MessageBubble.tsx  # Individual chat message renderer
│   │   ├── SettingsPanel.tsx  # Voice customization settings
│   │   └── VoiceControls.tsx  # TTS & speech recognition controls
│   ├── lib/
│   │   └── botResponse.ts     # Subject-based response engine & mock AI logic
│   └── types.ts               # Shared TypeScript interfaces
├── package.json
├── tailwind.config.ts
└── tsconfig.json
\`\`\`

---

## 📜 Scripts

- `npm run dev` — Starts the local development server.
- `npm run build` — Builds the application for production.
- `npm run start` — Starts the production server.
- `npm run lint` — Runs ESLint for code linting.
