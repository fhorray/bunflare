import { useState, useRef } from 'react';

export function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Upload failed:', err);
      setResult({ success: false, message: 'Upload failed ❌' });
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10  p-10 rounded-3xl flex flex-col gap-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-[0.1em] text-center m-0">
        Cloudflare R2 Upload
      </h3>

      {!preview ? (
        <div
          className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 bg-white/[0.02] flex flex-col items-center gap-4 hover:border-[#ff8800] hover:bg-[#ff8800]/[0.05] hover:-translate-y-0.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-[3.5rem] ">📁</div>
          <p className="text-gray-500 text-base m-0">Click or drag image to upload</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <div className="relative rounded-2xl overflow-hidden  border border-white/10">
            <img src={preview} alt="Preview" className="max-w-full max-h-[350px] block" />
          </div>
          <div className="flex gap-4 w-full">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 bg-gradient-to-br from-[#ff8800] to-[#ffcc00] text-black  hover:-translate-y-0.5"
            >
              {uploading ? 'Uploading...' : 'Upload to R2'}
            </button>
            <button
              onClick={clear}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-0.5 text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div
          className={`p-5 rounded-2xl border text-center transition-all duration-300 ${result.success
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'
            }`}
        >
          <p className={`font-semibold text-[0.95rem] m-0 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
            {result.message}
          </p>
          {result.success && (
            <div className="mt-3 flex flex-col text-[0.85rem] text-gray-500 gap-1.5">
              <span>Filename: {result.filename}</span>
              <span>Size: {(result.size / 1024).toFixed(2)} KB</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
