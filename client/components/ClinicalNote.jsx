import { useState, useEffect, useRef } from "react";
import { getIdToken } from "../firebase";

export default function ClinicalNote({ events, setEvents }) {
  const [clinicalNote, setClinicalNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const lastProcessedDictation = useRef("");

  useEffect(() => {
    // Extract dictation text from events
    let dictationText = "";
    
    events.forEach((event) => {
      if (event.type === "response.done" && event.response?.output) {
        const responseText = event.response.output
          .filter(item => item.type === "message" && item.content)
          .map(item => 
            item.content
              .filter(content => content.type === "text")
              .map(content => content.text)
              .join(" ")
          )
          .join(" ");

        if (responseText) {
          dictationText += (dictationText ? "\n" : "") + responseText;
        }
      }
    });

    // Only process if we have new dictation text and it's different from what we last processed
    if (dictationText && dictationText !== lastProcessedDictation.current) {
      processDictation(dictationText);
      lastProcessedDictation.current = dictationText;
    }
  }, [events]);

  const processDictation = async (dictationText) => {
    if (!dictationText.trim()) return;
    
    setIsProcessing(true);
    setError("");
    
    // Add debug event for processing start
    if (setEvents) {
      const startEvent = {
        type: "clinical_note.processing_start",
        event_id: `clinical_note_start_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        processing: {
          dictationLength: dictationText.length,
          timestamp: new Date().toISOString()
        }
      };
      setEvents(prev => [...prev, startEvent]);
    }
    
    try {
      // Get authentication token
      const authToken = await getIdToken();
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch("/process-dictation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ dictationText }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const data = await response.json();
      setClinicalNote(data.clinicalNote);
      
      // Add debug event for successful processing
      if (setEvents) {
        const successEvent = {
          type: "clinical_note.success",
          event_id: `clinical_note_success_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          processing: {
            dictationLength: dictationText.length,
            clinicalNoteLength: data.clinicalNote.length,
            timestamp: new Date().toISOString()
          }
        };
        setEvents(prev => [...prev, successEvent]);
      }
    } catch (err) {
      console.error("Error processing dictation:", err);
      setError("Failed to process dictation into clinical note. Please try again.");
      
      // Add debug event for error tracking
      if (setEvents) {
        const errorEvent = {
          type: "clinical_note.error",
          event_id: `clinical_note_error_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          error: {
            message: err.message,
            stack: err.stack,
            dictationText: dictationText.substring(0, 200) + (dictationText.length > 200 ? "..." : ""), // Truncate for readability
            timestamp: new Date().toISOString()
          }
        };
        setEvents(prev => [...prev, errorEvent]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Clinical Note</h3>
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Processing...
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {clinicalNote === "" ? (
          <div className="text-gray-500 text-sm">
            {isProcessing ? "Processing dictation..." : "No clinical note yet..."}
          </div>
        ) : (
          <div className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{clinicalNote}</div>
        )}
      </div>
    </div>
  );
} 