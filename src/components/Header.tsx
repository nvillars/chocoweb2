"use client";

import HeaderAuth from './HeaderAuth';
import Link from 'next/link';
import { useSSEStatus } from '../context/SSEStatusContext';
import { useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { status } = (() => {
    try { return useSSEStatus(); } catch (e) { return { status: 'connected' as const }; }
  })();
  const toast = (() => { try { return useToast(); } catch (e) { return null; } })();
  const prevRef = useRef<typeof status | null>(null);

  useEffect(() => {
    if (!toast) return;
    const prev = prevRef.current;
    if (status === 'connecting' && prev !== 'connecting') {
      toast.push({ message: 'Reconectando en tiempo real…' }, 3000);
    }
    if (status === 'disconnected' && prev !== 'disconnected') {
      toast.push({ message: 'Conexión en tiempo real perdida. Reintentando...' }, 5000);
    }
    prevRef.current = status;
  }, [status, toast]);
  return (
    <div className="bg-blue-600 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">🍫</div>
          <span className="font-semibold text-lg tracking-wide">ladulcerina</span>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-400' : status === 'connecting' ? 'bg-yellow-300' : 'bg-red-400'}`} title={`SSE: ${status}`} />
          </div>
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/productos" className="hover:underline">Browse</Link>
          {/* Show "Mis pedidos" only when there's a logged-in user */}
          {(() => {
            try {
              const a = useAuth();
              if (a && a.user) return <Link href="/mis-pedidos" className="hover:underline">Mis pedidos</Link>;
              return null;
            } catch (e) {
              return null;
            }
          })()}
          <HeaderAuth />
        </div>
      </div>
    </div>
  );
}
