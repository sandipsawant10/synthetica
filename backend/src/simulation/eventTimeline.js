const MAX_TIMELINE_EVENTS = 5000;

let timelineEvents = [];

function recordTimelineEvent({ day = 0, type, message, details = {} }) {
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    day,
    type,
    message,
    details,
  };

  timelineEvents.push(event);

  if (timelineEvents.length > MAX_TIMELINE_EVENTS) {
    timelineEvents = timelineEvents.slice(
      timelineEvents.length - MAX_TIMELINE_EVENTS,
    );
  }

  return event;
}

function getTimelineEvents() {
  return timelineEvents;
}

function clearTimelineEvents() {
  timelineEvents = [];
}

export { recordTimelineEvent, getTimelineEvents, clearTimelineEvents };
