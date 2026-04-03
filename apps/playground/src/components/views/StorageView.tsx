import { useEffect, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  HardDrive,
  Trash2,
  RefreshCcw,
  Loader2,
  FileText,
  UploadCloud,
  Image as ImageIcon,
  File,
  X,
  Download,
  Eye,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  Folder,
  History,
  Info,
  Hash,
} from 'lucide-react';

interface StorageObject {
  key: string;
  size: number;
  uploaded: string;
  etag?: string;
  contentType: string;
}

export function StorageView() {
  const [files, setFiles] = useState<StorageObject[]>([]);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StorageObject | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPrefix, setCurrentPrefix] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, [currentPrefix]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/storage/list', window.location.origin);
      if (currentPrefix) url.searchParams.set('prefix', currentPrefix);
      const res = await fetch(url);
      const data = await res.json();
      if (data.objects) setFiles(data.objects);
      if (data.prefixes) setPrefixes(data.prefixes);
    } catch (e) {
      console.error('Failed to fetch files', e);
    } finally {
      setLoading(false);
    }
  };

  const getFullStat = async (file: StorageObject) => {
    try {
      const res = await fetch(`/api/storage/stat?key=${file.key}`);
      const stat = await res.json();
      setSelectedFile({ ...file, ...stat });
    } catch (e) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      await fetchFiles();
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteFile = async (key: string) => {
    try {
      await fetch('/api/storage/delete', {
        method: 'POST',
        body: JSON.stringify({ key }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (selectedFile?.key === key) setSelectedFile(null);
      await fetchFiles();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const isImage = (contentType: string) => contentType.startsWith('image/');

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter((f) =>
    f.key.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const breadcrumbs = currentPrefix.split('/').filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-muted/20 p-6 rounded-2xl border border-border/50">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Asset Manager</h2>
          <p className="text-muted-foreground text-sm">
            Cloudflare R2 storage powered by{' '}
            <span className="text-primary font-semibold">Native R2 Bindings</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
            />
          </div>
          <div className="h-8 w-[1px] bg-border mx-1" />
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 bg-primary shadow-none h-10 px-5 rounded-xl transition-transform active:scale-95"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            Upload
          </Button>
          <Button
            onClick={fetchFiles}
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl"
            disabled={loading}
          >
            <RefreshCcw
              className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'}
            />
          </Button>
        </div>
      </div>

      {/* Navigation & View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setCurrentPrefix('')}
            className={`p-1.5 rounded-lg transition-colors ${currentPrefix === '' ? 'text-primary bg-primary/10 font-bold' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Root
          </button>
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              <button
                onClick={() =>
                  setCurrentPrefix(breadcrumbs.slice(0, i + 1).join('/') + '/')
                }
                className={`p-1.5 rounded-lg transition-colors ${i === breadcrumbs.length - 1 ? 'text-primary bg-primary/10 font-bold' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {crumb}
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border/50">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-lg shadow-none"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-lg shadow-none"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Interface */}
        <div className="lg:col-span-3 space-y-4">
          {filteredFiles.length === 0 && prefixes.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-3xl border-border/30 text-muted-foreground bg-muted/5">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                <HardDrive className="w-12 h-12 opacity-20" />
              </div>
              <p className="text-base font-semibold text-foreground">
                No assets found
              </p>
              <p className="text-sm opacity-60">
                Try uploading a file or changing the prefix
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Folders first */}
              {prefixes.map((prefix) => (
                <div
                  key={prefix}
                  onClick={() => setCurrentPrefix(prefix)}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card p-4 transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02]"
                >
                  <Folder className="w-12 h-12 text-blue-500/80 mb-2 transition-transform group-hover:scale-110" />
                  <p className="text-xs font-bold truncate max-w-full">
                    {prefix.split('/').slice(-2, -1)[0]}
                  </p>
                </div>
              ))}
              {/* Then files */}
              {filteredFiles.map((file) => (
                <div
                  key={file.key}
                  onClick={() => getFullStat(file)}
                  className={`group relative flex flex-col rounded-2xl border bg-card p-2.5 transition-all cursor-pointer hover:border-primary/50 ${selectedFile?.key === file.key ? 'border-primary ring-2 ring-primary/10 bg-primary/[0.02]' : 'border-border/50'}`}
                >
                  <div className="aspect-square w-full rounded-xl bg-muted/30 overflow-hidden flex items-center justify-center relative border border-border/50">
                    {isImage(file.contentType) ||
                    file.key.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? (
                      <img
                        src={`/api/storage/file/${file.key}`}
                        alt={file.key}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <FileText className="w-12 h-12 text-muted-foreground/30" />
                    )}

                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-full shadow-xl scale-90 group-hover:scale-100 transition-transform"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 px-1.5 pb-1 flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate tracking-tight">
                        {file.key.split('/').pop()}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
                        {formatSize(file.size)}
                      </p>
                    </div>
                    {file.key.endsWith('.js') && (
                      <div
                        className="h-2 w-2 rounded-full bg-yellow-400 mt-1"
                        title="Script"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-border/50 overflow-hidden glass-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/50">
                    <th className="p-4 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">
                      Name
                    </th>
                    <th className="p-4 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">
                      Size
                    </th>
                    <th className="p-4 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">
                      Uploaded
                    </th>
                    <th className="p-4 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {prefixes.map((prefix) => (
                    <tr
                      key={prefix}
                      onClick={() => setCurrentPrefix(prefix)}
                      className="hover:bg-primary/[0.02] cursor-pointer group"
                    >
                      <td className="p-4 flex items-center gap-3">
                        <Folder className="w-4 h-4 text-blue-500/70" />
                        <span className="font-bold">
                          {prefix.split('/').slice(-2, -1)[0]}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">—</td>
                      <td className="p-4 text-muted-foreground text-xs">—</td>
                      <td className="p-4 text-right">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 ml-auto" />
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.key}
                      onClick={() => getFullStat(file)}
                      className={`hover:bg-primary/[0.02] cursor-pointer group transition-colors ${selectedFile?.key === file.key ? 'bg-primary/[0.05]' : ''}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted/40 flex items-center justify-center border border-border/50">
                            {isImage(file.contentType) ? (
                              <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                            ) : (
                              <FileText className="w-4 h-4 text-muted-foreground/50" />
                            )}
                          </div>
                          <span className="font-semibold">
                            {file.key.split('/').pop()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        {formatSize(file.size)}
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(file.uploaded).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Sidebar Info & Controls */}
        <div className="lg:col-span-1">
          <Card className="rounded-3xl border-border/50 overflow-hidden glass-card sticky top-8">
            {selectedFile ? (
              <>
                <div className="p-6 pb-4 border-b border-border/50 bg-muted/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      File Details
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="aspect-[4/3] w-full rounded-2xl bg-muted/40 overflow-hidden border border-border/50 flex items-center justify-center relative group">
                    {isImage(selectedFile.contentType) ||
                    selectedFile.key.match(
                      /\.(jpg|jpeg|png|gif|svg|webp)$/i,
                    ) ? (
                      <img
                        src={`/api/storage/file/${selectedFile.key}`}
                        alt={selectedFile.key}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <FileText className="w-16 h-16 text-muted-foreground/20" />
                    )}
                    <a
                      href={`/api/storage/file/${selectedFile.key}`}
                      target="_blank"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 font-bold pointer-events-none"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </Button>
                    </a>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                        <File className="w-3 h-3" /> Full Path
                      </label>
                      <p className="text-xs font-mono break-all bg-background/50 p-2.5 rounded-xl border border-border/50 leading-relaxed">
                        {selectedFile.key}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                          <HardDrive className="w-3 h-3" /> Size
                        </label>
                        <p className="text-sm font-bold">
                          {formatSize(selectedFile.size)}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                          <History className="w-3 h-3" /> Modified
                        </label>
                        <p className="text-sm font-bold">
                          {new Date(selectedFile.uploaded).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {selectedFile.etag && (
                      <div className="space-y-2 pt-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                          <Hash className="w-3 h-3" /> ETag
                        </label>
                        <p
                          className="text-[10px] font-mono text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/50 truncate"
                          title={selectedFile.etag}
                        >
                          {selectedFile.etag}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-6 border-t border-border/50">
                    <Button
                      variant="default"
                      className="w-full gap-2 rounded-xl h-11 transition-all active:scale-95"
                      asChild
                    >
                      <a
                        href={`/api/storage/file/${selectedFile.key}`}
                        download={selectedFile.key}
                      >
                        <Download className="w-4 h-4" />
                        Download Object
                      </a>
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full gap-2 rounded-xl h-11 bg-destructive/10 hover:bg-destructive/20 text-destructive border-0 shadow-none transition-all active:scale-95"
                      onClick={() => deleteFile(selectedFile.key)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Asset
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-6">
                <div className="p-6 bg-muted/20 rounded-full animate-pulse">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-muted-foreground">
                    No Selection
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 leading-relaxed">
                    Select an asset or folder to view its properties
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
