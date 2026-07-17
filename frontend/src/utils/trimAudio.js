function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function interleave(buffer) {
  const numChannels = buffer.numberOfChannels
  if (numChannels === 1) return buffer.getChannelData(0)
  const length = buffer.length * numChannels
  const result = new Float32Array(length)
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch)
    for (let i = 0; i < buffer.length; i++) {
      result[i * numChannels + ch] = channelData[i]
    }
  }
  return result
}

function floatTo16BitPCM(view, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const bitDepth = 16
  const interleaved = interleave(buffer)
  const dataLength = interleaved.length * (bitDepth / 8)
  const arrayBuffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(arrayBuffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true)
  view.setUint16(32, numChannels * (bitDepth / 8), true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  floatTo16BitPCM(view, 44, interleaved)

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

// Decodes a recorded audio blob and cuts it down to [startTime, endTime] (seconds),
// returning a standalone WAV blob containing only that slice.
export async function trimAudioBlob(blob, startTime, endTime) {
  const arrayBuffer = await blob.arrayBuffer()
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  const audioCtx = new AudioCtx()
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    const sampleRate = audioBuffer.sampleRate
    const startSample = Math.max(0, Math.floor(startTime * sampleRate))
    const endSample = Math.min(
      audioBuffer.length,
      Math.floor(endTime * sampleRate),
    )
    const frameCount = Math.max(1, endSample - startSample)

    const trimmedBuffer = audioCtx.createBuffer(
      audioBuffer.numberOfChannels,
      frameCount,
      sampleRate,
    )
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      trimmedBuffer.copyToChannel(
        audioBuffer.getChannelData(ch).subarray(startSample, endSample),
        ch,
      )
    }

    return audioBufferToWav(trimmedBuffer)
  } finally {
    audioCtx.close()
  }
}
