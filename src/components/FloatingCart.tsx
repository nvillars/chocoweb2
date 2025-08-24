"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import QuantitySelector from './QuantitySelector';

export default function FloatingCart() {
  const [isOpen, setIsOpen] = useState(false);
  const { addToCart, removeFromCart, getTotalItems, getTotalPrice, getCartItems, setQuantity } = useCart();
  const toast = useToast();

  const cartItemsList = getCartItems();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Botón flotante del carrito */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#4E260E] hover:bg-[#6a331a] text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          {totalItems > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* overlay */}
          <div
            className="absolute inset-0 transition-opacity cursor-pointer"
            onClick={handleBackdropClick}
            aria-label="Cerrar carrito"
            style={{ zIndex: 51, backgroundColor: 'rgba(0,0,0,0.65)' }}
          />

          {/* Sidebar del carrito */}
          <aside
            className="relative h-full bg-white shadow-2xl flex flex-col pointer-events-auto z-60 border-l border-gray-200"
            style={{ width: '520px', maxWidth: '100vw', borderTopLeftRadius: '18px', borderBottomLeftRadius: '18px' }}
          >
            <header className="bg-[#4E260E] text-white p-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                Tu Carrito ({totalItems})
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </header>

            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-600">Dónde quieres pedir?</span>
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItemsList.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  <p className="text-gray-500">Tu carrito está vacío</p>
                  <p className="text-sm text-gray-400 mt-1">Agrega algunos chocolates deliciosos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItemsList.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 relative">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill style={{ objectFit: 'contain' }} />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-md" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-[#4E260E] truncate">{item.name}</h4>
                        <p className="text-sm text-gray-600">S/ {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-sm"
                          style={{ minWidth: '1.5rem', minHeight: '1.5rem' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <QuantitySelector value={item.quantity} max={item.stock ?? 999} onChange={(q) => setQuantity(item.id, q)} small />
                      </div>
                      <button className="text-[#7B3F00] text-xs font-medium hover:underline">Editar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItemsList.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-[#7B3F00]">S/ {totalPrice.toFixed(2)}</span>
                </div>

                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#4E260E] py-3 rounded-lg font-semibold transition-colors text-sm">
                  Ingresa tu dirección o selecciona un local para continuar
                </button>
                <button className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition-colors text-sm">
                  Continuar
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
