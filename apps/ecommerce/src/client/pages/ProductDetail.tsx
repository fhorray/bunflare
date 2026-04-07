import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ArrowLeft, Star, ShoppingCart, MessageSquare, BrainCircuit, Loader2 } from 'lucide-react';
import { addToCart } from '../store';

export function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [review, setReview] = useState("");
  const [sentiment, setSentiment] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(res => res.json() as Promise<{ product: any }>)
      .then(data => {
        setProduct(data.product);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAiDescribe = async () => {
    if (!product) return;
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: product.name })
      });
      const data = (await res.json()) as { description: string };
      setAiDescription(data.description);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    try {
      const res = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: review })
      });
      const data = (await res.json()) as { sentiment: any };
      setSentiment(data.sentiment ? JSON.stringify(data.sentiment) : "Neutral / Positive");
    } catch (e) {
       console.error(e);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  if (!product) return (
    <div className="text-center py-20 text-slate-500 font-bold border rounded-none m-8 bg-white shadow-sm uppercase tracking-widest text-xs border-dashed">
       Product Not Found
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Button variant="ghost" className="mb-8 font-bold text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-100 hover:text-slate-900" onClick={() => window.history.back()}>
        <ArrowLeft className="h-3 w-3 mr-2" />
        Back to Catalog
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        {/* Product Image */}
        <div className="aspect-square rounded-none overflow-hidden shadow-2xl bg-white border-8 border-white p-2">
           <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-none" />
        </div>

        {/* Product Info */}
        <div className="space-y-10">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-6">
               <Star className="h-3 w-3 fill-current" />
               <Star className="h-3 w-3 fill-current" />
               <Star className="h-3 w-3 fill-current" />
               <Star className="h-3 w-3 fill-current" />
               <Star className="h-3 w-3 fill-current" />
               <span className="ml-2 text-slate-300 font-black">PREMIUM QUALITY</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6">{product.name}</h1>
            <p className="text-5xl font-black text-blue-600 tracking-tighter">${(product.price / 100).toFixed(2)}</p>
          </div>

          <div className="p-8 bg-white rounded-none border border-slate-100 italic text-slate-500 font-medium leading-relaxed shadow-sm text-lg">
            "{product.description}"
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Enhancement</h3>
                <Button variant="outline" size="sm" onClick={handleAiDescribe} disabled={loadingAi} className="gap-2 rounded-none h-8 px-4 text-[10px] font-black uppercase tracking-widest border-blue-100 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                   {loadingAi ? <Loader2 className="h-3 w-3 animate-spin" /> : <BrainCircuit className="h-3 w-3" />}
                   Ask Llama-3-8B
                </Button>
             </div>
             {aiDescription && (
                <div className="p-6 bg-slate-900 text-slate-100 rounded-none text-sm leading-relaxed border-4 border-slate-800 animate-in fade-in slide-in-from-top-2 shadow-2xl ring-4 ring-blue-600/20">
                   <div className="flex items-center gap-2 mb-3 text-blue-400">
                      <BrainCircuit className="h-4 w-4" />
                      <span className="font-black uppercase tracking-widest text-[9px]">Llama 3 Response</span>
                   </div>
                   {aiDescription}
                </div>
             )}
          </div>

          <div className="pt-6">
             <Button className="h-20 w-full md:w-auto px-16 bg-blue-600 hover:bg-slate-900 text-white text-xl font-black uppercase tracking-widest rounded-none shadow-2xl shadow-blue-600/40 active:scale-[0.98] transition-all group" onClick={() => addToCart(product)}>
                <ShoppingCart className="h-6 w-6 mr-4 group-hover:scale-125 transition-transform" />
                Add to Cart
             </Button>
          </div>
        </div>
      </div>

      {/* AI Sentiment Analysis Feature Section */}
      <section className="mt-40 pt-24 border-t border-slate-200">
         <div className="flex flex-col items-center text-center mb-16">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Sentiment Service</span>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter max-w-2xl">Edge Powered Moderation</h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="rounded-none border-none shadow-2xl bg-white p-10 ring-1 ring-slate-100">
               <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-3 text-slate-400">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Leave a Review
               </h3>
               <textarea 
                  className="w-full h-40 p-6 rounded-none bg-slate-50 border-none focus:ring-4 focus:ring-blue-600/10 text-slate-700 text-lg placeholder:text-slate-300 mb-8 transition-all"
                  placeholder="Share your thoughts on this product..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
               ></textarea>
               <Button className="w-full bg-slate-900 h-16 rounded-none text-lg font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95" onClick={handleAnalyzeSentiment}>
                  Analyze Sentiment
               </Button>
            </Card>

            <div className="flex flex-col justify-center">
               <div className="p-12 bg-white rounded-none shadow-sm border border-slate-100 flex flex-col items-center text-center group relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-none opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="bg-blue-600 p-5 rounded-none mb-8 shadow-xl shadow-blue-600/20 relative z-10">
                     <BrainCircuit className="h-10 w-10 text-white" />
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 relative z-10">DistilBERT <span className="text-blue-600">Sync</span></h4>
                  <p className="text-sm text-slate-500 mb-8 max-w-xs font-medium leading-relaxed relative z-10">
                     We use Cloudflare Workers AI to classify review sentiments instantly at the edge.
                  </p>
                  {sentiment && (
                     <div className="px-8 py-4 bg-slate-900 rounded-none font-black text-blue-400 shadow-2xl uppercase tracking-widest text-xs relative z-10 animate-in zoom-in-95">
                        RESULT: {sentiment}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
