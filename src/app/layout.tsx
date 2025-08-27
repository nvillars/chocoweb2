import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { SSEProvider } from "../context/SSEStatusContext";
import ToastContainer from "../components/ToastContainer";
import Header from '../components/Header';
import Footer from '../components/Footer';


export const metadata: Metadata = {
  title: "La Dulcerina - Tienda de Chocolates",
  description: "La mejor tienda virtual de chocolates de cacao",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  title: "La Dulcerina"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
  themeColor: "#7B3F00"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Preconnect to required origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />

    {/* Non-blocking Google Fonts load - use preload links and convert to stylesheet at runtime via a small inline script
      (avoids passing event handlers in server components). */}
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" as="style" data-nonblocking-font />
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap" as="style" data-nonblocking-font />

        {/* Load Font Awesome non-blocking: preload + noscript fallback. We convert preload->stylesheet for fonts and FA via inline script below. */}
        <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" as="style" integrity="sha512-yH8f..." crossOrigin="anonymous" referrerPolicy="no-referrer" data-nonblocking-font />
        <noscript>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" integrity="sha512-yH8f..." crossOrigin="anonymous" referrerPolicy="no-referrer" />
        </noscript>

        {/* Inline script to convert preload style links with `data-nonblocking-font` into actual stylesheet links.
            Using a script avoids attaching event handlers in JSX and prevents the runtime serialization error. */}
        <script dangerouslySetInnerHTML={{ __html: `(()=>{
          try{
            var links = document.querySelectorAll('link[rel="preload"][as="style"][data-nonblocking-font]');
            links.forEach(function(l){
              try{
                var href = l.getAttribute('href');
                if(!href) return;
                var s = document.createElement('link');
                s.rel = 'stylesheet';
                s.href = href;
                s.crossOrigin = l.getAttribute('crossorigin') || undefined;
                s.integrity = l.getAttribute('integrity') || undefined;
                s.referrerPolicy = l.getAttribute('referrerpolicy') || undefined;
                document.head.appendChild(s);
                // remove the preload link to keep DOM clean
                l.parentNode && l.parentNode.removeChild(l);
              }catch(e){}
            });
          }catch(e){}
        })();` }} />

        <link rel="preload" as="image" href="/assets/hero-poster.jpg" />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <SSEProvider>
              <ToastProvider>
                <Header />
                <div className="site-header-spacer" aria-hidden />
                {children}
                <ToastContainer />
                <Footer />
              </ToastProvider>
            </SSEProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
