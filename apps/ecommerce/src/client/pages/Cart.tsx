import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $cart, removeFromCart, $cartTotal, $user } from '../store';
import { Button } from '../../components/ui/button';
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Download,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

export function Cart() {
  const cart = useStore($cart);
  const total = useStore($cartTotal);
  const user = useStore($user);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [workflowStatus, setWorkflowStatus] = useState<{
    workflowStep: string;
    status?: string;
  }>({
    workflowStep: 'queued',
  });

  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/workflows/${orderId}/status`);
      const data = (await res.json()) as {
        workflowStep: string;
        status: string;
      };
      setWorkflowStatus(data);
      if (data.workflowStep === 'complete') clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, items: cart }),
      });
      const data = (await res.json()) as { success: boolean; orderId: string };
      if (data.success) {
        setOrderId(data.orderId);
        $cart.set([]);
      }
    } catch (e) {
      console.error('Checkout failed', e);
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-2xl">
        <div className="flex justify-center mb-8">
          <div className="border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-slate-900" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4 uppercase tracking-tight text-slate-900">
          Order Dispatched
        </h1>
        <p className="text-slate-500 mb-10 font-medium max-w-md mx-auto">
          Your order node has been created. Monitoring real-time Cloudflare
          Workflow fulfillment.
        </p>

        {/* Workflow Visualizer */}
        <div className="bg-slate-900 text-white p-8 mb-8 text-left space-y-6">
          <div className="flex items-center gap-4">
            <Loader2
              className={`h-5 w-5 ${workflowStatus.workflowStep !== 'complete' ? 'animate-spin text-blue-500' : 'text-slate-500'}`}
            />
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Workflow Telemetry
            </h2>
          </div>
          <div className="flex flex-col gap-4 text-xs font-mono">
            <div
              className={`flex items-center gap-3 ${workflowStatus.workflowStep === 'queued' ? 'text-blue-400 font-bold' : 'text-slate-500'}`}
            >
              <span>[QUEUE]</span> Initiating Order Fulfillment sequence...
            </div>
            <div
              className={`flex items-center gap-3 ${workflowStatus.workflowStep === 'verifying_payment' ? 'text-blue-400 font-bold' : workflowStatus.workflowStep === 'complete' ? 'text-slate-500' : 'opacity-20'}`}
            >
              <span>[AUTH]</span> Verifying Edge Payment Gateway...
            </div>
            <div
              className={`flex items-center gap-3 ${workflowStatus.workflowStep === 'complete' ? 'text-blue-400 font-bold' : 'opacity-20'}`}
            >
              <span>[LOCK]</span> Durable Object Atomic Stock Reserved.
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-8 mb-8 text-left space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Order Reference
            </span>
            <span className="font-mono font-bold text-slate-900">
              #{orderId}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Status
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              {workflowStatus.workflowStep}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1 rounded-none h-12 text-xs font-bold uppercase tracking-widest border-slate-200 text-slate-900 hover:bg-slate-50 gap-2 shadow-none"
            onClick={async () => {
              const res = await fetch('/api/render/invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
              });
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `invoice-${orderId}.pdf`;
              a.click();
            }}
          >
            <Download className="h-4 w-4" />
            Invoice
          </Button>
          <Button
            className="flex-1 bg-slate-900 hover:bg-blue-600 text-white rounded-none h-12 text-xs font-bold uppercase tracking-widest shadow-none transition-colors"
            onClick={() => (window.location.href = '/')}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-center gap-4 mb-10">
        <Button
          variant="ghost"
          className="rounded-none h-auto p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-6 w-[1px] bg-slate-200"></div>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
          Checkout Payload
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-200 shadow-sm">
          <div className="p-6 bg-slate-50 border border-slate-200 mb-6">
            <ShoppingCart className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">
            Transmission empty
          </p>
          <Button
            className="rounded-none px-8 h-12 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-none transition-colors"
            onClick={() => (window.location.href = '/')}
          >
            Access Inventory
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inline Product List */}
          <div className="lg:col-span-8 bg-white border border-slate-200 shadow-sm">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="col-span-6">Item Specification</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-3 text-right">Unit Value</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 items-center hover:bg-slate-50/50 transition-colors"
                >
                  <div className="col-span-6 flex items-center gap-6">
                    <div className="h-20 w-20 bg-white border border-slate-200 p-1 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm uppercase text-slate-900 tracking-tight">
                        {item.name}
                      </h3>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        ID: {item.id.split('_').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-start md:justify-center mt-4 md:mt-0">
                    <div className="flex items-center border border-slate-200 bg-white h-8">
                      <span className="px-4 text-[11px] font-bold text-slate-900">
                        {item.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3 text-left md:text-right font-bold text-sm text-slate-900 mt-2 md:mt-0">
                    ${item.price.toFixed(2)}
                  </div>

                  <div className="col-span-1 flex justify-end mt-2 md:mt-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white hover:bg-red-500 rounded-none transition-colors border border-transparent"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Precision Order Summary */}
          <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm sticky top-28">
            <div className="p-6 border-b border-slate-200 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <h2 className="text-[11px] font-bold uppercase tracking-widest">
                  Transaction Summary
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-bold">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                  <span>Network Fee</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2 py-1">
                    Waived
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                  <span>Tax</span>
                  <span className="text-slate-900 font-bold">$0.00</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Total Value
                  </span>
                  <span className="text-3xl font-bold text-slate-900 tracking-tighter">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full h-14 bg-blue-600 text-white hover:bg-slate-900 text-[11px] font-bold uppercase tracking-[0.2em] shadow-none rounded-none transition-colors"
                  disabled={loading}
                  onClick={handleCheckout}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Confirm Order'
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 text-slate-400">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[9px] uppercase font-bold tracking-widest">
                  Edge Secured Protocol
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
