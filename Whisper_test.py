import speech_recognition as sr
import whisper
import sounddevice as sd
import soundfile as sf

r = sr.Recognizer()
r.pause_threshold = 3.0
r.dynamic_energy_threshold = False

with sr.Microphone() as source:
    print("Adjusting for ambient noise...")
    r.adjust_for_ambient_noise(source,duration=1)
    print(f"Minimum energy threshold set to: {r.energy_threshold}")
    print("Listening...")
    audio = r.listen(source)


with open("output.wav", "wb") as f:
    f.write(audio.get_wav_data())

model = whisper.load_model("base")
result = model.transcribe("output.wav")

data, samplerate = sf.read("output.wav")
print("Playing back the recorded audio...")
sd.play(data, samplerate)
sd.wait()

print(result["text"])

