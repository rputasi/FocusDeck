# ⚡ FocusDesk (v2.0)
> **Productivity OS for ADHD brains & Deep Work enthusiasts.**

FocusDesk is a neuro-inclusive desktop productivity suite designed to help you manage energy, reduce cognitive load, and achieve your goals without the overwhelm.

![Version](https://img.shields.io/badge/version-2.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

---

## 🌟 Why FocusDesk?
Most productivity apps are either too simple to handle complex projects or too complex for a distracted brain. FocusDesk strikes the perfect balance by providing a **structured environment** that adapts to your mental energy levels.

## ✨ Key Features

### 🧠 AI Coach (Powered by Groq)
Feeling stuck or overwhelmed? Chat with your AI Coach. It understands your current mood (Motivated, Stuck, Overwhelmed, Tired) and provides actionable advice to get you back on track.

### 🎯 Focus Mode & Task Breakdown
- **Task Breakdown:** Automatically split large, intimidating tasks into small, manageable steps.
- **Focus Mode:** A minimalist interface that highlights only the task at hand, silencing the noise.

### 🍅 Smart Pomodoro Timer
- **Integrated Timer:** Traditional 25/5 intervals or custom durations.
- **Away Detection:** Recognizes when you've stepped away and pauses the session to keep your focus data honest.
- **Floating Widget:** Keep an eye on your timer even when FocusDesk is in the background.

### 💡 Idea Garden
Don't let brilliant thoughts vanish. Capture ideas instantly in the "Idea Board" and convert them into scheduled tasks with a single click whenever you're ready to execute.

### 🗂️ Workspaces & Visual Organization
Organize your life into color-coded workspaces (Work, Personal, Side Projects) with custom icons to reduce mental friction.

---

## 🐣 Quick Start (The "Explain Like I'm 5" Version)

**What is this?**  
FocusDesk is like a "personal assistant" for your computer that helps you get things done without getting distracted.

**How do I use it?**
1. **Create a Workspace:** Give it a name (like "School" or "Work") and a cool icon.
2. **Add Tasks:** Type what you need to do.
3. **Feeling Stuck?** Click the "Breakdown" button (↳), and the app will split your big scary task into tiny, easy steps.
4. **Time to Focus:** Start the **Tomato Timer (Pomodoro)**. Work while it's ticking, rest when it stops!
5. **Talk to the Coach:** If you feel bored or stressed, click the **Coach** tab and talk to the AI. It's there to help!

---

## 🚀 Getting Started (For Developers)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A [Groq API Key](https://console.groq.com) (Free) for the AI Coach.

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/rputasi/FocusDeck.git
   cd FocusDeck
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run in development mode:**
   ```bash
   npm run electron:dev
   ```
4. **Build the application:**
   ```bash
   npm run dist
   ```

---

## ⚙️ Configuration
To activate the **AI Coach**, go to the **Settings** tab within the app and paste your Groq API Key. Your data is stored locally and never shared with third parties beyond the AI provider.

---

## 🛠️ Tech Stack
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Runtime:** [Electron](https://www.electronjs.org/)
- **AI Integration:** [Groq API](https://groq.com/)
- **Styling:** Vanilla CSS (Custom Modern UI)
- **State:** React Context API (Neuro-optimized flow)

---

## 🤝 Contributing
Contributions are welcome! If you have ideas for neuro-inclusive features or bug fixes, feel free to fork the repo and submit a PR.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Created with ❤️ for the neurodivergent community.*
