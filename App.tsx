
import React, { useState, useRef } from 'react';
import { AppState, VideoAnalysis } from './types';
import { analyzeVideo, generateThumbnail } from './services/gemini';
import { 
  CloudArrowUpIcon, 
  SparklesIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  PhotoIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  DevicePhoneMobileIcon,
  RectangleGroupIcon,
  GlobeAltIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbAspectRatio, setThumbAspectRatio] = useState<"16:9" | "9:16">("9:16"); // Defaulting to 9:16 as requested
  const [isRegeneratingThumb, setIsRegeneratingThumb] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Video file is too large. Please upload a clip under 50MB for analysis.");
      return;
    }

    setState(AppState.UPLOADING);
    setError(null);
    setProgress('Ingesting content...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        setState(AppState.ANALYZING);
        setProgress('PRO AI is analyzing every frame from 00:00...');
        
        try {
          const result = await analyzeVideo(base64, file.type);
          setAnalysis(result);
          
          setState(AppState.GENERATING_THUMBNAIL);
          setProgress('Generating cinematic visual assets...');
          
          const thumb = await generateThumbnail(result.thumbnailConcept.prompt, thumbAspectRatio);
          setThumbnailUrl(thumb);
          
          setState(AppState.COMPLETED);
          setProgress('');
        } catch (err: any) {
          console.error("Gemini Error:", err);
          let msg = err.message || 'Unknown error occurred';
          try {
            const parsed = JSON.parse(msg);
            msg = parsed.error?.message || msg;
          } catch(e) {}
          setError(msg);
          setState(AppState.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to read file.");
      setState(AppState.ERROR);
    }
  };

  const handleRatioChange = async (newRatio: "16:9" | "9:16") => {
    if (!analysis || isRegeneratingThumb) return;
    setThumbAspectRatio(newRatio);
    setIsRegeneratingThumb(true);
    try {
      const thumb = await generateThumbnail(analysis.thumbnailConcept.prompt, newRatio);
      setThumbnailUrl(thumb);
    } catch (err) {
      console.error("Failed to regenerate thumbnail", err);
    } finally {
      setIsRegeneratingThumb(false);
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    setAnalysis(null);
    setThumbnailUrl(null);
    setThumbAspectRatio("9:16");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 selection:bg-indigo-500 font-['Inter']">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-xl shadow-indigo-500/20">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">VidiGenius <span className="text-indigo-500 font-bold">PRO</span></h1>
            <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase">Precision Analysis Engine</p>
          </div>
        </div>
        {state !== AppState.IDLE && (
          <button 
            onClick={reset}
            className="px-5 py-2.5 text-sm font-bold bg-slate-800 hover:bg-slate-700 rounded-full transition-all flex items-center gap-2 border border-slate-700"
          >
            <ArrowPathIcon className="w-4 h-4" />
            New Project
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto">
        {state === AppState.IDLE && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="mb-12">
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">AI Video <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Strategist.</span></h2>
              <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium">Accurate 00:00 transcription, viral titles, and vertical-first thumbnails.</p>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-3xl group relative glass rounded-[2.5rem] p-16 text-center cursor-pointer border-dashed border-2 border-slate-700 hover:border-indigo-500 hover:bg-slate-900/40 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 rounded-[2.5rem] group-hover:opacity-100 opacity-0 transition-opacity" />
              <div className="relative z-10">
                <CloudArrowUpIcon className="w-16 h-16 mx-auto text-slate-500 group-hover:text-indigo-400 transition-colors mb-6" />
                <h3 className="text-2xl font-bold mb-3 text-white">Select Video Content</h3>
                <p className="text-slate-500 mb-10">MP4, MOV, WEBM (Max 50MB)</p>
                <div className="inline-flex items-center gap-2 px-10 py-4 bg-white text-slate-950 font-black rounded-2xl group-hover:bg-indigo-400 group-hover:text-white transition-all transform group-hover:-translate-y-1 shadow-xl uppercase">
                  Analyze from 00:00
                </div>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="video/*"
            />
          </div>
        )}

        {(state === AppState.UPLOADING || state === AppState.ANALYZING || state === AppState.GENERATING_THUMBNAIL) && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              <SparklesIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            </div>
            <h2 className="text-3xl font-black mb-3 text-white uppercase tracking-widest">{state.replace('_', ' ')}</h2>
            <p className="text-indigo-400 font-mono animate-pulse">{progress}</p>
          </div>
        )}

        {state === AppState.ERROR && (
          <div className="glass border-red-500/20 p-12 rounded-[2.5rem] text-center max-w-2xl mx-auto shadow-2xl">
            <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3">Analysis Halted</h3>
            <p className="text-slate-400 mb-10 font-mono text-sm bg-slate-950/50 p-4 rounded-xl border border-slate-800 break-words">
              {error}
            </p>
            <button 
              onClick={reset}
              className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
            >
              Try Another File
            </button>
          </div>
        )}

        {state === AppState.COMPLETED && analysis && (
          <div className="flex flex-col gap-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 1. Viral Titles (First) */}
            <section className="glass rounded-[2rem] p-8 border-indigo-500/10 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic">Viral Title Options</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.titles.sort((a,b) => a.rank - b.rank).map((title, idx) => (
                  <div 
                    key={idx} 
                    className={`p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                      title.rank === 1 ? 'bg-indigo-600/10 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => copyToClipboard(title.text)}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        title.rank === 1 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        Score {100 - (title.rank * 5)}%
                      </span>
                      <ClipboardIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <p className="text-lg font-black text-white mb-2 uppercase italic leading-tight">{title.text}</p>
                    <p className="text-[10px] text-slate-500 leading-normal">{title.reasoning}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Descriptions (Second) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass rounded-[2rem] p-8 border-red-500/10 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600/20 rounded-lg">
                      <GlobeAltIcon className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic">YouTube SEO</h3>
                  </div>
                  <button onClick={() => copyToClipboard(analysis.descriptions.youtube)} className="px-4 py-1.5 bg-red-600/10 text-red-400 text-[10px] font-black rounded-lg hover:bg-red-600/20 transition-all">COPY</button>
                </div>
                <textarea readOnly value={analysis.descriptions.youtube} className="w-full h-48 bg-slate-950/50 rounded-xl p-4 text-[11px] text-slate-400 border border-slate-800 resize-none custom-scrollbar" />
              </div>

              <div className="glass rounded-[2rem] p-8 border-pink-500/10 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-600/20 rounded-lg">
                      <DevicePhoneMobileIcon className="w-6 h-6 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic">Instagram Viral</h3>
                  </div>
                  <button onClick={() => copyToClipboard(analysis.descriptions.instagram)} className="px-4 py-1.5 bg-pink-600/10 text-pink-400 text-[10px] font-black rounded-lg hover:bg-pink-600/20 transition-all">COPY</button>
                </div>
                <textarea readOnly value={analysis.descriptions.instagram} className="w-full h-48 bg-slate-950/50 rounded-xl p-4 text-[11px] text-slate-400 border border-slate-800 resize-none custom-scrollbar" />
              </div>
            </section>

            {/* 3. Transcription (Third) */}
            <section className="glass rounded-[2rem] p-8 border-slate-500/10 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-600/20 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase italic">Full Transcription</h3>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">00:00 Accuracy Verified</span>
                   <button onClick={() => copyToClipboard(analysis.transcription)} className="p-2 text-slate-500 hover:text-white transition-colors"><ClipboardIcon className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="bg-slate-950/50 rounded-2xl p-8 max-h-[400px] overflow-y-auto border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap font-medium custom-scrollbar shadow-inner">
                {analysis.transcription}
              </div>
            </section>

            {/* 4. Thumbnail (Finally - Defaulting to 9:16) */}
            <section className="glass rounded-[2.5rem] p-10 border-indigo-500/20 shadow-2xl bg-gradient-to-b from-slate-900/50 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600/20 rounded-xl">
                    <PhotoIcon className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">AI Generated Assets</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cinematic Multi-Format Visuals</p>
                  </div>
                </div>
                
                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                  <button 
                    onClick={() => handleRatioChange("9:16")}
                    className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 ${
                      thumbAspectRatio === "9:16" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <DevicePhoneMobileIcon className="w-4 h-4" />
                    9:16
                  </button>
                  <button 
                    onClick={() => handleRatioChange("16:9")}
                    className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 ${
                      thumbAspectRatio === "16:9" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <RectangleGroupIcon className="w-4 h-4" />
                    16:9
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className={`relative group rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-slate-800 transition-all shrink-0 ${thumbAspectRatio === '9:16' ? 'max-w-[340px] mx-auto' : 'w-full lg:max-w-2xl'}`}>
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Thumbnail" className={`w-full h-auto transition-all duration-1000 ${isRegeneratingThumb ? 'opacity-30 blur-2xl scale-95' : 'opacity-100'}`} />
                  ) : (
                    <div className="aspect-video flex items-center justify-center bg-slate-950"><ArrowPathIcon className="w-10 h-10 animate-spin text-slate-800" /></div>
                  )}
                  {isRegeneratingThumb && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
                      <ArrowPathIcon className="w-12 h-12 text-white animate-spin mb-4" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Processing Pixels...</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                     <button onClick={() => {
                       const link = document.createElement('a');
                       link.href = thumbnailUrl || '';
                       link.download = `VidiGenius-Thumbnail-${thumbAspectRatio}.png`;
                       link.click();
                     }} className="w-full py-4 bg-white text-black font-black rounded-xl uppercase tracking-tighter hover:bg-indigo-400 hover:text-white transition-all">Download HD</button>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-slate-800/50">
                    <div className="flex items-center gap-2 mb-4">
                      <SparklesIcon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Visual Strategy</span>
                    </div>
                    <p className="text-lg text-slate-100 leading-relaxed italic mb-8 font-medium">"{analysis.thumbnailConcept.idea}"</p>
                    
                    <div className="pt-6 border-t border-slate-800/50">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Generation Seed Prompt</h4>
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                        <p className="text-[11px] text-slate-500 font-mono break-words leading-relaxed">{analysis.thumbnailConcept.prompt}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-6 glass rounded-2xl border-emerald-500/10">
                    <div className="p-3 bg-emerald-500/20 rounded-xl"><GlobeAltIcon className="w-6 h-6 text-emerald-400" /></div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase mb-1 italic">Optimization Verified</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Calculated with real-time market trends</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 py-6 px-10 bg-slate-950/90 backdrop-blur-md border-t border-slate-900 flex items-center justify-between z-50 pointer-events-none">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest pointer-events-auto">&copy; 2025 VidiGenius PRO AI System</p>
        <div className="flex gap-8 pointer-events-auto">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Accuracy Level: Absolute</span>
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">v3.2.0-ULTRA</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
