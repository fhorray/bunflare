import React, { useState, useEffect } from 'react';
import { addToCart, $cart, $adminUser, $user } from '../store';
import { useStore } from '@nanostores/react';
import { Button } from '../../components/ui/button';
import {
  Zap,
  ShieldCheck,
  Star,
  ShoppingCart,
  Loader2,
  ArrowRight,
  Package,
  LayoutGrid,
  Box,
} from 'lucide-react';
import type { SelectProduct } from '@/db/schema';

export function Home() {
  const [products, setProducts] = useState<SelectProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const cart = useStore($cart);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data: any) => {
        setProducts((data.products as SelectProduct[]) || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full bg-[#fdfdfd] text-slate-900 min-h-screen">
      {/* Precision Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-8 py-24 md:py-32 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                <Box className="h-3 w-3" />
                System Version 4.0.2-EDGE
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] text-slate-900 uppercase">
                Precision
                <br />
                Infrastructure
              </h1>
            </div>
            <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
              High-performance edge commerce distributed across 300+ global
              nodes. Sub-10ms latency and atomic inventory locking by default.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button className="h-12 px-8 text-[11px] font-bold uppercase tracking-widest bg-slate-900 text-white rounded-none hover:bg-blue-600 transition-colors gap-2">
                Explore Inventory <ArrowRight className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                className="h-12 px-8 text-[11px] font-bold uppercase tracking-widest border-slate-200 text-slate-900 rounded-none hover:bg-slate-50 transition-all"
              >
                Specifications
              </Button>
            </div>
          </div>
          <div className="flex-1 hidden md:flex justify-end pt-12 md:pt-0">
            <div className="w-full max-w-sm border border-slate-200 p-8 bg-slate-50 shadow-sm relative">
              <div className="absolute -top-3 -left-3 bg-white border border-slate-200 px-3 py-1 text-[9px] font-black uppercase text-slate-400">
                FEATURED SPEC
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-white border border-slate-200 flex items-center justify-center">
                  <Package className="h-16 w-16 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Inventory Status
                    </span>
                    <span className="text-[10px] font-bold uppercase text-blue-600">
                      Active
                    </span>
                  </div>
                  <div className="h-1 bg-slate-200 w-full">
                    <div className="h-full bg-blue-600 w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Style Info Grid */}
      <section className="border-b border-slate-200 bg-[#fbfbfb]">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-12 space-y-4 hover:bg-white transition-colors group">
            <div className="flex items-center gap-3 text-blue-600">
              <Zap className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Performance
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              Edge Latency
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-normal">
              Sub-10ms global delivery powered by Cloudflare Workers and KV
              caching.
            </p>
          </div>
          <div className="p-12 space-y-4 hover:bg-white transition-colors group">
            <div className="flex items-center gap-3 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Reliability
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              Atomic Locking
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-normal">
              Real-time inventory synchronization via Cloudflare Durable
              Objects. Zero race conditions.
            </p>
          </div>
          <div className="p-12 space-y-4 hover:bg-white transition-colors group">
            <div className="flex items-center gap-3 text-blue-600">
              <LayoutGrid className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Automation
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              AI Generated
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-normal">
              Dynamic descriptions and insights generated by Llama 3 on every
              product sync.
            </p>
          </div>
        </div>
      </section>

      {/* Product Catalog - Data Centric */}
      <section className="container mx-auto px-8 py-24">
        <div className="flex flex-col gap-12 mb-20">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-slate-200"></div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">
              Active Inventory Catalog
            </h2>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Polling Node 84...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-slate-200 hover:border-blue-600 transition-all flex flex-col group"
              >
                <div className="relative aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm border border-slate-200 text-[8px] font-bold uppercase tracking-tighter text-slate-600">
                    ID: {product.id.split('_').pop()?.toUpperCase()}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase text-blue-600 tracking-widest">
                        {product.category}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-slate-300">
                        #{product.stock} IN STOCK
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">
                      ${(product.price / 100).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-slate-50 text-slate-900 hover:bg-blue-600 hover:text-white rounded-none border border-slate-200 transition-all"
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Industrial System Footer */}
      <footer className="border-t border-slate-200 bg-white p-12 md:p-24">
        <div className="container mx-auto flex flex-col md:flex-row items-start justify-between gap-16">
          <div className="space-y-6 max-w-sm">
            <h2 className="text-3xl font-bold uppercase tracking-tighter text-slate-900">
              System Interconnect
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Access the node-level administrative console for full
              synchronization or join our deployment mailing list for weekly
              edge updates.
            </p>
            <div className="flex gap-2">
              <div className="bg-slate-50 flex-1 p-3 text-[10px] font-bold uppercase tracking-widest border border-slate-200 text-slate-400">
                address@edge.node
              </div>
              <Button className="bg-slate-900 text-white rounded-none text-[10px] px-8 font-bold uppercase tracking-widest">
                Connect
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                RESOURCES
              </h4>
              <ul className="space-y-3 text-xs font-bold text-slate-900 uppercase tracking-tighter">
                <li className="hover:text-blue-600 cursor-pointer">
                  Documentation
                </li>
                <li className="hover:text-blue-600 cursor-pointer">
                  API Reference
                </li>
                <li className="hover:text-blue-600 cursor-pointer">
                  Status Page
                </li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                CONSOLE
              </h4>
              <ul className="space-y-3 text-xs font-bold text-slate-900 uppercase tracking-tighter">
                <li className="hover:text-blue-600 cursor-pointer">
                  Admin Access
                </li>
                <li className="hover:text-blue-600 cursor-pointer">
                  Deployment Logs
                </li>
                <li className="hover:text-blue-600 cursor-pointer">Terminal</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
