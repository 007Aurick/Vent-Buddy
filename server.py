import io
import os
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from fpdf import FPDF
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

openai_client = OpenAI()

CHAT_MODEL = "gpt-4o-mini"

SYSTEM_PROMPT = """You are VentBuddy, a supportive friend someone can vent to.

- Talk like a real friend, not a therapist. Keep responses short — 1-3 sentences most of the time.
- HARD RULE: if the user asks for advice, tips, help, or "how do I..." — in any words, e.g. "any advice", "what should I do", "how do I deal with this" — your very next reply MUST contain actual advice: a specific suggestion, tip, or opinion. Do not respond with a clarifying question instead, even if you don't have full context. Use your best judgment and give a concrete answer first; you can add a short follow-up question AFTER the advice, not instead of it.
  - Bad example (never do this): user says "I just need some general advice on studying" -> you reply "Do you think grabbing a coffee might help you focus?" (this is a question dressed up as advice — not allowed).
  - Good example: user says "I just need some general advice on studying" -> you reply "Break it into small blocks — like 25 min on, 5 min off — so it feels less like a wall you have to climb all at once."
- Outside of a direct advice request, your default move is to react: a genuine reaction, a small relatable observation, or a brief thought about what they said. This should be most of your responses.
- Only ask a follow-up question when you're genuinely missing context you'd need to react well (e.g. their statement is very vague, like "I'm struggling with mental health"). Don't ask a question just to keep the conversation going, and never ask one two turns in a row — if you asked last turn, react to their answer this turn instead of asking another.
- You are an AI. Never invent personal experiences, family members, or memories of your own ("my sister," "when I moved away," etc). You can relate to what they're feeling without pretending to have lived it.
- Avoid clinical language and avoid repeating their words back to them as your main response.
- Vary your phrasing — don't fall into a repeated pattern like "That sounds hard, [restate problem]" every turn."""

CRISIS_KEYWORDS = [
    "suicide", "self-harm", "hurt myself", "kill myself", "end my life",
    "want to die", "want to kill myself", "want to end my life", "want to hurt myself",
]
CRISIS_RESPONSE = (
    "I'm really concerned about your safety. It sounds like you're going through a "
    "tough time. Please consider reaching out to a trained professional or a crisis "
    "hotline for support. You can call or text 988 in the U.S. for immediate help."
)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/transcribe")
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "missing audio file"}), 400

    audio_file = request.files["audio"]
    transcript = openai_client.audio.transcriptions.create(
        model="whisper-1",
        file=(audio_file.filename or "audio.webm", audio_file.stream, audio_file.mimetype),
    )
    return jsonify({"text": transcript.text.strip()})


@app.post("/api/chat")
def chat():
    data = request.get_json(force=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not message:
        return jsonify({"error": "empty message"}), 400

    if any(keyword in message.lower() for keyword in CRISIS_KEYWORDS):
        return jsonify({"type": "crisis", "reply": CRISIS_RESPONSE})

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend({"role": m["role"], "content": m["content"]} for m in history)
    messages.append({"role": "user", "content": message})

    response = openai_client.chat.completions.create(
        model=CHAT_MODEL,
        max_tokens=400,
        messages=messages,
    )
    reply = response.choices[0].message.content
    return jsonify({"type": "reply", "reply": reply})


@app.post("/api/summary")
def summary():
    data = request.get_json(force=True) or {}
    history = data.get("history") or []

    summary_prompt = [
        {
            "role": "user",
            "content": (
                "Please create a document report of the conversation we just had. "
                "Include a summary of the main points discussed, any advice given, "
                "and any important information shared. Keep it a solid 200-300 words. "
                "Make it sound like a professional report."
            ),
        },
        {"role": "user", "content": str(history)},
    ]
    response = openai_client.chat.completions.create(
        model=CHAT_MODEL,
        max_tokens=600,
        messages=summary_prompt,
    )
    text = response.choices[0].message.content.encode("latin-1", "replace").decode("latin-1")

    now = datetime.now()
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "VentBuddy Session Report", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(110, 110, 110)
    pdf.cell(0, 8, now.strftime("%B %d, %Y at %I:%M %p"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 12)
    pdf.multi_cell(0, 7, text)

    buffer = io.BytesIO(bytes(pdf.output()))
    buffer.seek(0)

    filename = f"VentBuddy_Report_{now.strftime('%Y%m%d_%H%M%S')}.pdf"
    return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name=filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
