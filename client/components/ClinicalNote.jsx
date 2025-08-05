import { useState, useEffect, useRef } from "react";

export default function ClinicalNote({ events }) {
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
    
    try {
      const response = await fetch("/process-dictation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dictationText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setClinicalNote(data.clinicalNote);
    } catch (err) {
      console.error("Error processing dictation:", err);
      setError("Failed to process dictation into clinical note. Please try again.");
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