import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Monitor, Camera, Printer, Search, Zap, Code, Loader2, ExternalLink, Download, FileText, AlertCircle } from 'lucide-react';

export function BrowserView() {
  const [url, setUrl] = useState('https://google.com');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const generatePDF = async () => {
    setStatus('loading');
    setError('');
    
    try {
      const response = await fetch(`/api/browser/pdf?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const data = await response.json() as any;
        throw new Error(data.error || 'Failed to generate PDF');
      }

      // Download the blob
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `bunflare-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setError(e.message);
    }
  };

  const features = [
    {
      title: 'Automated Puppeteer',
      icon: Camera,
      color: 'text-pink-600',
      desc: 'Orchestrate Chromium at the edge for Screenshots, PDFs, or Scraping.',
    },
    {
      title: 'Auto-Cleanup',
      icon: Zap,
      color: 'text-yellow-500',
      desc: 'Sessions are automatically closed after each request to save costs.',
    },
    {
      title: 'Fluid Class Mapping',
      icon: Code,
      color: 'text-indigo-600',
      desc: 'Functional browser() gets transformed into an optimized Class.',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
          Browser Rendering (Puppeteer)
        </h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed mt-2">
          Control headless browsers across Cloudflare's global network. 
          Generate PDFs from HTML, capture screenshots of websites, or build 
          powerful scraping bots with almost zero setup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="glass-card overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {feature.title}
              </CardTitle>
              <feature.icon
                className={`h-4 w-4 ${feature.color} group-hover:scale-125 transition-transform`}
              />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- LIVE PDF GENERATOR --- */}
      <Card className="glass-card border-slate-900/5 shadow-xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-600 text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Live PDF Generator</CardTitle>
              <CardDescription>Render any website to PDF via Bunflare</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target URL</label>
                <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-slate-900 transition-colors">
                  <div className="flex items-center px-3 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-900 py-3"
                  />
                  <button 
                    onClick={generatePDF}
                    disabled={status === 'loading'}
                    className="flex items-center gap-2 px-6 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                         <FileText className="w-4 h-4" />
                         Generate & Download
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {status === 'error' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <h5 className="text-sm font-bold text-rose-900">Provisioning Required</h5>
                    <p className="text-xs text-rose-700 leading-relaxed mt-0.5">{error}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <code className="px-2 py-1 bg-rose-100 rounded text-[10px] font-bold text-rose-900">bunflare doctor</code>
                      <span className="text-[10px] text-rose-700">Run diagnostics to sync BROWSER binding.</span>
                    </div>
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-900 flex-1">PDF Generated successfully. Check your downloads!</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 py-8 border-t border-slate-100">
               <div className="flex-1 space-y-1">
                 <h5 className="text-sm font-bold text-slate-900 leading-tight">Advanced Evaluation</h5>
                 <p className="text-xs text-slate-500">Wait for network idle to ensure all JavaScript content is rendered before export.</p>
               </div>
               <div className="flex gap-2">
                 <div className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 tracking-tight">networkidle0</div>
                 <div className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 tracking-tight">Format: A4</div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
