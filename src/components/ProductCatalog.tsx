"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import styles from './ProductCatalog.module.css';

type Product = {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  price?: number;
  stock: number;
  published: boolean;
  image?: string;
  tags?: string[];
};

export default function ProductCatalog() {
  const { addToCart, removeFromCart, getQuantity } = useCart();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/products')
      .then(r => r.json())
      .then((data) => { if (mounted) setProducts((data || []).filter((p: Product) => p.published)); })
      .catch(() => {});

    const es = new EventSource('/api/events');
    es.addEventListener('message', (ev: MessageEvent) => {
      try {
        const d = JSON.parse(ev.data);
        // if server sent heartbeat / hello
        if (d.hello || d.heartbeat) return;
      } catch (e) {}
    });

    es.addEventListener('product.changed', (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data);
        const { action, product } = payload as any;
        setProducts(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(p => p._id === product._id || p.slug === product.slug);
          if (action === 'create') {
            if (product.published) {
              if (idx === -1) copy.unshift(product);
              else copy[idx] = product;
            }
          } else if (action === 'update') {
            if (product.published) {
              if (idx === -1) copy.unshift(product);
              else copy[idx] = product;
            } else {
              if (idx !== -1) copy.splice(idx, 1);
            }
          } else if (action === 'delete') {
            if (idx !== -1) copy.splice(idx, 1);
          }
          return copy;
        });
      } catch (e) {}
    });

    return () => { mounted = false; es.close(); };
  }, []);

  return (
    <section>
      <h2 className={`text-center mb-6 sm:mb-8 ${styles.title}`}>Nuestros productos</h2>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
        {products.map(product => {
          const pid = String(product._id);
          const quantity = getQuantity(pid);
          const price = typeof product.price === 'number' ? product.price : 0;
          return (
            <div key={product._id} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
              <div className="relative w-full h-44 sm:h-56 mb-4 sm:mb-6 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl overflow-hidden">
                {product.image ? (() => {
                  if (!product.image.startsWith('/')) {
                    return (
                      <Image loading="lazy" src={product.image} alt={product.name} width={200} height={160} sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px" quality={75} className="object-contain h-28 sm:h-40 w-auto max-w-full" />
                    );
                  }
                  // If the image is under /uploads/ the app relies on next/image optimization
                  // and there are no pre-generated AVIF/WebP variants in public/uploads.
                  // Use <Image/> for /uploads/ to avoid browser 404s for -400.avif files.
                  if (product.image.startsWith('/uploads/')) {
                    return (
                      <Image loading="lazy" src={product.image} alt={product.name} width={200} height={160} sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px" quality={75} className="object-contain h-28 sm:h-40 w-auto max-w-full" />
                    );
                  }
                  // For local raster images (jpg/png) under /productos provide AVIF/WebP sources. For SVG or other vector formats render a plain <img>.
                  const isRaster = /\.(jpe?g|png)$/i.test(product.image);
                  if (isRaster) {
                    const base = product.image.replace(/\.(jpe?g|png)$/i, '');
                    return (
                      <picture>
                        <source type="image/avif" sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
                          srcSet={`${base}-400.avif 400w, ${base}-800.avif 800w, ${base}-1200.avif 1200w`} />
                        <source type="image/webp" sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
                          srcSet={`${base}-400.webp 400w, ${base}-800.webp 800w, ${base}-1200.webp 1200w`} />
                        <img loading="lazy" src={product.image} alt={product.name} width={200} height={160} className="object-contain h-28 sm:h-40 w-auto max-w-full" />
                      </picture>
                    );
                  }
                  // SVG or other local vector/image formats — render directly
                  return <img loading="lazy" src={product.image} alt={product.name} width={200} height={160} className="object-contain h-28 sm:h-40 w-auto max-w-full" />;
                })() : null}
                <div className="absolute top-2 left-2 space-y-1">
                  {product.stock > 0 ? (
                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-md font-bold shadow-md" style={{letterSpacing:0.5}}>
                      En stock
                    </div>
                  ) : (
                    <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-md font-bold shadow-md" style={{letterSpacing:0.5}}>
                      Sin stock
                    </div>
                  )}
                </div>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#4E260E] mb-1 leading-tight">{product.name}</h3>
              <p className="text-sm sm:text-sm text-gray-600 mb-3 min-h-[40px] sm:min-h-[48px]">{product.description}</p>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="font-bold text-lg sm:text-xl text-[#7B3F00]">S/ {price.toFixed(2)}</span>
                <div className="flex items-center gap-1">
                  {(product.tags || []).slice(0,2).map(tag => (
                    <span key={tag} className="bg-yellow-100 text-[#7B3F00] text-xs px-3 py-1 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                {quantity === 0 ? (
                  <button
                    onClick={() => { if (product.stock > 0) { const ok = addToCart(pid, 1); if (!ok) toast.push({ message: 'Stock insuficiente' }); } }}
                    className={`w-full bg-[#4E260E] hover:bg-[#6a331a] text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={product.stock === 0}
                  >
                    Agregar
                  </button>
                ) : (
                  <div className="flex items-center gap-3 sm:gap-4 w-full">
                    <button onClick={() => removeFromCart(pid)} className="w-9 sm:w-11 h-9 sm:h-11 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-sm">-</button>
                    <span className="flex-1 text-center font-bold text-base sm:text-lg text-[#7B3F00] bg-gray-100 py-2 rounded-lg">{quantity}</span>
                    <button onClick={() => { const ok = addToCart(pid, 1); if (!ok) toast.push({ message: 'Stock insuficiente' }); }} className="w-9 sm:w-11 h-9 sm:h-11 bg-[#4E260E] hover:bg-[#6a331a] text-white rounded-lg flex items-center justify-center transition-colors shadow-sm">+</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
