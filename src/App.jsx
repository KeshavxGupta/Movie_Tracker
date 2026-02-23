import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  PlayCircle,
  Trash2,
  Film,
  Tv,
  Star,
  X,
  Loader2,
  TrendingUp,
  Filter,
  ArrowUpDown,
  ChevronUp,
  Bookmark,
  Zap,
  LayoutGrid,
  Info,
  Sparkles,
  BrainCircuit,
  Lightbulb,
  Wand2
} from 'lucide-react';

// --- Configuration & Constants ---
const apiKey = ""; // Gemini API Key (Runtime provided)
const TMDB_API_KEY = ""; // Enter your TMDB API Key here
const IMG_PATH = "https://image.tmdb.org/t/p/w500";

const GENRES = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adv",
  10762: "Kids", 10765: "Sci-Fi & Fantasy"
};

const App = () => {
  // --- State ---
  const [items, setItems] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState('recommend'); // 'recommend' | 'persona' | 'deepdive'

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('streambase_v3_data');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('streambase_v3_data', JSON.stringify(items));
  }, [items]);

  // --- Gemini API Utility ---
  const callGemini = async (prompt, systemInstruction = "") => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    const fetchWithRetry = async (retries = 0) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (error) {
        if (retries < 5) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries + 1);
        }
        throw error;
      }
    };

    return fetchWithRetry();
  };

  // --- AI Features ---
  const generatePersona = async () => {
    if (items.length < 3) return alert("Add at least 3 items to analyze your taste!");
    setAiLoading(true);
    setAiResult(null);
    setActiveAiTab('persona');
    setIsAiModalOpen(true);

    const list = items.map(i => `${i.title} (${i.type}, ${i.status})`).join(', ');
    const system = "You are a witty cinematic psychologist. Analyze the user's movie/anime list and give them a unique 'Persona Title' (bold) and a 3-sentence personality breakdown. Be slightly roasting but mostly appreciative.";

    try {
      const text = await callGemini(`Here is my watchlist: ${list}`, system);
      setAiResult(text);
    } catch (err) {
      setAiResult("The AI is currently resting. Try again in a moment.");
    } finally {
      setAiLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setAiLoading(true);
    setAiResult(null);
    setActiveAiTab('recommend');
    setIsAiModalOpen(true);

    const watchlist = items.filter(i => i.status !== 'Completed').map(i => i.title).join(', ');
    const completed = items.filter(i => i.status === 'Completed').map(i => i.title).join(', ');

    const system = "You are a world-class media recommendation engine. Based on the user's completed items and their current watchlist, suggest 3 NEW titles (movies, series, or anime) they haven't listed. For each, give a Title and a 'Why it fits' explanation.";
    const prompt = `I have watched: ${completed}. I plan to watch: ${watchlist}. Suggest 3 new things.`;

    try {
      const text = await callGemini(prompt, system);
      setAiResult(text);
    } catch (err) {
      setAiResult("Failed to fetch recommendations. Please check your connection.");
    } finally {
      setAiLoading(false);
    }
  };

  const getDeepDive = async (item) => {
    setAiLoading(true);
    setAiResult(null);
    setActiveAiTab('deepdive');
    setIsAiModalOpen(true);

    const system = "You are an expert film critic. Give a punchy, 4-sentence 'Deep Dive' on why this specific movie/show is culturally significant or worth watching. Focus on themes, direction, or unique hooks.";

    try {
      const text = await callGemini(`Tell me about: ${item.title} (${item.year})`, system);
      setAiResult(text);
    } catch (err) {
      setAiResult("Could not generate deep dive at this time.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- TMDB Search Logic ---
  const performSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const url = TMDB_API_KEY
        ? `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        : null;

      if (!url) {
        // Mock fallback for environment without key
        setTimeout(() => {
          const mock = [
            { id: 1, title: "Interstellar", release_date: "2014-11-07", poster_path: "/gEU2QniE6EwfVDxCzs25vbs2fU9.jpg", media_type: "movie", vote_average: 8.4, genre_ids: [12, 18, 878] },
            { id: 2, title: "Dune: Part Two", release_date: "2024-02-27", poster_path: "/czembS0Rhi9cyz99vYI7RjNW14q.jpg", media_type: "movie", vote_average: 8.3, genre_ids: [28, 12, 878] },
            { id: 3, title: "Attack on Titan", first_air_date: "2013-04-07", poster_path: "/h9zSTwSptFn9gnt6s6S0yRST14s.jpg", media_type: "tv", vote_average: 8.7, genre_ids: [16, 10765] }
          ].filter(m => (m.title || m.name).toLowerCase().includes(query.toLowerCase()));
          setSearchResults(mock);
          setIsLoading(false);
        }, 400);
        return;
      }

      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data.results?.filter(r => r.media_type !== 'person') || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Actions ---
  const addItem = (res) => {
    if (items.find(i => i.tmdbId === res.id)) return;
    const isAnime = res.genre_ids?.includes(16) && (res.original_language === 'ja' || res.media_type === 'tv');

    const newItem = {
      id: crypto.randomUUID(),
      tmdbId: res.id,
      title: res.title || res.name,
      year: (res.release_date || res.first_air_date || '').split('-')[0],
      poster: res.poster_path ? `${IMG_PATH}${res.poster_path}` : null,
      type: isAnime ? 'Anime' : (res.media_type === 'tv' ? 'Series' : 'Movie'),
      status: 'Watchlist',
      rating: res.vote_average,
      genres: res.genre_ids?.slice(0, 2).map(id => GENRES[id]) || [],
      episodes: 0,
      addedAt: Date.now(),
      overview: res.overview
    };

    setItems([newItem, ...items]);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const updateItem = (id, updates) => setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
  const deleteItem = (id) => setItems(items.filter(i => i.id !== id));
  const incrementEpisode = (id) => setItems(items.map(i => i.id === id ? { ...i, episodes: (i.episodes || 0) + 1, status: 'Watching' } : i));

  // --- View Logic ---
  const processedItems = useMemo(() => {
    return items
      .filter(i => (statusFilter === 'All' || i.status === statusFilter))
      .filter(i => (typeFilter === 'All' || i.type === typeFilter))
      .sort((a, b) => {
        if (sortBy === 'recent') return b.addedAt - a.addedAt;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'year') return b.year - a.year;
        return 0;
      });
  }, [items, statusFilter, typeFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/40">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 group-hover:scale-110 transition-transform">
                <Zap size={22} fill="white" className="text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter hidden sm:block uppercase">Stream<span className="text-indigo-500">Base</span></h1>
            </div>

            <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
              {['All', 'Watchlist', 'Watching', 'Completed'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === s ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generatePersona}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-indigo-400 hover:bg-white/10 transition-all active:scale-90"
              title="✨ Analyze My Persona"
            >
              <BrainCircuit size={20} />
            </button>
            <button
              onClick={generateRecommendations}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-amber-400 hover:bg-white/10 transition-all active:scale-90"
              title="✨ Get Smart Recs"
            >
              <Lightbulb size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="hidden sm:inline">Discover</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-6 lg:p-10 relative">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              Library
              <span className="text-sm font-mono text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full">{processedItems.length}</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-mono">Archive System v3.2.AI</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
              {['All', 'Movie', 'Series', 'Anime'].map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 text-xs font-bold px-4 py-2 rounded-xl outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-8 relative"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="recent">Sort: Recent</option>
              <option value="rating">Sort: Best</option>
              <option value="year">Sort: Release</option>
            </select>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
          {processedItems.map(item => (
            <div key={item.id} className="group relative flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-indigo-500/10 group-hover:border-indigo-500/50">
                {item.poster ? (
                  <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800"><Film size={40} /></div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => getDeepDive(item)}
                      className="flex-1 bg-white/20 backdrop-blur-md text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Sparkles size={10} /> ✨ Deep Dive
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateItem(item.id, { status: 'Completed' })}
                      className="flex-1 bg-white text-black py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      Finish
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-xl">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span className="text-[9px] font-black uppercase text-white tracking-widest">{item.status}</span>
                </div>

                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-xl">
                  <Star size={10} fill="#fbbf24" className="text-amber-400" />
                  <span className="text-[10px] font-bold text-white">{item.rating?.toFixed(1)}</span>
                </div>
              </div>

              <div className="mt-4 px-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{item.title}</h3>
                  <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{item.year}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.genres.map(g => (
                    <span key={g} className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter">{g}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: item.status === 'Completed' ? '100%' : '30%' }} />
                  </div>
                  {item.type !== 'Movie' && (
                    <button
                      onClick={() => incrementEpisode(item.id)}
                      className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md transition-all active:scale-90"
                    >
                      EP {item.episodes || 0} <Plus size={10} strokeWidth={4} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {processedItems.length === 0 && (
            <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <LayoutGrid size={40} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-widest">Archive Empty</h3>
              <p className="text-sm mt-2 max-w-xs">Start searching to populate your media database.</p>
            </div>
          )}
        </div>
      </main>

      {/* AI Intelligence Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setIsAiModalOpen(false)} />
          <div className="w-full max-w-lg bg-[#0a0a0b] border border-white/10 rounded-[32px] shadow-[0_0_100px_rgba(79,70,229,0.2)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${activeAiTab === 'recommend' ? 'bg-amber-500/10 text-amber-500' : activeAiTab === 'persona' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {activeAiTab === 'recommend' ? <Lightbulb size={24} /> : activeAiTab === 'persona' ? <BrainCircuit size={24} /> : <Sparkles size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    {activeAiTab === 'recommend' ? '✨ Smart Recommendations' : activeAiTab === 'persona' ? '✨ Watcher Persona' : '✨ AI Deep Dive'}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 tracking-widest">Powered by Gemini 2.0 Flash</p>
                </div>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-500 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              {aiLoading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Wand2 className="animate-bounce text-indigo-500" size={48} />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Computing Intelligence...</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                    {aiResult}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white/5 border-t border-white/5 flex justify-center">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-8 py-3 bg-white text-black rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Interface */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:pt-20">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setIsSearchOpen(false)} />
          <div className="w-full max-w-3xl bg-[#0a0a0b] border border-white/10 rounded-[32px] shadow-[0_0_100px_rgba(79,70,229,0.2)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center gap-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-500">
                <Search size={24} />
              </div>
              <input
                autoFocus
                type="text"
                placeholder="Find movies, series, or anime..."
                className="flex-1 bg-transparent text-2xl font-black outline-none placeholder:text-slate-800"
                value={searchQuery}
                onChange={(e) => performSearch(e.target.value)}
              />
              <button onClick={() => setIsSearchOpen(false)} className="w-10 h-10 hover:bg-white/5 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
              {isLoading ? (
                <div className="py-24 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-indigo-500" size={40} />
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Scanning Global Archives</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {searchResults.map(res => (
                    <button
                      key={res.id}
                      onClick={() => addItem(res)}
                      className="w-full flex items-center gap-5 p-4 hover:bg-white/5 rounded-3xl transition-all group text-left border border-transparent hover:border-white/5"
                    >
                      <div className="w-16 h-24 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 shadow-lg border border-white/5">
                        {res.poster_path ? (
                          <img src={`${IMG_PATH}${res.poster_path}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-800"><Film size={24} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-black text-xl truncate group-hover:text-indigo-400 transition-colors">{res.title || res.name}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {res.media_type === 'tv' ? 'TV Series' : 'Movie'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                          <span>{(res.release_date || res.first_air_date || 'TBA').split('-')[0]}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star size={12} fill="currentColor" />
                            {res.vote_average?.toFixed(1) || '0.0'}
                          </div>
                          <span>•</span>
                          <span className="truncate">{res.genre_ids?.slice(0, 2).map(id => GENRES[id]).join(', ')}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1 mt-2">{res.overview}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 pr-4 transition-all translate-x-4 group-hover:translate-x-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                          <Plus size={20} strokeWidth={3} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-24 text-center">
                  <Info className="mx-auto mb-4 text-slate-800" size={40} />
                  <p className="text-slate-600 font-bold">No matches found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="py-24 text-center">
                  <TrendingUp className="mx-auto mb-4 text-indigo-500/20" size={56} />
                  <p className="text-slate-600 font-bold text-lg">Search the Universal Library</p>
                  <p className="text-slate-700 text-sm mt-1">Start typing to fetch metadata from TMDB</p>
                </div>
              )}
            </div>

            {!TMDB_API_KEY && (
              <div className="p-4 bg-indigo-600/10 border-t border-white/5 text-center">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                  Running in Offline Demo Mode • Add TMDB Key for Live Search
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
