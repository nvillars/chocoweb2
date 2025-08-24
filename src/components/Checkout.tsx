
"use client";

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Image from 'next/image';
export default function Checkout() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    metodoPago: 'tarjeta'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const subtotal = 62.00;
  const envio = 8.00;
  const total = subtotal + envio;
  const { placeOrder, getCartItems, setQuantity } = useCart();
  const toast = useToast();

  const [outOfStockInfo, setOutOfStockInfo] = useState<{ productId: string; available: number }[] | null>(null);


  const handleConfirm = async () => {
    try {
      await placeOrder(null);
      toast.push({ message: 'Pedido creado con éxito' });
    } catch (err: unknown) {
      // handle structured OUT_OF_STOCK error
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error === 'OUT_OF_STOCK') {
            setOutOfStockInfo([{ productId: parsed.productId, available: parsed.available }]);
            return;
          }
        } catch (e) {}
      }
      const msg = err instanceof Error ? err.message : 'Error al crear pedido';
      toast.push({ message: msg });
    }
  };

  const handleAdjust = () => {
    if (!outOfStockInfo) return;
    for (const it of outOfStockInfo) {
      setQuantity(it.productId, it.available);
    }
    setOutOfStockInfo(null);
    toast.push({ message: 'Carrito ajustado según stock disponible' });
  };

  return (
    <>
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de Datos */}
  <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#7B3F00] flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            Información Personal
          </h2>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4E260E] mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B3F00] focus:border-transparent transition-colors"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4E260E] mb-1">Correo Electrónico *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B3F00] focus:border-transparent transition-colors"
                  placeholder="juan@ejemplo.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4E260E] mb-1">Teléfono *</label>
              <input 
                type="tel" 
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E260E] focus:border-transparent transition-colors"
                placeholder="+51 999 999 999"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4E260E] mb-1">Dirección de Entrega *</label>
              <input 
                type="text" 
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B3F00] focus:border-transparent transition-colors"
                placeholder="Av. Principal 123, Distrito"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4E260E] mb-1">Ciudad *</label>
                <input 
                  type="text" 
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B3F00] focus:border-transparent transition-colors"
                  placeholder="Lima"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4E260E] mb-1">Código Postal</label>
                <input 
                  type="text" 
                  name="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B3F00] focus:border-transparent transition-colors"
                  placeholder="15001"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Resumen de Compra */}
  <div className="space-y-6">
          {/* Método de Pago */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-[#7B3F00] flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
              Método de Pago
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="metodoPago" 
                  value="tarjeta"
                  checked={formData.metodoPago === 'tarjeta'}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#7B3F00]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                  <span className="font-medium">Tarjeta de Crédito/Débito</span>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="metodoPago" 
                  value="transferencia"
                  checked={formData.metodoPago === 'transferencia'}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#7B3F00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Transferencia Bancaria</span>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="metodoPago" 
                  value="efectivo"
                  checked={formData.metodoPago === 'efectivo'}
                  onChange={handleInputChange}
                  className="mr-3"
                />
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#7B3F00]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Pago en Efectivo</span>
                </div>
              </label>
            </div>
          </div>

          {/* Resumen de Productos */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-[#7B3F00] flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              Resumen de Compra
            </h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <Image src="/productos/chocolate-70.svg" alt="Chocolate 70%" width={48} height={48} className="object-contain bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg p-1" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-[#4E260E]">Chocolate 70% Cacao</p>
                  <p className="text-xs text-gray-500">Cantidad: 1</p>
                </div>
                <span className="font-bold text-[#7B3F00]">S/ 18.00</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Image src="/productos/chocolate-almendras.svg" alt="Chocolate Almendras" width={48} height={48} className="object-contain bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg p-1" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-[#4E260E]">Chocolate con Almendras</p>
                  <p className="text-xs text-gray-500">Cantidad: 2</p>
                </div>
                <span className="font-bold text-[#7B3F00]">S/ 44.00</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-[#7B3F00]">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="font-semibold text-[#7B3F00]">S/ {envio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span className="text-[#4E260E]">Total</span>
                <span className="text-[#7B3F00]">S/ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botón de Pago */}
          <button onClick={handleConfirm} className="w-full bg-gradient-to-r from-[#4E260E] to-[#A0522D] hover:from-[#A0522D] hover:to-[#4E260E] text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-[1.02]">
            Confirmar Pedido - S/ {total.toFixed(2)}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Al confirmar tu pedido, aceptas nuestros términos y condiciones de compra
          </p>
        </div>
      </div>
    </div>
    {outOfStockInfo && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <h3 className="text-lg font-bold mb-4">Stock insuficiente</h3>
          <p className="mb-3">Algunos productos ya no tienen la cantidad solicitada. Ajustar carrito automáticamente según lo disponible?</p>
          <div className="space-y-2 mb-4">
            {outOfStockInfo.map(it => (
              <div key={it.productId} className="flex justify-between">
                <div>Producto {it.productId}</div>
                <div className="font-medium">Disponible: {it.available}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setOutOfStockInfo(null)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button onClick={handleAdjust} className="px-4 py-2 bg-[#4E260E] text-white rounded">Ajustar carrito</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
