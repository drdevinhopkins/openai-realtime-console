import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";

function Event({ event, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isClient = event.event_id && !event.event_id.startsWith("event_");
  const isClinicalNoteEvent = event.type && event.type.startsWith("clinical_note.");

  // Determine event styling based on type
  let eventStyle = "bg-gray-50";
  let iconColor = "text-gray-400";
  
  if (isClinicalNoteEvent) {
    if (event.type === "clinical_note.error") {
      eventStyle = "bg-red-50 border border-red-200";
      iconColor = "text-red-500";
    } else if (event.type === "clinical_note.success") {
      eventStyle = "bg-green-50 border border-green-200";
      iconColor = "text-green-500";
    } else if (event.type === "clinical_note.processing_start") {
      eventStyle = "bg-blue-50 border border-blue-200";
      iconColor = "text-blue-500";
    }
  } else if (isClient) {
    iconColor = "text-blue-400";
  } else {
    iconColor = "text-green-400";
  }

  return (
    <div className={`flex flex-col gap-2 p-2 rounded-md ${eventStyle}`}>
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isClient ? (
          <ArrowDown className={iconColor} />
        ) : (
          <ArrowUp className={iconColor} />
        )}
        <div className="text-sm text-gray-500">
          {isClient ? "client:" : "server:"}
          &nbsp;{event.type} | {timestamp}
        </div>
      </div>
      <div
        className={`text-gray-500 bg-gray-200 p-2 rounded-md overflow-x-auto ${
          isExpanded ? "block" : "hidden"
        }`}
      >
        <pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>
      </div>
    </div>
  );
}

export default function EventLog({ events }) {
  const eventsToDisplay = [];
  let deltaEvents = {};

  events.forEach((event) => {
    if (event.type.endsWith("delta")) {
      if (deltaEvents[event.type]) {
        // for now just log a single event per render pass
        return;
      } else {
        deltaEvents[event.type] = event;
      }
    }

    eventsToDisplay.push(
      <Event key={event.event_id} event={event} timestamp={event.timestamp} />,
    );
  });

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      {events.length === 0 ? (
        <div className="text-gray-500">Awaiting events...</div>
      ) : (
        eventsToDisplay
      )}
    </div>
  );
}
