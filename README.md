# LingoVibe - Interactive English Learning Web Application

LingoVibe is a modern, high-fidelity English learning platform built with **Next.js (App Router)**, **Tailwind CSS (v4)**, and **JavaScript**. It provides dynamic interfaces for both **Teachers** and **Students** with interactive components, real-time feedback, and Web Speech API integrations.

---

## 🚀 Tech Stack

*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Typeface**: [Outfit (via next/font/google)](https://fonts.google.com/specimen/Outfit)
*   **APIs**: HTML5 Web Speech API (`SpeechSynthesis` & `SpeechRecognition`)

---

## 🎨 Theme Design System

The platform uses a premium, modern light-purple and lavender theme:
*   **Primary/Buttons**: Lavender / Light Purple (`#8B5CF6` / `bg-brand-primary` & `bg-brand-light`)
*   **Backgrounds**: Very soft purple-white tint (`#F5F3FF` & `#F9FAFB` / `bg-brand-bg` & `bg-brand-soft`)
*   **Text/Headings**: Deep Royal Purple (`#4C1D95` / `text-brand-dark`)
*   **Success states**: Mint Green (`#10B981` / `text-brand-success` & `bg-brand-success`)
*   **Styling elements**: Soft glassmorphism cards (`.glass` utilities) and subtle micro-animations (e.g. floating, typing pulses).

---

## 📁 File Structure

```text
├── app/
│   ├── favicon.ico
│   ├── globals.css         # Custom theme configuration, @theme declarations, glassmorphism CSS
│   ├── layout.js           # Base HTML layout importing the Google Outfit font and SEO metadata
│   ├── page.js             # LingoVibe Landing Page (Hero section, 4-core features, CTA)
│   ├── login/
│   │   └── page.js         # Mock auth form (Student/Teacher role routing, localStorage states)
│   ├── teacher/
│   │   └── page.js         # Teacher dashboard (Student list table, Assignment publisher, Toasts)
│   └── student/
│       └── page.js         # Student workspace containing the 4 Core Learning Blocks
├── public/                 # Static assets (icons, images)
├── package.json            # Scripts and dependency listing
├── eslint.config.mjs       # Code styling linter configurations
└── README.md               # Project documentation (This file)
```

---

## 🎤 How the Web Speech API Works

LingoVibe leverages native browser audio capabilities without the need for external, costly third-party speech servers:

### 1. Pronunciation Playback (`window.speechSynthesis`)
In **Block 3 (Pronunciation Checker)**, clicking the **Listen** button utilizes the Text-to-Speech (TTS) engine.
```javascript
const speakWord = (word) => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US"; // Standard American English accent
    utterance.rate = 0.85;    // Slightly slower rate for learners
    window.speechSynthesis.speak(utterance);
  }
};
```

### 2. Speech-to-Text Recognition (`SpeechRecognition`)
In both the **Pronunciation Checker (Block 3)** and **AI Speaking Club (Block 4)**, speech input is captured using the browser's audio transcription engine:
```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  
  recognition.onresult = (event) => {
    const speechToTextResult = event.results[0][0].transcript;
    // For pronunciation: compares speechToTextResult with the target word
    // For chat club: inserts speechToTextResult into the message input field
  };
  recognition.start();
}
```
*Note: The Speech Recognition API requires microphone permissions and is supported in Google Chrome, Microsoft Edge, and Safari.*

---

## 🔌 Future Integration Architecture

This application is set up with clear mock interfaces ready to accept database and generative AI integrations. Here is the blueprint for the next steps:

### 1. Database & Authentication (Supabase)
To transition from local mock authentication and static lists, add Supabase:

*   **Authentication**: Replace mock state logins in `app/login/page.js` with the `@supabase/supabase-js` client:
    ```javascript
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    ```
*   **Database**:
    *   Store student stats and level scores in a `students` table.
    *   Pull the active homework and assignments in `app/student/page.js` from an `assignments` table, which is updated when a teacher publishes a form in `app/teacher/page.js`.

### 2. Generative AI Conversational Coach (Google Gemini API)
To replace the mock rules-based replies in **Block 4 (AI Speaking Club)**:

1.  Set up a Next.js API route (`app/api/chat/route.js`) or Server Action.
2.  Use the official Google Gen AI SDK (`@google/genai`):
    ```javascript
    import { GoogleGenAI } from '@google/genai';
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // In your API request handler:
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      systemInstruction: 'You are Coach Vibe, a supportive and professional English tutor. Encourage the student, correct grammar errors gently, and ask follow-up questions to maintain the conversation.'
    });
    const reply = response.text;
    ```
3.  Fetch the API route in `app/student/page.js` inside the `handleSendMessage` function to show real-time dynamic, AI-powered conversational tutoring.

---

## 🛠️ Project Setup

### Installation
Clone or navigate to the project root and install the packages:
```bash
npm install
```

### Running the Development Server
Launch the local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to experience the application.

### Building for Production
Verify compile sanity:
```bash
npm run build
```
