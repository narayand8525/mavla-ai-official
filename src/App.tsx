/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Constants ---
const IMAGE_URL = "https://i.ibb.co/mrrsKxGF/Gemini-Generated-Image-yqvvreyqvvreyqvv-1.png";
const LISTENING_VIDEO_URL = "/listening.mp4"; 
const TALKING_VIDEO_URL = "/talking.mp4";

// --- System Instruction ---
const SYSTEM_INSTRUCTION = `
तू "सक्षम AI मावळा" आहेस.
तू मराठीत बोलणारा, पुरुष आवाजाचा मावळा आहेस.
नेहमी "जय शिवराय!" ने सुरुवात कर.
सोपी, स्पष्ट मराठी वापर.
सुरुवातीचा परिचय: "जय शिवराय! ही अॅप नारायण दाभाडकर यांनी, सक्षम कॉम्प्युटर्स साठी तयार केली आहे. मी आहे सक्षम AI मावळा."
`;

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mediaMode, setMediaMode] = useState<'IMAGE' | 'LISTENING' | 'TALKING'>('IMAGE');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setMediaMode('IMAGE');
  }, []);

  const connect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      // थेट API Key टाकली आहे जेणेकरून 'Key not found' एरर येणार नाही
      const ai = new GoogleGenAI("AIzaSyBNyXtg-aoJJPZqNvKqtjNRGr1YUyl-aDU");
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const session = await (ai as any).live.connect({
        model: "gemini-2.0-flash-exp",
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
          onmessage: (message: any) => {
            if (message.serverContent?.modelTurn) {
              setMediaMode('TALKING');
            } else if (message.serverContent?.interrupted) {
              setMediaMode('LISTENING');
            }
          },
          onclose: () => disconnect(),
          onerror: (e: any) => {
            console.error("Connection Error:", e);
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
    <div style={{ height: '100vh', backgroundColor: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0, overflow: 'hidden' }}>
      
      <div 
        onClick={isConnected ? disconnect : connect}
        style={{ position: 'relative', width: '100%', maxWidth: '450px', height: '100%', cursor: 'pointer', backgroundColor: '#1c1917' }}
      >
        {/* IMAGE STATE */}
        {mediaMode === 'IMAGE' && (
          <img src={IMAGE_URL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Mavla" />
        )}

        {/* LISTENING STATE */}
        {mediaMode === 'LISTENING' && (
          <video 
            src={LISTENING_VIDEO_URL} 
            autoPlay loop muted playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        )}

        {/* TALKING STATE */}
        {mediaMode === 'TALKING' && (
          <video 
            src={TALKING_VIDEO_URL} 
            autoPlay loop muted playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        )}

        {/* LOADING STATE */}
        {isConnecting && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <Loader2 style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} size={60} />
          </div>
        )}

        {/* UI FEEDBACK */}
        <div style={{ position: 'absolute', bottom: '50px', width: '100%', textAlign: 'center', zIndex: 20 }}>
          <p style={{ 
            color: 'white', 
            backgroundColor: isConnected ? '#15803d' : '#ea580c', 
            padding: '12px 24px', 
            borderRadius: '30px', 
            display: 'inline-block', 
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            fontSize: '18px'
          }}>
            {isConnected ? "मी ऐकत आहे... बोला" : "मावळ्याशी बोलण्यासाठी क्लिक करा"}
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ position: 'fixed', bottom: '10px', opacity: 0.3, color: 'white', fontSize: '10px', letterSpacing: '2px' }}>
        SAKSHAM COMPUTERS • NARAYAN DABHADEKAR
      </div>
    </div>
  );
}
