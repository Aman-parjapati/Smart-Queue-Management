import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that connects to the SSE endpoint for a given business
 * and returns live queue state, scoped optionally to a specific slot.
 */
export function useSSE(businessId, slotId = null) {
  const [queue, setQueue]         = useState([]);
  const [activeSlotId, setActiveSlotId] = useState(slotId);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    if (!businessId) return;

    function connect() {
      const url = `/api/queue/live/${businessId}` + (slotId ? `?slotId=${slotId}` : '');
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setActiveSlotId(payload.slotId);
          setQueue(payload.queue || []);
        } catch {/* ignore parse errors */}
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect after 3s
        setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      setConnected(false);
    };
  }, [businessId, slotId]);

  return { queue, slotId: activeSlotId, connected };
}
