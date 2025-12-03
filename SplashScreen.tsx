import React, { useEffect } from 'react';
import { LayoutTemplate } from 'lucide-react';

interface SplashScreenProps {
  isExiting?: boolean;
  onAnimationEnd?: () => void;
}

/**
 * Plays a short, generated "pop" sound using the Web Audio API.
 * This avoids needing an external audio file.
 */
const playPopSound = () => {
  try {
    // Create an AudioContext for playing sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create an oscillator to generate the sound wave
    const oscillator = audioContext.createOscillator();
    
    // Create a gain node to control the volume and create the "pop" envelope
    const gainNode = audioContext.createGain();

    // Connect the audio graph: oscillator -> gain -> speakers
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure the sound properties for a short, subtle pop
    const now = audioContext.currentTime;
    oscillator.type = 'sine'; // A clean, simple waveform
    oscillator.frequency.setValueAtTime(200, now); // Starting pitch
    gainNode.gain.setValueAtTime(0.3, now); // Starting volume (not too loud)

    // Quickly ramp down the frequency and volume to create the "pop" effect
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    // Start the sound immediately and stop it after 0.1 seconds
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch (error) {
    // Log any errors but don't crash the app if audio playback fails
    console.error("Could not play splash screen sound:", error);
  }
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ isExiting, onAnimationEnd }) => {
  
  // Effect to play the sound once when the component is first displayed
  useEffect(() => {
    playPopSound();
  }, []); // The empty dependency array ensures this effect runs only once on mount

  return (
    <div 
      className={`fixed inset-0 bg-white flex flex-col items-center justify-center z-50 ${isExiting ? 'animate-splash-fade-out' : ''}`}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-2xl shadow-blue-500/40 animate-logo-bounce-in">
          <LayoutTemplate size={48} />
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 animate-in fade-in duration-500 delay-200">
          Agenda do Medidor
        </h1>
        <p className="text-gray-500 animate-in fade-in duration-500 delay-300">Aguarde um momento...</p>
      </div>
    </div>
  );
};