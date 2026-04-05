import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search, ExternalLink, Code, Sparkles, Globe } from 'lucide-react';

export function SeoView() {
  const features = [
    {
      title: 'HTMLRewriter Powered',
      icon: Sparkles,
      color: 'text-cyan-500',
      desc: 'Surgical HTML injection with zero latency in-stream processing.',
    },
    {
      title: 'Social Optimization',
      icon: Globe,
      color: 'text-blue-500',
      desc: 'Automatic OpenGraph and Twitter card generation for all routes.',
    },
    {
      title: 'State Hydration',
      icon: Code,
      color: 'text-purple-500',
      desc: 'Inject initial application state directly into the HTML head.',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">SEO & HTML Metadata</h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Bunflare provides a blazing-fast utility to transform your HTML responses dynamically. 
          Modify titles, descriptions, and inject critical metadata without the overhead of heavy frameworks.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card border-cyan-500/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Search className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <CardTitle>Live Demo</CardTitle>
                <CardDescription>Test the metadata injection utility</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click the button below to visit a special route that uses <code>withMetadata</code> 
              to inject a custom title, description, and an OG image dynamically.
            </p>
            
            <a 
              href="/seo-test" 
              target="_blank" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all group"
            >
              Open SEO Test Page
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-cyan-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Values</span>
              </div>
              <ul className="space-y-1 text-xs font-mono text-slate-600">
                <li>Title: <span className="text-slate-900">SEO Test Page!!</span></li>
                <li>Description: <span className="text-slate-900">This is a test...</span></li>
                <li>Meta: <span className="text-slate-900">og:image, twitter:card</span></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Code Implementation</CardTitle>
            <CardDescription>Using bunflare/utils in your handler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-[10px] sm:text-xs overflow-x-auto font-mono leading-relaxed">
{`import { withMetadata } from "bunflare/utils";

export default serve({
  async fetch(req) {
    const res = await fetch(req);
    
    return withMetadata(res, {
      title: "My Dynamic Page",
      description: "SEO optimized via Bunflare",
      image: "https://example.com/og.png",
      injectScript: "window.__STATE__ = { id: 1 }"
    });
  }
});`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
