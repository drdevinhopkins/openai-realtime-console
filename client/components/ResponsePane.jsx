import { useState, useEffect } from "react";

export default function ResponsePane({ events }) {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const newResponses = [];
    
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
          newResponses.push({
            id: event.event_id,
            response: responseText,
            timestamp: event.timestamp,
          });
        }
      }
    });

    setResponses(newResponses);
  }, [events]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Response</h3>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {responses.length === 0 ? (
          <div className="text-gray-500 text-sm">No responses yet...</div>
        ) : (
          responses.map((item) => (
            <div key={item.id} className="bg-blue-50 rounded-md p-3">
              <div className="text-xs text-gray-500 mb-1">{item.timestamp}</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">{item.response}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 