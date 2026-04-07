import { createRouter } from '@nanostores/router';
import { nanoquery } from '@nanostores/query';
import { map } from 'nanostores';

export const $router = createRouter({
  home: '/',
  products: '/products',
  checkout: '/checkout',
  admin: '/admin'
});

import { products } from '../../db/schema';
import { type InferSelectModel } from 'drizzle-orm';

export type Product = InferSelectModel<typeof products>;

const fetcher = (...args: any[]) => fetch(args[0] as string, args[1]).then(res => res.json());

export const [createProductsQuery] = nanoquery({
  fetcher
});

export const $products = createProductsQuery<Product[]>('/api/products');

export const $cart = map<{ [id: string]: number }>({});

export function addToCart(id: string) {
  const current = $cart.get()[id] || 0;
  $cart.setKey(id, current + 1);
}