import sounddevice as sd
from scipy.io.wavfile import write
import whisper

sampleRate = 44100


duration = result["text"]

print("Recording...")
recording = sd.rec(int(duration * sampleRate), samplerate=sampleRate, channels=2)
sd.wait()
write("output.wav", sampleRate, recording)
print("Recording complete. Saved as output.wav")

model = whisper.load_model("base")
result = model.transcribe("output.wav")
print(result["text"])
