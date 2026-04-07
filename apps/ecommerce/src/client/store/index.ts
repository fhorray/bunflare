import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { createRouter } from '@nanostores/router';

// --- Cart Store ---
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export const $cart = persistentAtom<CartItem[]>('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const addToCart = (product: Omit<CartItem, 'quantity'>) => {
  const current = $cart.get();
  const existing = current.find(i => i.id === product.id);
  if (existing) {
    $cart.set(current.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
  } else {
    $cart.set([...current, { ...product, quantity: 1 }]);
  }
};

export const removeFromCart = (id: string) => {
  $cart.set($cart.get().filter(i => i.id !== id));
};

export const $cartTotal = computed($cart, items => 
  items.reduce((acc, item) => acc + item.price * item.quantity, 0)
);

// --- User Store ---
export const $user = atom<{ id: string, name: string, role: string } | null>(null);

// --- Admin Store ---
export const $adminUser = atom<{ name: string, role: string } | null>(null);

export const initAuth = async () => {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = (await res.json()) as { 
        loggedIn: boolean; 
        user: { id: string; name: string; role: string } 
      };
      if (data.loggedIn) {
        $user.set(data.user);
        if (data.user.role === 'admin') {
          $adminUser.set(data.user);
        }
      }
    }
  } catch (e) {
    console.error('Auth init failed:', e);
  }
};

export const logoutAdmin = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    $adminUser.set(null);
    $user.set(null);
    $router.open('/admin');
};

// --- Router ---
export const $router = createRouter({
  home: '/',
  product: '/products/:id',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  admin: '/admin',
  login: '/login',
});
