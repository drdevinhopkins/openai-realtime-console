import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "react-feather";

export default function TranscriptionPane({ events }) {
  const [transcriptions, setTranscriptions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="bg-white rounded-lg border border-gray-200">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-800">Transcription</h3>
        {isExpanded ? (
          <ChevronDown className="text-gray-500" size={20} />
        ) : (
          <ChevronUp className="text-gray-500" size={20} />
        )}
      </div>
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
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
        </div>
      )}
    </div>
  );
} 