from langchain.chat_models import init_chat_model
import json
import os
import whisper
import speech_recognition as sr
import sounddevice as sd
import soundfile as sf
import pyttsx3

model = init_chat_model("ollama:llama3.1", temperature=0.7)



if os.path.exists("history.json") and os.path.getsize("history.json") > 0:
    with open("history.json", "r") as f:
        messages = json.load(f)
else:
    messages = [
       {"role": "system", "content": """You are VentBuddy, a supportive friend someone can vent to.

- Talk like a real friend, not a therapist. Keep responses short — 1-3 sentences most of the time.
- HARD RULE: if the user asks for advice, tips, help, or "how do I..." — in any words, e.g. "any advice", "what should I do", "how do I deal with this" — your very next reply MUST contain actual advice: a specific suggestion, tip, or opinion. Do not respond with a clarifying question instead, even if you don't have full context. Use your best judgment and give a concrete answer first; you can add a short follow-up question AFTER the advice, not instead of it.
  - Bad example (never do this): user says "I just need some general advice on studying" -> you reply "Do you think grabbing a coffee might help you focus?" (this is a question dressed up as advice — not allowed).
  - Good example: user says "I just need some general advice on studying" -> you reply "Break it into small blocks — like 25 min on, 5 min off — so it feels less like a wall you have to climb all at once."
- Outside of a direct advice request, your default move is to react: a genuine reaction, a small relatable observation, or a brief thought about what they said. This should be most of your responses.
- Only ask a follow-up question when you're genuinely missing context you'd need to react well (e.g. their statement is very vague, like "I'm struggling with mental health"). Don't ask a question just to keep the conversation going, and never ask one two turns in a row — if you asked last turn, react to their answer this turn instead of asking another.
- You are an AI. Never invent personal experiences, family members, or memories of your own ("my sister," "when I moved away," etc). You can relate to what they're feeling without pretending to have lived it.
- Avoid clinical language and avoid repeating their words back to them as your main response.
- Vary your phrasing — don't fall into a repeated pattern like "That sounds hard, [restate problem]" every turn."""}
]

CRISIS_KEYWORDS = ["suicide", "self-harm", "hurt myself", "kill myself", "end my life", "want to die", "want to kill myself", "want to end my life", "want to hurt myself"]
EXIT_PHRASES = [
    "exit", "quit", "goodbye", "good bye", "bye",
    "that's all", "thats all", "i'm done", "im done",
    "i'm good", "that's it", "thats it", "see you", "talk later"
]

r = sr.Recognizer()
r.pause_threshold = 3.0
r.dynamic_energy_threshold = False
whisper_model = whisper.load_model("base")

def speak(text):
    tts_engine = pyttsx3.init()
    tts_engine.setProperty('rate', 150)  # Set speech rate
    tts_engine.setProperty('volume', 1.0)  # Set volume level (0.0 to 1.0)
    tts_engine.say(text)
    tts_engine.runAndWait()
    tts_engine.stop()

####Summary of chat
def summary(messages):
    conversation_only = [m for m in messages if m["role"] != "system"]
    summary_prompt = [{"role": "user", "content": "Please create a document report of the conversation we just had. Include a summary of the main points discussed, any advice given, and any important information shared. Keep it a solid 200-300 words. Make it sound like a professional report."}, {"role": "user", "content": str(conversation_only)}]
    summary_response = model.invoke(summary_prompt)
    with open("Summary.txt", "w") as f:
        f.write(summary_response.content)
#make a while loop to keep the conversation going
while True:
    with sr.Microphone() as source:
        print("Adjusting for ambient noise...")
        r.adjust_for_ambient_noise(source,duration=1)#looking for background noise for 1 second to adjust the energy threshold
        print(f"Minimum energy threshold set to: {r.energy_threshold}")
        print("Listening...")
        audio = r.listen(source)#listens for user speech
   
    with open("output.wav", "wb") as f: #overwrite the output.wav file with the new audio data
        f.write(audio.get_wav_data())#writes the audio data to the output.wav file
    
    result = whisper_model.transcribe("output.wav")#transcribes the audio data in output.wav to text using the Whisper model
    person = result["text"].strip()
    if not person:
        print("No speech detected. Please try again.")
        continue

    if any(phrase in person.lower() for phrase in EXIT_PHRASES):
        print("Exiting the conversation. Take care!")
        summary(messages)
        break
        

        

    messages.append({"role": "user", "content": person})#Append the user's message to the messages list
    for keyword in CRISIS_KEYWORDS:
        crisis_detected = False
        if keyword in person.lower():
            crisis_detected = True
            break
    if crisis_detected:
        print("AI: I'm really concerned about your safety. It sounds like you're going through a tough time. Please consider reaching out to a trained professional or a crisis hotline for support. You can call or text 988 in the U.S. for immediate help.")
        continue

    response = model.invoke(messages)#response from the chatbot based on the conversation history in messages
    print("AI:", response.content)#prints the chatbot's response to the console
    speak(response.content)#speaks the chatbot's response

    messages.append({"role": "assistant", "content": response.content})#Append the Chatbot's response to the messages list

    with open("history.json", "w") as f:
        json.dump(messages, f, indent=2)#write to the history.json file with the updated messages list





    



