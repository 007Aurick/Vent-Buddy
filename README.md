# 🎙️ VentBuddy

> A local, private AI companion to vent to — built with LangChain + Ollama. No advice, no judgment, just someone who remembers what you said. 💬

---

## ✨ What is this?

VentBuddy is a chatbot designed for one thing: **listening**. Instead of jumping to solutions or advice, it reflects back what you share and validates how you're feeling — like venting to a good friend, not consulting a therapist.

Runs **entirely locally** via [Ollama](https://ollama.com) — nothing you say leaves your machine. 🔒

---

## 🧠 Features

- 🗣️ **Conversational memory** — remembers context throughout your session
- 🤍 **Listening-first design** — tuned to validate, not advise, unless you ask
- 🏠 **Fully local** — powered by Ollama, no API keys, no cloud calls
- ⚡ **Built with LangChain** — clean, swappable model backend
- 🌐 *(in progress)* **Web-based** — FastAPI backend, bring-your-own-frontend

---

## 🛠️ Tech Stack

| Layer | Tool |
|-------|------|
| 🦜 LLM orchestration | [LangChain](https://www.langchain.com/) |
| 🤖 Local model runtime | [Ollama](https://ollama.com) |
| 🚀 Backend API *(planned)* | [FastAPI](https://fastapi.tiangolo.com/) |
| 💾 Session storage *(planned)* | SQLite |

---

## 📦 Installation

\`\`\`bash
git clone https://github.com/yourusername/ventbuddy.git
cd ventbuddy

pip install -U langchain langchain-ollama

ollama pull llama3.1
\`\`\`

---

## 🚀 Usage

\`\`\`bash
python vent_buddy.py
\`\`\`

Then just start typing. VentBuddy will listen, reflect, and remember what you've told it for the rest of the session.

\`\`\`
You: rough day today
VentBuddy: That sounds heavy. Want to tell me what happened?
\`\`\`

---

## 🗺️ Roadmap

- [x] 💬 Core chat loop with memory
- [x] 🎯 Listening-focused system prompt
- [ ] 🚨 Crisis-language detection with resource fallback
- [ ] 🌐 FastAPI backend with session support
- [ ] 💾 Persistent memory across sessions (SQLite)
- [ ] 🎙️ Voice input/output
- [ ] 🖥️ Frontend

---

## ⚠️ A Note on Scope

VentBuddy is a **listening companion**, not a licensed therapist and not a crisis service. If you're in crisis or experiencing thoughts of self-harm, please reach out to a real human — a crisis line, a trusted person, or a professional. 💛


## 🚀 Demo

![Preview](https://img.youtube.com/vi/ueAmlV6UAzs/0.jpg)

▶️ Full Demo: https://www.youtube.com/watch?v=vsgJC1_OcGw



