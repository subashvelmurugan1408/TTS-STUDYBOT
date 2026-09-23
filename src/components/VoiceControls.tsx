"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpeakerWaveIcon, SpeakerXMarkIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { cleanTextForSpeech, extractShortExplanation } from "../lib/cleanSpeech";

export interface VoiceSettings {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}

interface Props {
  text: string;
  spokenExplanation?: string;
  settings: VoiceSettings;
  className?: string;
}

export default function VoiceControls({
  text,
  spokenExplanation,
  settings,
  className = "",
}: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<"short" | "full">("short");
  const [showExplanationText, setShowExplanationText] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
  }, []);

  // Compute clean speech texts
  const shortSpeechText = useMemo(() => {
    return extractShortExplanation(text, spokenExplanation);
  }, [text, spokenExplanation]);

  const fullCleanSpeechText = useMemo(() => {
    return cleanTextForSpeech(text);
  }, [text]);

  const currentSpeechText = mode === "short" ? shortSpeechText : fullCleanSpeechText;

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setPaused(false);
      utteranceRef.current = null;
    }
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!synthRef.current || !textToSpeak.trim()) return;

      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      const voices = synthRef.current.getVoices();
      const voice = voices.find((v) => v.voiceURI === settings.voiceURI);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setPaused(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.error("TTS error:", e);
        setIsSpeaking(false);
        setPaused(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [settings, stopSpeaking]
  );

  const handlePlayToggle = useCallback(() => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      if (paused) {
        synthRef.current.resume();
        setPaused(false);
      } else {
        synthRef.current.pause();
        setPaused(true);
      }
      return;
    }

    speakText(currentSpeechText);
  }, [isSpeaking, paused, speakText, currentSpeechText]);

  const handleModeSwitch = (newMode: "short" | "full") => {
    if (newMode === mode) return;
    setMode(newMode);
    if (isSpeaking) {
      stopSpeaking();
      const nextText = newMode === "short" ? shortSpeechText : fullCleanSpeechText;
      setTimeout(() => speakText(nextText), 50);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Mode selector pills */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-medium text-gray-600">
          <button
            type="button"
            onClick={() => handleModeSwitch("short")}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mode === "short"
                ? "bg-white text-indigo-700 font-semibold shadow-sm"
                : "hover:text-gray-900"
            }`}
            title="Voice assistant analyzes the passage and explains it shortly without symbols"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
            Explain Shortly
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("full")}
            className={`px-2 py-1 rounded-md transition-all ${
              mode === "full"
                ? "bg-white text-indigo-700 font-semibold shadow-sm"
                : "hover:text-gray-900"
            }`}
            title="Read full cleaned response without special characters"
          >
            Full
          </button>
        </div>

        {/* Action Controls */}
        <div className="inline-flex items-center gap-1.5">
          {/* Waveform bars when speaking */}
          {isSpeaking && (
            <span className="flex items-end gap-0.5 h-4 mr-0.5" aria-hidden="true">
              <span className="waveform-bar w-1 bg-indigo-500 rounded-full inline-block" />
              <span className="waveform-bar w-1 bg-indigo-500 rounded-full inline-block" />
              <span className="waveform-bar w-1 bg-indigo-500 rounded-full inline-block" />
              <span className="waveform-bar w-1 bg-indigo-500 rounded-full inline-block" />
            </span>
          )}

          {/* Status Badge */}
          {isSpeaking && (
            <span className="text-[11px] text-indigo-600 font-medium">
              {paused
                ? "Paused"
                : mode === "short"
                ? "Explaining..."
                : "Reading..."}
            </span>
          )}

          {/* Play / Pause button */}
          <button
            type="button"
            onClick={handlePlayToggle}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label={isSpeaking ? (paused ? "Resume explanation" : "Pause explanation") : "Listen to explanation"}
            title={isSpeaking ? (paused ? "Resume" : "Pause") : mode === "short" ? "Listen to short explanation" : "Read full text"}
          >
            {isSpeaking && !paused ? (
              <>
                <SpeakerXMarkIcon className="w-4 h-4 text-indigo-600" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <SpeakerWaveIcon className="w-4 h-4 text-indigo-600" />
                <span>{paused ? "Resume" : "Listen"}</span>
              </>
            )}
          </button>

          {/* Stop button */}
          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="p-1 rounded-md hover:bg-red-100 transition-colors text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Stop audio"
              title="Stop"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          )}

          {/* Toggle speech preview text */}
          <button
            type="button"
            onClick={() => setShowExplanationText((prev) => !prev)}
            className="text-[11px] text-gray-400 hover:text-gray-600 px-1 py-0.5 rounded transition-colors"
            title="Show/hide spoken summary text"
          >
            {showExplanationText ? "Hide Summary" : "View Summary"}
          </button>
        </div>
      </div>

      {/* Spoken summary text preview */}
      {showExplanationText && (
        <div className="text-xs bg-indigo-50/60 border border-indigo-100/70 text-indigo-900 rounded-lg p-2.5 leading-relaxed transition-all">
          <div className="flex items-center gap-1 font-semibold text-[11px] text-indigo-700 mb-1">
            <SparklesIcon className="w-3 h-3 text-indigo-500" />
            <span>Short Voice Explanation (Spoken Script):</span>
          </div>
          <p className="italic text-gray-700">"{shortSpeechText}"</p>
        </div>
      )}
    </div>
  );
}