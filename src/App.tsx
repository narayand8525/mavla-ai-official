/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind merge utility
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const IMAGE_URL = "https://i.ibb.co/mrrsKxGF/Gemini-Generated-Image-yqvvreyqvvreyqvv-1.png";
const LISTENING_VIDEO_URL = "/listening.mp4"; 
const TALKING_VIDEO_URL = "/talking.mp4";

const SYSTEM_INSTRUCTION = `
तू "सक्षम AI मावळा" आहेस.
तू मराठीत बोलणारा, पुरुष आवाजाचा मावळा आहेस.
नेहमी "जय शिवराय!" ने सुरुवात कर.
सोपी, स्पष्ट मराठी वापर.
सुरुवातीचा परिचय: "जय शिवराय! ही अॅप नारायण दाभाडकर यांनी, सक्षम कॉम्प्युटर्स साठी तयार केली आहे. मी आहे सक्षम AI मावळा."
तुझे काम शिवाजी महाराजांची माहिती देणे आणि प्रश्नमंजूषा घेणे आहे.
`;

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mediaMode, setMediaMode] = useState<'IMAGE' | 'LISTENING' | 'TALKING'>('IMAGE');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const nextStartTimeRef = useRef<number>(0);

  // Audio utility to handle base64 from Gemini
  const base64ToUint8Array = (base64: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) return;

    setMediaMode('TALKING');
    const pcmData = audioQueueRef.current.shift()!;
    const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768.0;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    source.onended = () => {
      if (audioQueueRef.current.length === 0) {
        setMediaMode('LISTENING');
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsConnected(false);
    setIsConnecting(false);
    setMediaMode('IMAGE');
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
  }, []);

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      // Direct API Key - Browser Error avoid karnyasathi
      const apiKey = "AIzaSyBNyXtg-aoJJPZqNvKqtjNRGr1YUyl-aDU";
const genAI = new GoogleGenAI({ apiKey: "AIzaSyBNyXtg-aoJJPZqNvKqtjNRGr1YUyl-aDU" });      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connection with direct model name
      const session = await (genAI as any).live.connect({
  model: "gemini-2.5-flash", 
        config: {
    responseModalities: [Modality.AUDIO],
    systemInstruction: SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            setMediaMode('LISTENING');
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.modelTurn) {
              const parts = message.serverContent.modelTurn.parts;
              for (const part of parts) {
                if (part.inlineData) {
                  const bytes = base64ToUint8Array(part.inlineData.data);
                  audioQueueRef.current.push(new Int16Array(bytes.buffer));
                  playNextInQueue();
                }
              }
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              nextStartTimeRef.current = 0;
              setMediaMode('LISTENING');
            }
          },
          onclose: () => disconnect(),
          onerror: (e: any) => {
            console.error("API Error:", e);
            disconnect();
          }
        }
      });
      sessionRef.current = session;
    } catch (error) {
      console.error("Connection error:", error);
      disconnect();
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-0 m-0 overflow-hidden">
      <div 
        onClick={isConnected ? disconnect : connect}
        className={cn(
          "relative w-full max-w-md h-full bg-stone-900 overflow-hidden shadow-2xl cursor-pointer transition-all",
          isConnected && "ring-inset ring-4 ring-orange-600/20"
        )}
      >
        {/* Media Rendering */}
        <div className="absolute inset-0">
          {mediaMode === 'IMAGE' && (
            <img src={IMAGE_URL} className="w-full h-full object-cover" alt="Mavla" />
          )}
          {mediaMode === 'LISTENING' && (
            <video src={LISTENING_VIDEO_URL} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          )}
          {mediaMode === 'TALKING' && (
            <video src={TALKING_VIDEO_URL} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          )}
        </div>

        {/* Loading Spinner */}
        {isConnecting && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Status Button */}
        <div className="absolute bottom-12 w-full text-center z-30">
           <span className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold shadow-2xl text-lg animate-pulse">
             {isConnected ? "मी ऐकत आहे... बोला" : "मावळ्याशी बोलण्यासाठी क्लिक करा"}
           </span>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-2 text-[10px] text-stone-500 uppercase tracking-widest opacity-50">
        Saksham Computers • Narayan Dabhadekar
      </div>
    </div>
  );
}
