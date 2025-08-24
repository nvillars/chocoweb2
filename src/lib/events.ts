type Subscriber = (data: string) => void;

// use globalThis to be compatible with Edge/worker runtimes and turbopack
const g: any = globalThis as any;
if (!g.__sseSubscribers) g.__sseSubscribers = new Set<Subscriber>();

export function publish(event: { type: string; payload: any }) {
  // format as named event for EventSource: include 'event:' and 'data:' lines
  const msg = `event: ${event.type}\n` + `data: ${JSON.stringify(event.payload)}\n\n`;
  g.__sseSubscribers.forEach((fn: Subscriber) => fn(msg));
}

export function subscribe(fn: Subscriber) {
  g.__sseSubscribers.add(fn);
  return () => g.__sseSubscribers.delete(fn);
}

export function sendEventFormat(event: { type: string; payload: any }) {
  return `event: ${event.type}\n` + `data: ${JSON.stringify(event.payload)}\n\n`;
}
