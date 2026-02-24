import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Loader2 } from 'lucide-react';

// --- Constants ---
const IMAGE_URL = "https://i.ibb.co/mrrsKxGF/Gemini-Generated-Image-yqvvreyqvvreyqvv-1.png";
const LISTENING_VIDEO_URL = "/listening.mp4"; 
const TALKING_VIDEO_URL = "/talking.mp4";

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mediaMode, setMediaMode] = useState<'IMAGE' | 'LISTENING' | 'TALKING'>('IMAGE');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const disconnect = useCallback(() => {
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsConnected(false);
    setIsConnecting(false);
    setMediaMode('IMAGE');
  }, []);

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      // VITE_GEMINI_API_KEY vapra (Vercel settings madhye pan hesh naav pahije)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("API Key sapdli nahi! Vercel settings check kara.");
        setIsConnecting(false);
        return;
      }

      const ai = new GoogleGenAI(apiKey);
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const session = await (ai as any).live.connect({
        model: "gemini-2.0-flash-exp",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "तू सक्षम AI मावळा आहेस. जय शिवराय ने सुरुवात कर.",
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            setMediaMode('LISTENING');
          },
          onmessage: (message: any) => {
            if (message.serverContent?.modelTurn) setMediaMode('TALKING');
          },
          onclose: () => disconnect(),
          onerror: (e: any) => { console.error(e); disconnect(); }
        }
      });
      sessionRef.current = session;
    } catch (error) {
      console.error(error);
      disconnect();
    }
  };

  return (
    <div style={{ height: '100vh', backgroundColor: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        onClick={isConnected ? disconnect : connect}
        style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '100%', cursor: 'pointer', overflow: 'hidden' }}
      >
        {mediaMode === 'IMAGE' && <img src={IMAGE_URL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        
        {mediaMode === 'LISTENING' && (
          <video src={LISTENING_VIDEO_URL} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {mediaMode === 'TALKING' && (
          <video src={TALKING_VIDEO_URL} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {isConnecting && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ color: 'orange', animation: 'spin 1s linear infinite' }} size={48} />
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '40px', width: '100%', textAlign: 'center' }}>
          <p style={{ color: 'white', backgroundColor: 'orange', padding: '10px 20px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold' }}>
            {isConnected ? "ऐकत आहे... बोला" : "बोलण्यासाठी मावळ्यावर क्लिक करा"}
          </p>
        </div>
      </div>
    </div>
  );
}
