import { useEffect, useRef, useState } from 'react';
import type { ValidationReport } from '../types';

export function useConstraintWS(configId: string | null): ValidationReport | null {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!configId) {
      setReport(null);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/constraints/${configId}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ValidationReport;
        setReport(data);
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => { /* silent */ };

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [configId]);

  // Expose refresh trigger
  const refresh = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('refresh');
    }
  };

  // Attach refresh to the hook's return won't work cleanly, so expose via ref on window for now
  // Better approach: return [report, refresh] but keeping simple for MVP
  (window as any).__constraintRefresh = refresh;

  return report;
}
