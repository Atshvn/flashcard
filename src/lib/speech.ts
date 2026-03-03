/**
 * Web Speech API wrapper for text-to-speech
 * Uses SpeechSynthesis to pronounce English words
 */

export function speak(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    lang?: string;
  }
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("Speech synthesis not supported in this browser");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options?.lang || "en-US";
  utterance.rate = options?.rate || 1;
  utterance.pitch = options?.pitch || 1;

  // Try to find a US English voice
  const voices = window.speechSynthesis.getVoices();
  const usVoice = voices.find(
    (v) => v.lang === "en-US" && v.localService
  );
  if (usVoice) {
    utterance.voice = usVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
