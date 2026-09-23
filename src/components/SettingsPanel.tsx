"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CogIcon } from "@heroicons/react/24/solid";
import { type VoiceSettings } from "./VoiceControls";

interface Props {
  settings: VoiceSettings;
  onSettingsChange: (settings: Partial<VoiceSettings>) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SettingsPanel({
  settings,
  onSettingsChange,
  isOpen = false,
  onClose,
}: Props) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const pitchRef = useRef<HTMLInputElement>(null);
  const voiceRef = useRef<HTMLSelectElement>(null);

  // Load available voices
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      if (synthRef.current) {
        const voiceList = synthRef.current.getVoices();
        setVoices(voiceList);
      }
    };

    // Initial load
    loadVoices();

    // Listen for voice list changes
    if (synthRef.current?.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current?.onvoiceschanged === loadVoices) {
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, []);

  // Initialize refs with current settings when they change
  useEffect(() => {
    if (rateRef.current) rateRef.current.value = settings.rate.toString();
    if (pitchRef.current) pitchRef.current.value = settings.pitch.toString();
    if (voiceRef.current) {
      voiceRef.current.value = settings.voiceURI;
    }
  }, [settings]);

  const handleVoiceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({ voiceURI: e.target.value });
  }, [onSettingsChange]);

  const handleRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onSettingsChange({ rate: value });
  }, [onSettingsChange]);

  const handlePitchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onSettingsChange({ pitch: value });
  }, [onSettingsChange]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onSettingsChange({ volume: value });
  }, [onSettingsChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
      <div className="relative w-full max-w-xl p-6 bg-white rounded-lg shadow-xl border border-gray-200 transform transition-transform duration-300 ease-out scale-100">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CogIcon className="w-5 h-5 text-indigo-600" />
            Voice Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Voice Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
            <select
              ref={voiceRef}
              value={settings.voiceURI}
              onChange={handleVoiceChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} {voice.lang ? `(${voice.lang})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Rate Slider */}
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Rate</span>
              <span>{settings.rate.toFixed(1)}x</span>
            </div>
            <input
              ref={rateRef}
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.rate}
              onChange={handleRateChange}
              className="w-full"
            />
          </div>

          {/* Pitch Slider */}
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Pitch</span>
              <span>{settings.pitch.toFixed(1)}</span>
            </div>
            <input
              ref={pitchRef}
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.pitch}
              onChange={handlePitchChange}
              className="w-full"
            />
          </div>

          {/* Volume Slider */}
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Volume</span>
              <span>{(settings.volume * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Test button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              // Trigger test by temporarily changing text
              const testText = "Hello! This is a test of the voice settings. If you can hear this, your voice settings are working properly.";

              // Test the voice synthesis using current settings
              const synth = window.speechSynthesis;
              if (!synth) {
                alert("Voice synthesis not supported in your browser.");
                return;
              }

              // Stop any current speech
              synth.cancel();

              const utterance = new SpeechSynthesisUtterance(testText);
              utterance.rate = settings.rate;
              utterance.pitch = settings.pitch;
              utterance.volume = settings.volume;

              // Find voice
              const voices = synth.getVoices();
              const voice = voices.find((v) => v.voiceURI === settings.voiceURI);
              if (voice) utterance.voice = voice;

              // Speak the test
              synth.speak(utterance);
            }}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Test Voice
          </button>
        </div>
      </div>
    </div>
  );
}