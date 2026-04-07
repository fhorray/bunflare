import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $router, $user, $cart, $adminUser, initAuth } from './client/store';
import { Home } from './client/pages/Home';
import { ProductDetail } from './client/pages/ProductDetail';
import { Cart } from './client/pages/Cart';
import { Admin } from './client/pages/Admin';
import { Login } from './client/pages/Login';
import { ShoppingCart, User, Package, LogIn, LayoutGrid, Cpu } from 'lucide-react';
import { Button } from './components/ui/button';
import { Toaster } from 'sonner';
import { EdgeLiveChat } from './components/ui/live-chat';

export default function App() {
  const page = useStore($router);
  const user = useStore($user);
  const admin = useStore($adminUser);
  const cart = useStore($cart);

  useEffect(() => {
    initAuth();
  }, []);

  if (!page) return null;

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-slate-900 font-sans selection:bg-blue-100">
      {/* Precision Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <a 
              href="/" 
              className="flex items-center gap-2 group"
              onClick={(e) => { e.preventDefault(); $router.open('/'); }}
            >
              <div className="bg-slate-900 p-2 group-hover:bg-blue-600 transition-colors">
                 <Cpu className="h-5 w-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase text-slate-900">
                BUN<span className="text-blue-600">FLARE</span>
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              <a href="/" className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" onClick={(e) => { e.preventDefault(); $router.open('/'); }}>Catalogo</a>
              <a href="/cart" className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors" onClick={(e) => { e.preventDefault(); $router.open('/cart'); }}>Orders</a>
              {admin && (
                <a href="/admin" className="text-[11px] font-bold uppercase tracking-widest text-blue-600 hover:text-slate-900 transition-colors" onClick={(e) => { e.preventDefault(); $router.open('/admin'); }}>Admin Console</a>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 border border-slate-200 px-4 py-2 bg-slate-50">
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-bold uppercase text-slate-900 leading-none">{user.name}</span>
                   <span className="text-[9px] font-bold uppercase text-slate-400 mt-1">{user.role}</span>
                </div>
                <div className="h-8 w-8 bg-slate-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="h-10 border-slate-200 text-slate-900 text-[10px] font-bold uppercase tracking-widest gap-2 rounded-none px-6 hover:bg-slate-900 hover:text-white"
                onClick={() => $router.open('/login')}
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}

            <button 
              className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors"
              onClick={() => $router.open('/cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center bg-blue-600 text-[9px] font-bold text-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        {page.route === 'home' && <Home />}
        {page.route === 'product' && <ProductDetail productId={page.params.id} />}
        {page.route === 'cart' && <Cart />}
        {page.route === 'admin' && <Admin />}
        {page.route === 'login' && <Login />}
      </main>

      <EdgeLiveChat />
      <Toaster position="top-right" richColors theme="light" />
    </div>
  );
}
