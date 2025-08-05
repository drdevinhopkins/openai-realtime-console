import { useState, useEffect } from "react";

export default function ResponsePane({ events }) {
  const [dictationText, setDictationText] = useState("");

  useEffect(() => {
    let newDictationText = "";
    
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
          // Append new response with a new line
          newDictationText += (newDictationText ? "\n" : "") + responseText;
        }
      }
    });

    setDictationText(newDictationText);
  }, [events]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Dictation</h3>
      <div className="flex-1 overflow-y-auto">
        {dictationText === "" ? (
          <div className="text-gray-500 text-sm">No dictation yet...</div>
        ) : (
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{dictationText}</div>
        )}
      </div>
    </div>
  );
} 