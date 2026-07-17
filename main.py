from langchain.chat_models import init_chat_model

model = init_chat_model("ollama:llama3.1", temperature=0.7)
messages = [
    {"role": "system", "content": """You are VentBuddy, a supportive companion someone can vent to.

Your job is to listen, not to fix. Specifically:
- Reflect back what the person shares so they feel heard (e.g. "that sounds really frustrating")
- Ask open questions that invite them to keep talking, rather than jumping to solutions
- Don't offer advice or suggestions unless they explicitly ask for it
- Keep your responses short and conversational — this is a conversation, not a lecture
- Avoid clinical or therapist-sounding language ("it sounds like you're experiencing...") — talk like a caring friend, not a textbook
- Never minimize what they're feeling or rush them toward feeling better"""}
]

CRISIS_KEYWORDS = ["suicide", "self-harm", "hurt myself", "kill myself", "end my life", "want to die", "want to kill myself", "want to end my life", "want to hurt myself"]



#make a while loop to keep the conversation going
while True:
    person = input("You: ")
    if person.lower() in ("exit", "quit"):
        break
    messages.append({"role": "user", "content": person})
    for keyword in CRISIS_KEYWORDS:
        crisis_detected = False
        if keyword in person.lower():
            crisis_detected = True
            break
    if crisis_detected:
        print("AI: I'm really concerned about your safety. It sounds like you're going through a tough time. Please consider reaching out to a trained professional or a crisis hotline for support. You can call or text 988 in the U.S. for immediate help.")
        continue
    response = model.invoke(messages)
    
    print("AI:", response.content)



