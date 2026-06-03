import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that connects to the SSE endpoint for a given business
 * and returns live queue state.
 */
export function useSSE(businessId) {
  const [queue, setQueue]         = useState([]);
  const [slotId, setSlotId]       = useState(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    if (!businessId) return;

    function connect() {
      const es = new EventSource(`/api/queue/live/${businessId}`);
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setSlotId(payload.slotId);
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
  }, [businessId]);

  return { queue, slotId, connected };
}
