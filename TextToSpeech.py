import pyttsx3
tts_engine = pyttsx3.init()

voices = tts_engine.getProperty('voices')

for i,voice in enumerate(voices):
    print(i, voice.id, "-", voice.name)