import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "react-feather";
import logo from "/assets/appIcon.png";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import TranscriptionPane from "./TranscriptionPane";
import ResponsePane from "./ResponsePane";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [isMicrophoneMuted, setIsMicrophoneMuted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const audioTrack = useRef(null);

  async function startSession() {
    // Get a session token for OpenAI Realtime API
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    audioTrack.current = ms.getTracks()[0];
    pc.addTrack(audioTrack.current);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-mini-realtime-preview";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Toggle microphone mute state
  function toggleMicrophone() {
    if (audioTrack.current) {
      audioTrack.current.enabled = !audioTrack.current.enabled;
      setIsMicrophoneMuted(!audioTrack.current.enabled);
    }
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    setIsMicrophoneMuted(false);
    peerConnection.current = null;
    audioTrack.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }

        setEvents((prev) => [event, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
        
        // Configure session for transcription-only mode
        const sessionUpdateEvent = {
          type: 'session.update',
          session: {
            modalities: ['text'],
            instructions: `You are a highly accurate and reliable AI medical scribe tasked with transcribing a healthcare provider's dictation.
            Your top priority is fidelity to the transcription — you must only include information explicitly stated by the patient or provider. Do not infer, assume, or generate any additional details.
            Make corrections to the following transcript for grammar & punctuation and make minor edits for a formal, professional tone. 
            Remove filler words and phrases.
            Use the names of people, places and institutions related to the Jewish General Hospital in Montreal, Quebec, Canada. Use medication names and medical terminology in a Canadian context.`,
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'gpt-4o-mini-transcribe', // Lower latency, cost-effective model
              language: 'en', // English language for consistent transcription
            },
          },
        };
        
        sendClientEvent(sessionUpdateEvent);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>SCRIBBL<i style={{ color: '#b04a4a' }}>ER</i> live</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className={`absolute top-0 left-0 bottom-0 flex transition-all duration-300 ${isSidebarOpen ? 'right-[380px]' : 'right-0'}`}>
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 flex flex-col">
            <div className="flex-shrink-0 mb-4">
              <TranscriptionPane events={events} />
            </div>
            <div className="flex-1 min-h-0">
              <ResponsePane events={events} />
            </div>
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
              isMicrophoneMuted={isMicrophoneMuted}
              toggleMicrophone={toggleMicrophone}
            />
          </section>
        </section>
        
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 right-4 z-10 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-all duration-300 ${isSidebarOpen ? 'right-[384px]' : 'right-4'}`}
        >
          <ChevronRight className={`text-gray-600 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} size={20} />
        </button>
        
        <section className={`absolute top-0 right-0 bottom-0 p-4 pt-0 overflow-y-auto bg-white border-l border-gray-200 transition-all duration-300 ${isSidebarOpen ? 'w-[380px] translate-x-0' : 'w-[380px] translate-x-full'}`}>
          <EventLog events={events} />
        </section>
      </main>
    </>
  );
}
