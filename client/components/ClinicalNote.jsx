import { useState, useEffect } from "react";

export default function ClinicalNote({ events }) {
  const [clinicalNote, setClinicalNote] = useState("");

  useEffect(() => {
    // For now, this will be a placeholder that shows the AI dictation
    // Later, this will be processed through an LLM to generate the final clinical note
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

    // For now, just show the dictation as the clinical note
    // This will be replaced with LLM processing later
    setClinicalNote(dictationText);
  }, [events]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Clinical Note</h3>
      <div className="flex-1 overflow-y-auto">
        {clinicalNote === "" ? (
          <div className="text-gray-500 text-sm">No clinical note yet...</div>
        ) : (
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{clinicalNote}</div>
        )}
      </div>
    </div>
  );
} 