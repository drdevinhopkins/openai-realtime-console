import { useState, useEffect } from "react";

export default function TranscriptionPane({ events }) {
  const [transcriptions, setTranscriptions] = useState([]);

  useEffect(() => {
    const newTranscriptions = [];
    
    events.forEach((event) => {
      if (event.type === "conversation.item.input_audio_transcription.completed" && event.transcript) {
        newTranscriptions.push({
          id: event.event_id,
          transcript: event.transcript,
          timestamp: event.timestamp,
        });
      }
    });

    setTranscriptions(newTranscriptions);
  }, [events]);

  return (
    <div className="space-y-3">
      {transcriptions.length === 0 ? (
        <div className="text-gray-500 text-sm">No transcriptions yet...</div>
      ) : (
        transcriptions.map((item) => (
          <div key={item.id} className="bg-gray-50 rounded-md p-3">
            <div className="text-xs text-gray-500 mb-1">{item.timestamp}</div>
            <div className="text-sm text-gray-800">{item.transcript}</div>
          </div>
        ))
      )}
    </div>
  );
} 