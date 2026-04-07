import { useStore } from '@nanostores/react';
import { $router } from './stores';
import { HomePage } from './pages/Home';
import { CheckoutPage } from './pages/Checkout';

export function App() {
  const page = useStore($router);

  if (!page) return <div>404</div>;

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <a href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Bunflare Commerce</span>
            </a>
            <nav className="flex gap-6">
              <a href="/products" className="flex items-center text-sm font-medium text-muted-foreground">Products</a>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              <a href="/checkout" className="text-sm font-medium">Cart</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="container py-8">
        {page.route === 'home' && <HomePage />}
        {page.route === 'products' && <HomePage />}
        {page.route === 'checkout' && <CheckoutPage />}
      </main>
    </div>
  );
}