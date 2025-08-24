"use client";

import { useEffect, useRef } from 'react';
import { useSSEStatus } from '../context/SSEStatusContext';

type Handler = (ev: MessageEvent) => void;

export function useEventSource(path: string, eventName: string, handler: Handler) {
  const esRef = useRef<EventSource | null>(null);
  const handlerRef = useRef<Handler>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let closed = false;
    let retry = 0;
    let setStatus: ((s: any) => void) | null = null;
    try {
      const ctx = useSSEStatus();
      setStatus = ctx.setStatus;
    } catch (e) {
      // no provider, ignore
      setStatus = null;
    }

    const connect = () => {
      if (closed) return;
      if (setStatus) setStatus('connecting');
      try {
        const es = new EventSource(path);
        esRef.current = es;
        const fn = (ev: MessageEvent) => handlerRef.current(ev);
        es.addEventListener(eventName, fn as EventListener);
        es.onopen = () => { retry = 0; if (setStatus) setStatus('connected'); };
        es.onerror = () => {
          // close current and attempt reconnect with backoff
          try { es.close(); } catch (e) {}
          esRef.current = null;
          if (setStatus) setStatus('disconnected');
          retry++;
          const wait = Math.min(30000, 500 * Math.pow(2, retry));
          setTimeout(() => { if (!closed) connect(); }, wait);
        };
      } catch (e) {
        if (setStatus) setStatus('disconnected');
        retry++;
        const wait = Math.min(30000, 500 * Math.pow(2, retry));
        setTimeout(() => { if (!closed) connect(); }, wait);
      }
    };

    connect();

    return () => {
      closed = true;
      try { esRef.current?.close(); } catch (e) {}
      esRef.current = null;
    };
  }, [path, eventName]);
}

export default useEventSource;
