import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Bookmark,
  Zap,
  LayoutGrid,
  Activity,
  BarChart3,
  Heart,
  History,
  ArrowUpRight,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  User,
  LogOut,
  Download,
  ShieldAlert,
  Play
} from 'lucide-react';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Toaster, toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MediaItemSchema, UpdateMediaItemSchema, SearchQuerySchema, sanitizeString } from '../lib/schemas';
import { tmdbLimiter } from '../lib/rateLimit';

// --- Utilities ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Configuration & Constants ---
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMG_PATH = "https://image.tmdb.org/t/p/w342";
const BACKDROP_PATH = "https://image.tmdb.org/t/p/w1280";

const GENRES = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adv",
  10762: "Kids", 10765: "Sci-Fi & Fantasy"
};

function Dashboard() {
  // --- State Variables ---
  const [items, setItems] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecLoading, setIsRecLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [trendingMedia, setTrendingMedia] = useState([]);
  const [detailData, setDetailData] = useState({ videos: [], cast: [] });
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);

  // Omnibar Keyboard Shortcut (Ctrl+K & ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle on Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      // Close on ESC
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch Trending for Omnibar default state
  useEffect(() => {
    if (isSearchOpen && trendingMedia.length === 0 && searchQuery === '') {
      setIsLoading(true);
      fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
          setTrendingMedia(data.results?.filter(r => r.media_type !== 'person').slice(0, 8) || []);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Trending fetch error:", err);
          setIsLoading(false);
        });
    }
  }, [isSearchOpen, trendingMedia.length, searchQuery]);

  // Debounced Search Fetching
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsLoading(searchQuery === '' && isSearchOpen && trendingMedia.length === 0);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = encodeURIComponent(searchQuery.trim());
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${query}&include_adult=false`);
        const data = await res.json();
        if (data.results) {
          setSearchResults(data.results.filter(r => r.media_type !== 'person').slice(0, 10));
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  // Auth State
  const { session, user } = useAuth();
  const navigate = useNavigate();

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  // --- View Logic ---
  const statsValues = useMemo(() => {
    const completed = items.filter(i => i.status === 'Completed').length;
    const watching = items.filter(i => i.status === 'Watching').length;
    const totalEpisodes = items.reduce((acc, i) => acc + (i.episodes || 0), 0);
    const movieCount = items.filter(i => i.type === 'Movie').length;
    const seriesCount = items.filter(i => i.type === 'Series' || i.type === 'Anime').length;

    return { completed, watching, totalEpisodes, movieCount, seriesCount, total: items.length };
  }, [items]);

  const shelves = useMemo(() => {
    return {
      watching: items.filter(i => i.status === 'Watching'),
      planned: items.filter(i => i.status === 'Plan to Watch'),
      completed: items.filter(i => i.status === 'Completed'),
    };
  }, [items]);

  const recentItems = useMemo(() => {
    return [...items].sort((a, b) => b.addedAt - a.addedAt).slice(0, 10);
  }, [items]);

  const heroItem = useMemo(() => {
    if (recentItems.length === 0) return null;
    return recentItems[activeHeroIndex] || recentItems[0];
  }, [recentItems, activeHeroIndex]);

  const getCreativeTagline = (item) => {
    if (!item) return "Initializing...";
    if (item.status === 'Watching') {
      if (item.type === 'Anime') return "Your Current Adventure";
      return "Continuing the Saga";
    }
    if (item.rating > 8.5) return "A Modern Masterpiece";
    if (item.type === 'Movie') return "Cinematic Excellence";
    if (item.status === 'Plan to Watch') return "The Next Big Discovery";
    return "The Spotlight Shines Here";
  };

  const getGenreColor = (item) => {
    if (!item || !item.genres || item.genres.length === 0) return 'from-brand-600/20';
    const main = item.genres[0];
    if (item.type === 'Anime') return 'from-pink-600/30';
    if (main === 'Action') return 'from-red-600/30';
    if (main === 'Drama') return 'from-purple-600/30';
    if (main === 'Comedy') return 'from-amber-500/30';
    if (main === 'Sci-Fi') return 'from-cyan-500/30';
    if (main === 'Horror') return 'from-slate-800/50';
    return 'from-brand-600/30';
  };

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedId);
  }, [items, selectedId]);

  // Reset trailer state when selection changes
  useEffect(() => {
    setIsPlayingTrailer(false);
  }, [selectedId]);

  // Fetch Extra Details (Trailers & Cast)

  // Fetch Extra Details (Trailers & Cast)
  useEffect(() => {
    if (!selectedItem) {
      setDetailData({ videos: [], cast: [] });
      return;
    }

    const fetchExtraDetails = async () => {
      setIsDetailLoading(true);
      try {
        const type = selectedItem.type === 'Movie' ? 'movie' : 'tv';
        const tmdbId = selectedItem.tmdbId; // We need to ensure we have this

        // If we don't have tmdbId stored, we might need to find it or skip
        if (!tmdbId) {
          setIsDetailLoading(false);
          return;
        }

        const [videoRes, creditRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/videos?api_key=${TMDB_API_KEY}`),
          fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/credits?api_key=${TMDB_API_KEY}`)
        ]);

        const [videoData, creditData] = await Promise.all([
          videoRes.json(),
          creditRes.json()
        ]);

        setDetailData({
          videos: videoData.results || [],
          cast: creditData.cast?.slice(0, 10) || []
        });
      } catch (err) {
        console.error("Error fetching extra details:", err);
      } finally {
        setIsDetailLoading(false);
      }
    };

    fetchExtraDetails();
  }, [selectedItem]);

  const filteredItems = useMemo(() => {
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

  // --- Export / Import ---
  const handleExportData = () => {
    if (items.length === 0) {
      toast.error("Archive is empty. Nothing to export.");
      return;
    }
    const dataStr = JSON.stringify(items, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streambase-archive-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Archive Exported Successfully");
    setIsProfileOpen(false);
  };

  const handleClearLocalData = () => {
    if (window.confirm("WARNING: This will clear your entire local archive. If you are connected to the Secure Cloud Sync, this will NOT delete your cloud data, only the local view. Continue?")) {
      setItems([]);
      localStorage.removeItem('streambase_v4_data');
      toast.success("Local Archive Cleared");
      setIsProfileOpen(false);
    }
  };

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('streambase_v4_data');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('streambase_v4_data', JSON.stringify(items));
  }, [items]);

  // --- Supabase Cloud Sync Integration ---
  useEffect(() => {
    if (!supabase || !user) return;

    // Fetch data whenever user changes
    fetchCloudItems(user.id);

    // Only migrate if cloud library is empty
    supabase.from('items').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => {
        if (count === 0) migrateLocalToCloud(user.id);
      });
  }, [user]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setItems([]); // Clear UI on logout
    toast.info('Disconnected from Secure Archive.');
    navigate('/');
  };

  const fetchCloudItems = async (userId) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      // Map database snake_case to app camelCase
      const mapped = (data || []).map(row => ({
        id: row.id,
        tmdbId: row.tmdb_id,
        title: row.title,
        year: row.year,
        poster: row.poster,
        backdrop: row.backdrop,
        type: row.type,
        status: row.status,
        rating: row.rating,
        episodes: row.episodes,
        totalEpisodes: row.total_episodes,
        overview: row.overview,
        notes: row.notes || '',
        addedAt: row.added_at * 1000,
        genres: row.genres || []
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (items.length === 0 || !TMDB_API_KEY) return;
    setIsRecLoading(true);
    try {
      const seeds = items
        .filter(i => (i.status === 'Completed' || i.status === 'Watching') && (i.rating || 0) >= 7)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      if (seeds.length === 0 && items.length > 0) seeds.push(items[0]);

      const recs = [];
      for (const seed of seeds) {
        const type = seed.type === 'Movie' ? 'movie' : 'tv';
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${seed.tmdbId}/recommendations?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        if (data.results) {
          recs.push(...data.results.map(r => ({ ...r, media_type: type === 'movie' ? 'movie' : 'tv' })));
        }
      }

      const libraryIds = new Set(items.map(i => i.tmdbId));
      const uniqueRecs = Array.from(new Map(recs.map(r => [r.id, r])).values())
        .filter(r => !libraryIds.has(r.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 15);

      setRecommendations(uniqueRecs);
    } catch (err) {
      console.error("Rec fetch failed", err);
    } finally {
      setIsRecLoading(false);
    }
  };

  useEffect(() => {
    if (items.length > 0 && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [items.length]);

  const migrateLocalToCloud = async (userId) => {
    const localData = JSON.parse(localStorage.getItem('streambase_v4_data') || '[]');
    if (localData.length === 0) return;

    toast.loading('Migrating local data to Secure Cloud...', { id: 'migration' });

    const toInsert = localData.map(item => ({
      user_id: userId,
      tmdb_id: item.tmdbId,
      title: item.title,
      type: item.type,
      status: item.status,
      rating: item.rating,
      episodes: item.episodes,
      total_episodes: item.totalEpisodes,
      poster: item.poster,
      backdrop: item.backdrop,
      year: item.year,
      overview: item.overview,
      added_at: item.addedAt
    }));

    const { error } = await supabase.from('items').insert(toInsert);

    if (error) {
      toast.error('Migration failed. Manual retry needed.', { id: 'migration' });
    } else {
      toast.success('Archive Migration Complete!', { id: 'migration' });
      fetchCloudItems(userId);
    }
  };

  // Handle Hero Auto-Advance
  useEffect(() => {
    if (recentItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIndex(prev => (prev + 1) % Math.min(recentItems.length, 10));
    }, 8000);
    return () => clearInterval(interval);
  }, [recentItems.length]);

  // Fetch Trending for Omnibar default state
  useEffect(() => {
    const fetchTrending = async () => {
      if (!TMDB_API_KEY) return;

      const canProceed = await tmdbLimiter.acquire();
      if (!canProceed) return; // Silent fail for background fetch

      try {
        const res = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        setTrendingMedia(data.results?.slice(0, 8) || []);
      } catch (err) {
        console.error("Trending fetch error:", err);
      }
    };
    fetchTrending();
  }, []);

  // --- API Utilities ---
  const fetchSeriesDetails = async (id) => {
    if (!TMDB_API_KEY) return null;
    try {
      const canProceed = await tmdbLimiter.acquire();
      if (!canProceed) {
        console.warn("TMDB rate limit hit for series details.");
        return null;
      }
      const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`);
      const data = await res.json();
      return {
        totalSeasons: data.number_of_seasons,
        totalEpisodes: data.number_of_episodes,
      };
    } catch (err) {
      console.error("Failed to fetch series details", err);
      return null;
    }
  };

  // --- Actions ---
  const addItem = async (res) => {
    if (items.find(i => i.tmdbId === res.id)) {
      toast.error(`${res.title || res.name} is already in your archive!`);
      return;
    }

    setIsLoading(true);
    const isAnime = res.genre_ids?.includes(16) && (res.original_language === 'ja' || res.media_type === 'tv');

    let seriesDetails = null;
    if (res.media_type === 'tv') {
      seriesDetails = await fetchSeriesDetails(res.id);
    }

    const newItem = {
      id: user ? undefined : crypto.randomUUID(), // DB generates ID if user exists
      tmdbId: res.id,
      title: res.title || res.name,
      year: (res.release_date || res.first_air_date || '').split('-')[0],
      poster: res.poster_path ? `${IMG_PATH}${res.poster_path}` : null,
      backdrop: res.backdrop_path ? `${BACKDROP_PATH}${res.backdrop_path}` : null,
      type: isAnime ? 'Anime' : (res.media_type === 'tv' ? 'Series' : 'Movie'),
      status: 'Plan to Watch',
      rating: res.vote_average,
      genres: res.genre_ids?.slice(0, 2).map(id => GENRES[id]) || [],
      episodes: 0,
      totalEpisodes: seriesDetails?.totalEpisodes || 0,
      totalSeasons: seriesDetails?.totalSeasons || 0,
      addedAt: Date.now(),
      overview: res.overview,
      notes: sanitizeString('') // Initial notes are empty and sanitized
    };

    const validation = MediaItemSchema.safeParse(newItem);
    if (!validation.success) {
      console.error("Invalid item data:", validation.error);
      toast.error("Failed to add item: Invalid data format.");
      setIsLoading(false);
      return;
    }
    const validatedItem = validation.data;

    if (user && supabase) {
      const { data, error } = await supabase.from('items').insert([{
        user_id: user.id,
        tmdb_id: validatedItem.tmdbId,
        title: validatedItem.title,
        type: validatedItem.type,
        status: validatedItem.status,
        rating: validatedItem.rating,
        episodes: validatedItem.episodes,
        total_episodes: validatedItem.totalEpisodes,
        poster: validatedItem.poster,
        backdrop: validatedItem.backdrop,
        year: validatedItem.year,
        overview: validatedItem.overview,
        added_at: validatedItem.addedAt,
        notes: validatedItem.notes
      }]).select();

      if (error) {
        toast.error('Cloud Sync Failed');
      } else {
        const cloudItem = { ...validatedItem, id: data[0].id };
        setItems([cloudItem, ...items]);
        toast.success(`${validatedItem.title} initialized in Archive.`);
      }
    } else {
      setItems([validatedItem, ...items]);
      toast.success(`${validatedItem.title} initializing in Archive...`);
    }

    setIsSearchOpen(false);
    setSearchQuery('');
    setIsLoading(false);
  };

  const updateItem = async (id, updates) => {
    const currentItem = items.find(i => i.id === id);
    if (!currentItem) return;

    const updatedFields = { ...updates };
    if (updatedFields.notes !== undefined) {
      updatedFields.notes = sanitizeString(updatedFields.notes);
    }

    const validation = MediaItemSchema.partial().safeParse(updatedFields);
    if (!validation.success) {
      console.error("Invalid update data:", validation.error);
      toast.error("Failed to update item: Invalid data format.");
      return;
    }
    const validatedUpdates = validation.data;

    if (user && supabase) {
      const dbUpdates = {};
      if (validatedUpdates.status) dbUpdates.status = validatedUpdates.status;
      if (validatedUpdates.episodes !== undefined) dbUpdates.episodes = validatedUpdates.episodes;
      if (validatedUpdates.notes !== undefined) dbUpdates.notes = validatedUpdates.notes;

      const { error } = await supabase
        .from('items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        toast.error('Sync Error');
        return;
      }
    }

    setItems(items.map(i => i.id === id ? { ...i, ...validatedUpdates } : i));
    if (validatedUpdates.status) toast.info(`Status updated: ${validatedUpdates.status}`);
  };

  const deleteItem = async (id) => {
    const item = items.find(i => i.id === id);

    if (user && supabase) {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Sync Error');
        return;
      }
    }

    setItems(items.filter(i => i.id !== id));
    toast.warning(`${item.title} removed from library.`);
  };

  const incrementEpisode = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const nextEp = Math.min((item.episodes || 0) + 1, item.totalEpisodes || 999);
    const isComplete = item.totalEpisodes > 0 && nextEp === item.totalEpisodes;

    const updates = {
      episodes: nextEp,
      status: isComplete ? 'Completed' : 'Watching'
    };

    if (user && supabase) {
      const { error } = await supabase
        .from('items')
        .update({
          episodes: nextEp,
          status: updates.status
        })
        .eq('id', id);

      if (error) {
        toast.error('Sync Error');
        return;
      }
    }

    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
    if (isComplete) toast.success(`Great job! ${item.title} completed.`);
  };


  // --- Components ---
  const MediaCard = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative flex flex-col"
    >
      <div
        onClick={() => setSelectedId(item.id)}
        className="relative aspect-[2/3] rounded-[24px] overflow-hidden glass-card transition-all duration-700 group-hover:-translate-y-3 group-hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.5)] cursor-pointer"
      >
        {item.poster ? (
          <img src={item.poster} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-800 bg-slate-900 border border-white/5"><Film size={40} /></div>
        )}

        {/* Animated Gradient Border on Hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border-2 border-brand-500/50 rounded-[24px]" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-5 flex flex-col justify-end">
          <div className="flex flex-col gap-2.5 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
            <div className="flex gap-2.5">
              {item.status === 'Plan to Watch' && (
                <button
                  onClick={() => updateItem(item.id, { status: 'Watching' })}
                  className="flex-1 bg-white text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-500 hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <PlayCircle size={14} fill="currentColor" /> Start
                </button>
              )}
              {item.status !== 'Completed' && (
                <button
                  onClick={() => updateItem(item.id, { status: 'Completed' })}
                  className="flex-1 bg-white/10 backdrop-blur-md text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 transition-all active:scale-95"
                >
                  Finish
                </button>
              )}
              {item.status === 'Completed' && (
                <button
                  onClick={() => updateItem(item.id, { status: 'Watching' })}
                  className="flex-1 bg-brand-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-600 transition-all active:scale-95"
                >
                  Re-watch
                </button>
              )}
            </div>
            <button
              onClick={() => deleteItem(item.id)}
              className="w-full py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>

        {/* Floating Tags */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4">
          <div className={cn(
            "px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl backdrop-blur-md md:backdrop-blur-2xl border border-white/10 flex items-center gap-1.5 md:gap-2 shadow-2xl transition-colors",
            item.status === 'Watching' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              item.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                'bg-brand-500/20 text-brand-400 border-brand-500/30'
          )}>
            <div className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]",
              item.status === 'Watching' ? 'bg-amber-500' :
                item.status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-500'
            )} />
            <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">{item.status}</span>
          </div>
        </div>

        <div className="absolute top-2 right-2 md:top-4 md:right-4 px-1.5 py-1 md:px-2.5 md:py-1.5 rounded-lg md:rounded-xl bg-black/40 backdrop-blur-md md:backdrop-blur-2xl border border-white/10 flex items-center gap-1 md:gap-1.5 shadow-2xl">
          <Star className="text-amber-500 w-2.5 h-2.5 md:w-3 md:h-3" fill="#f59e0b" />
          <span className="text-[9px] md:text-[11px] font-black text-white">{item.rating?.toFixed(1)}</span>
        </div>
      </div>

      <div className="mt-4 px-1">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <h3 className="font-bold text-sm text-white truncate transition-colors group-hover:text-brand-400 font-display flex-1">{item.title}</h3>
          <ArrowUpRight size={14} className="text-slate-800 group-hover:text-brand-500 transition-colors mt-0.5" />
        </div>
        <div className="flex items-center gap-2 mb-2 lg:mb-3">
          <span className="text-[8px] md:text-[9px] font-bold text-slate-500 tracking-tighter">{item.year}</span>
          <span className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-slate-800" />
          <span className="text-[8px] md:text-[9px] font-bold text-slate-500 tracking-widest uppercase">{item.type}</span>
        </div>

        {item.type !== 'Movie' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 tracking-widest">
              <span className="flex items-center gap-2"><Zap size={10} className="text-brand-500" /> {item.episodes || 0} / {item.totalEpisodes || '?'}</span>
              <span className="text-slate-600">{Math.round(((item.episodes || 0) / (item.totalEpisodes || 1)) * 100)}%</span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((item.episodes || 0) / (item.totalEpisodes || 1)) * 100, 100)}%` }}
                className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              />
            </div>
            {item.status === 'Watching' && (
              <button
                onClick={() => incrementEpisode(item.id)}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-wider hover:bg-brand-500 hover:text-white transition-all group/btn"
              >
                Next Episode <Plus size={14} strokeWidth={3} className="transition-transform group-hover/btn:rotate-90" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const RecommendedCard = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-shrink-0 w-[160px] md:w-[220px] group cursor-pointer relative"
    >
      <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl group-hover:border-brand-500/50 transition-all duration-500">
        {item.poster_path ? (
          <img
            src={`${IMG_PATH}${item.poster_path}`}
            alt={item.title || item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700"><Film size={40} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

        <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg flex items-center gap-1">
          <Star className="text-amber-500 w-2.5 h-2.5" fill="#f59e0b" />
          <span className="text-[10px] font-black text-white">{item.vote_average?.toFixed(1)}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem(item);
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl hover:bg-brand-500 hover:text-white"
        >
          Add to Archive
        </button>
      </div>
      <div className="mt-3 px-1 text-center group-hover:text-brand-400 transition-colors">
        <h4 className="font-bold text-[11px] md:text-sm text-white truncate font-display">{item.title || item.name}</h4>
        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{item.media_type === 'movie' ? 'Movie' : 'Series'}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-brand-500/30 bg-gradient-mesh relative overflow-x-hidden">
      <Toaster position="bottom-center" toastOptions={{
        style: { background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', fontWeight: 'bold' }
      }} />

      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-900/10 to-transparent pointer-events-none" />
      <div className="fixed -top-20 -right-20 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-[60px] md:blur-[120px] pointer-events-none hidden md:block" />

      {/* Navigation */}
      <nav className="sticky top-0 z-[150] bg-slate-950/40 md:bg-slate-950/20 backdrop-blur-lg md:backdrop-blur-3xl border-b border-white/5 px-4 md:px-6 lg:px-12 py-4 md:py-8">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 w-full md:w-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500">
                <Zap size={20} fill="black" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase font-display text-white">
                Stream<span className="text-brand-400">Base</span>
              </h1>
            </motion.div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 xl:mx-0 xl:px-0 xl:pb-0 bg-white/5 rounded-2xl p-1 border border-white/5 backdrop-blur-md md:backdrop-blur-3xl xl:bg-transparent xl:border-none">
              {['All', 'Plan to Watch', 'Watching', 'Completed'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-500 whitespace-nowrap",
                    statusFilter === s ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              aria-label="Toggle Stats Dialog"
              onClick={() => setIsStatsOpen(!isStatsOpen)}
              className={cn("p-2.5 md:p-3 glass rounded-xl transition-all duration-500 group", isStatsOpen ? "bg-brand-500 text-white" : "text-brand-400 hover:bg-brand-500/20")}
            >
              <BarChart3 size={18} className="group-hover:rotate-12 transition-transform md:size-[20px]" />
            </button>
            <button
              aria-label="Search and Add Media"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 md:gap-3 bg-white text-black px-3 md:px-6 py-2.5 md:py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-wider transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95 group font-display"
            >
              <Search className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={4} />
              <span className="hidden xs:inline">Add Media</span>
            </button>

            <div className="h-8 w-px bg-white/5 mx-1 hidden md:block" />

            {user ? (
              <div className="relative z-50" ref={profileRef}>
                <button
                  aria-label="Toggle User Profile"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={cn(
                    "flex items-center gap-2 p-1.5 pr-4 glass rounded-xl border transition-all duration-300 active:scale-95 group",
                    isProfileOpen ? "border-brand-500 bg-brand-500/10" : "border-brand-500/30 hover:bg-brand-500/10 hover:border-brand-500/50"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {user.email ? user.email.charAt(0).toUpperCase() : <User size={16} />}
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-none opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">Agent Profile</span>
                    <span className="text-[8px] font-bold text-slate-400 max-w-[100px] truncate">{user.email}</span>
                  </div>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-3 w-72 bg-slate-950/98 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-2 flex flex-col gap-1"
                    >
                      {/* Mini Stats Detail */}
                      <div className="p-4 bg-black/30 rounded-xl border border-white/5 mb-2">
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                          <Activity size={12} className="text-brand-400" />
                          Archive Overview
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 p-2 rounded-lg flex flex-col">
                            <span className="text-2xl font-black text-white">{statsValues.movieCount}</span>
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Movies Logged</span>
                          </div>
                          <div className="bg-white/5 p-2 rounded-lg flex flex-col">
                            <span className="text-2xl font-black text-white">{statsValues.seriesCount}</span>
                            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Series Tracked</span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Actions */}
                      <button
                        onClick={handleExportData}
                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors group text-left"
                      >
                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <Download size={14} />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-widest">Export Local Archive</span>
                      </button>

                      <button
                        onClick={handleClearLocalData}
                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors group text-left"
                      >
                        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <ShieldAlert size={14} />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-widest">Clear Local Cache</span>
                      </button>

                      <div className="h-px bg-white/5 my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors group text-left mt-1"
                      >
                        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <LogOut size={14} />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-widest">Disconnect Session</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="max-w-[1700px] mx-auto p-4 md:p-6 lg:p-12 space-y-12 md:space-y-16">

        {/* Stats Overlay/Section */}
        <AnimatePresence>
          {isStatsOpen && (
            <motion.section
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4"
            >
              {[
                { label: 'Total Library', value: statsValues.total, icon: Layers, color: 'text-brand-400' },
                { label: 'Watching', value: statsValues.watching, icon: Flame, color: 'text-amber-500' },
                { label: 'Completed', value: statsValues.completed, icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'Episodes Watched', value: statsValues.totalEpisodes, icon: Zap, color: 'text-brand-400' },
                { label: 'Movies', value: statsValues.movieCount, icon: Film, color: 'text-slate-400' },
                { label: 'TV Shows', value: statsValues.seriesCount, icon: Tv, color: 'text-slate-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/40 backdrop-blur-xl p-2.5 md:p-5 rounded-xl md:rounded-2xl border border-white/5 space-y-1 md:space-y-2 hover:border-brand-500/30 transition-all group">
                  <div className={cn("p-1.5 md:p-2 w-fit rounded-lg bg-white/5", stat.color)}>
                    {stat.icon && <stat.icon className="w-3 h-3 md:w-4 md:h-4" />}
                  </div>
                  <div>
                    <div className="text-base md:text-xl font-black font-display text-white">{stat.value}</div>
                    <div className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Large Hero Spotlight */}
        <section className="relative h-[450px] sm:h-[550px] lg:h-[650px] rounded-[32px] md:rounded-[40px] overflow-hidden group shadow-2xl border border-white/10">
          <AnimatePresence mode="wait">
            {heroItem && (
              <motion.div
                key={heroItem.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0"
              >
                {heroItem.backdrop ? (
                  <img src={heroItem.backdrop} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8s] scale-110 group-hover:scale-105" alt={heroItem.title} />
                ) : (
                  <div className="absolute inset-0 bg-slate-900" />
                )}
                <div className={cn("absolute inset-0 bg-gradient-to-r via-slate-950/20 to-transparent transition-colors duration-1000", getGenreColor(heroItem))} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                {/* Cinematic Overlays */}
                <div className="absolute inset-0 film-grain opacity-[0.03] pointer-events-none hidden md:block" />
                <div className="absolute inset-0 vignette opacity-60 pointer-events-none" />

                {/* Dynamic Ambient Glow */}
                <div className={cn("absolute -top-20 -left-20 w-96 h-96 rounded-full blur-[60px] md:blur-[120px] opacity-20 animate-pulse transition-colors duration-1000", getGenreColor(heroItem).replace('from-', 'bg-'))} />

                <div className="relative h-full flex flex-col justify-center px-4 md:px-10 lg:px-20 max-w-5xl space-y-4 md:space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-3 px-3 py-1.5 md:px-4 md:py-2 rounded-full glass border-brand-500/40 text-brand-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest backdrop-blur-3xl w-fit"
                  >
                    <Activity className="animate-pulse w-2.5 h-2.5 md:w-3 md:h-3" /> {getCreativeTagline(heroItem)}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-1.5 md:space-y-3"
                  >
                    <h2 className="text-2xl sm:text-5xl lg:text-8xl font-black font-display text-white tracking-tighter leading-none line-clamp-2">
                      {heroItem.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-[10px] md:sm font-bold text-slate-300">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Star fill="#f59e0b" className="text-amber-500 w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                        <span className="text-base md:text-xl">{heroItem.rating?.toFixed(1)}</span>
                      </div>
                      <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-slate-600" />
                      <span className="uppercase tracking-[0.2em] text-[8px] md:text-[12px] opacity-70">{heroItem.type}</span>
                      <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-slate-600" />
                      <span className="text-sm md:text-lg">{heroItem.year}</span>
                    </div>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-[10px] sm:text-sm md:text-lg text-slate-400 max-w-2xl font-medium leading-relaxed line-clamp-2 md:line-clamp-3 opacity-90 italic"
                  >
                    "{heroItem.overview}"
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-2 md:gap-4"
                  >
                    <button
                      onClick={() => setSelectedId(heroItem.id)}
                      className="px-6 md:px-10 py-2.5 md:py-4 bg-white text-black rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-xs tracking-widest hover:bg-brand-500 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2 md:gap-3"
                    >
                      View Details <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>
                    {heroItem.status === 'Watching' && (
                      <button
                        onClick={() => incrementEpisode(heroItem.id)}
                        className="px-6 md:px-10 py-2.5 md:py-4 glass text-white rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-xs tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 md:gap-3 border-white/20"
                      >
                        Next Episode <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slide Indicators */}
          {recentItems.length > 1 && (
            <div className="absolute bottom-10 right-10 flex gap-3 z-20">
              {recentItems.slice(0, 10).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveHeroIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    activeHeroIndex === i ? "w-12 bg-white" : "w-3 bg-white/20 hover:bg-white/40"
                  )}
                />
              ))}
            </div>
          )}
        </section>



        {/* Library Control Header */}
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-l-2 border-brand-500/30 pl-6">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white font-display">
              My <span className="text-brand-400">Library</span>
            </h2>
            <p className="text-slate-500 font-medium text-[10px] md:text-xs">Manage and track your media collection.</p>
          </div>

          <div className="flex flex-wrap gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md md:backdrop-blur-2xl">
            <div className="flex flex-col gap-1.5 px-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-2">Type</span>
              <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                {['All', 'Movie', 'Series'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "px-5 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider transition-all duration-500",
                      typeFilter === t ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-8 bg-white/5 my-auto hidden md:block" />

            <div className="flex flex-col gap-1.5 px-2 min-w-[150px]">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-2">Sort By</span>
              <select
                aria-label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/40 border border-white/5 text-[8px] font-black uppercase tracking-wider px-4 py-2 rounded-lg outline-none focus:border-brand-500 appearance-none glass cursor-pointer transition-all"
              >
                <option value="recent">Recently Added</option>
                <option value="rating">Top Rated</option>
                <option value="year">Release Year</option>
              </select>
            </div>
          </div>
        </section>

        {/* Dynamic Shelves */}
        {statusFilter === 'All' ? (
          <div className="space-y-16 md:space-y-32">
            {shelves.watching.length > 0 && (
              <section className="space-y-8 md:space-y-12">
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="w-2 md:w-3 h-8 md:h-12 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                  <h2 className="text-2xl md:text-4xl font-black font-display uppercase tracking-[-0.02em] text-white flex items-center gap-4 md:gap-6">
                    Live Protocols
                    <span className="text-[10px] md:text-sm font-black px-3 py-1 md:px-4 md:py-1.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">{shelves.watching.length}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 md:gap-x-8 gap-y-10 md:gap-y-16 text-xs xl:text-base">
                  {shelves.watching.map(item => <MediaCard key={item.id} item={item} />)}
                </div>
              </section>
            )}

            {shelves.planned.length > 0 && (
              <section className="space-y-8 md:space-y-12">
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="w-2 md:w-3 h-8 md:h-12 bg-brand-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                  <h2 className="text-2xl md:text-4xl font-black font-display uppercase tracking-[-0.02em] text-white flex items-center gap-4 md:gap-6">
                    Awaiting Initiation
                    <span className="text-[10px] md:text-sm font-black px-3 py-1 md:px-4 md:py-1.5 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">{shelves.planned.length}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
                  {shelves.planned.map(item => <MediaCard key={item.id} item={item} />)}
                </div>
              </section>
            )}

            {shelves.completed.length > 0 && (
              <section className="space-y-8 md:space-y-12">
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="w-2 md:w-3 h-8 md:h-12 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                  <h2 className="text-2xl md:text-4xl font-black font-display uppercase tracking-[-0.02em] text-white opacity-60 flex items-center gap-4 md:gap-6">
                    Deep Archive
                    <span className="text-[10px] md:text-sm font-black px-3 py-1 md:px-4 md:py-1.5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">{shelves.completed.length}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16 opacity-60 hover:opacity-100 transition-opacity duration-700">
                  {shelves.completed.map(item => <MediaCard key={item.id} item={item} />)}
                </div>
              </section>
            )}

            {items.length === 0 && (
              <div className="py-40 text-center glass rounded-[64px] border-dashed border-2 border-white/10 space-y-8">
                <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto text-slate-800">
                  <LayoutGrid size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-4xl font-black font-display uppercase text-white">Universal Void</h3>
                  <p className="text-slate-500 font-medium">No entities detected in the Archive. Start discovery to initialize.</p>
                </div>
                <button onClick={() => setIsSearchOpen(true)} className="px-12 py-5 bg-white text-black rounded-[24px] font-black uppercase text-xs tracking-widest hover:scale-110 transition-all">
                  Initialize Discovery
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-16 pt-12">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => <MediaCard key={item.id} item={item} />)}
            </AnimatePresence>
          </div>
        )}

        {/* Recommendations Carousel (Moved to bottom) */}
        {recommendations.length > 0 && (
          <section className="space-y-6 pt-12 md:pt-24 border-t border-white/5 mt-16 md:mt-32">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black font-display text-white tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-emerald-400" size={24} />
                  Recommended <span className="text-emerald-400">For You</span>
                </h3>
              </div>
              <button
                onClick={fetchRecommendations}
                disabled={isRecLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 group"
              >
                <Activity className={cn("w-3.5 h-3.5", isRecLoading && "animate-spin")} />
                {isRecLoading ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-8 no-scrollbar -mx-6 md:-mx-12 px-6 md:px-12 mask-fade-edges">
              {isRecLoading ? (
                <div className="flex items-center justify-center w-full py-10">
                  <Loader2 className="animate-spin text-brand-500" size={40} />
                </div>
              ) : (
                recommendations.map((item, i) => (
                  <RecommendedCard key={item.id} item={item} />
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* Media Detail Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[200] overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setSelectedId(null)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full md:max-w-2xl bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col overflow-hidden glass"
            >
              {/* Drawer Header / Hero Section */}
              <div className="relative h-[45vh] flex-shrink-0 group overflow-hidden bg-slate-950">
                {/* Visual Background */}
                <AnimatePresence mode="wait">
                  {!isPlayingTrailer && (
                    <motion.div
                      key="backdrop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      {selectedItem.backdrop ? (
                        <img
                          src={selectedItem.backdrop}
                          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[3000ms]"
                          alt={selectedItem.title}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex items-center justify-center opacity-40">
                          <Film size={100} className="text-slate-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Close Button (Hidden when playing) */}
                {!isPlayingTrailer && (
                  <button
                    aria-label="Close Details"
                    onClick={() => setSelectedId(null)}
                    className="absolute top-6 right-6 w-12 h-12 glass rounded-2xl flex items-center justify-center text-white/50 hover:text-white transition-all hover:rotate-90 z-20"
                  >
                    <X size={24} />
                  </button>
                )}

                {/* Unified Hero Content (Left Aligned Stack) */}
                <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end z-20 pointer-events-none">
                  <motion.div
                    layout
                    className="space-y-4 md:space-y-6 pointer-events-auto max-w-lg"
                  >
                    {/* Trailer Trigger (Only if not playing and video exists) */}
                    {!isPlayingTrailer && detailData.videos?.length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setIsPlayingTrailer(true)}
                        className="group flex items-center gap-3 md:gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-500/30 p-1.5 md:p-2 pr-4 md:pr-6 rounded-2xl md:rounded-3xl backdrop-blur-md transition-all duration-300"
                      >
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-brand-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] group-hover:scale-110 group-hover:bg-brand-400 transition-all">
                          <Play size={20} fill="white" className="ml-0.5 md:ml-1 md:size-[28px]" />
                        </div>
                        <div className="text-left">
                          <p className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] text-brand-400 leading-none mb-1">Watch Premiere</p>
                          <h4 className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-white leading-none">Launch Trailer</h4>
                        </div>
                      </motion.button>
                    )}

                    {/* Metadata & Title */}
                    {!isPlayingTrailer && (
                      <div className="space-y-2 md:space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg bg-brand-500/20 text-brand-400 text-[8px] md:text-[10px] font-black tracking-widest uppercase border border-brand-500/30">
                            {selectedItem.type}
                          </span>
                          <span className="text-[8px] md:text-[10px] font-black text-white/40">{selectedItem.year}</span>
                          <div className="flex items-center gap-1.5 text-amber-500 text-xs md:text-sm font-black">
                            <Star size={12} fill="currentColor" className="md:size-[16px]" />
                            <span>{selectedItem.rating?.toFixed(1)}</span>
                          </div>
                        </div>
                        <h2 className="text-3xl md:text-6xl font-black font-display text-white tracking-tighter leading-none">
                          {selectedItem.title}
                        </h2>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Inline Trailer Player Integration */}
                <AnimatePresence>
                  {isPlayingTrailer && (
                    <motion.div
                      key="trailer-player"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="absolute inset-0 z-[40] bg-black p-4"
                    >
                      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group/player">
                        <iframe
                          src={`https://www.youtube.com/embed/${(detailData.videos.find(v => v.type === 'Trailer') || detailData.videos[0])?.key}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`}
                          className="w-full h-full border-none"
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          title="Trailer Player"
                        />

                        {/* Overlay Player Controls */}
                        <div className="absolute top-4 left-4 flex gap-4 opacity-0 group-hover/player:opacity-100 transition-opacity">
                          <button
                            aria-label="Close Trailer Player"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPlayingTrailer(false);
                            }}
                            className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-white/70 hover:text-white transition-all shadow-xl"
                            title="Back to Briefing"
                          >
                            <ChevronLeft size={24} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 md:space-y-12 no-scrollbar">

                {/* Stats / Status Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Archive Status</span>
                    <p className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      selectedItem.status === 'Completed' ? 'text-emerald-400' : selectedItem.status === 'Watching' ? 'text-amber-400' : 'text-brand-400'
                    )}>{selectedItem.status}</p>
                  </div>
                  {selectedItem.type !== 'Movie' && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                      <p className="text-xs font-black text-white uppercase tracking-widest">{selectedItem.episodes} / {selectedItem.totalEpisodes || '?'}</p>
                    </div>
                  )}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1 overflow-hidden">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Genres</span>
                    <p className="text-[10px] font-black text-slate-300 uppercase truncate">{selectedItem.genres?.join(', ') || 'Global'}</p>
                  </div>
                </div>

                {/* Overview Section */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Briefing</h3>
                  <p className="text-slate-300 text-lg leading-relaxed font-medium">
                    {selectedItem.overview || "No transmission data found for this entity."}
                  </p>
                </section>

                {/* Cast Gallery */}
                <section className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Lead Operatives</h3>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                    {isDetailLoading ? (
                      [...Array(5)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-24 space-y-3 animate-pulse">
                          <div className="w-24 h-24 rounded-full bg-white/5" />
                          <div className="h-2 w-16 bg-white/5 mx-auto rounded" />
                        </div>
                      ))
                    ) : detailData.cast?.length > 0 ? (
                      detailData.cast.map(person => (
                        <div key={person.id} className="flex-shrink-0 w-24 text-center group">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand-500/50 transition-all mb-3 bg-slate-800">
                            {person.profile_path ? (
                              <img src={`${IMG_PATH}${person.profile_path}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={person.name} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><User size={24} className="text-slate-700" /></div>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-white truncate px-1">{person.name}</p>
                          <p className="text-[8px] font-bold text-slate-500 truncate px-1 uppercase">{person.character}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-600 text-[10px] font-black uppercase">No Cast Data Syncable</p>
                    )}
                  </div>
                </section>

                {/* Private Notes Block */}
                <section className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Private Log Entry</h3>
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Encryption Active</span>
                  </div>
                  <textarea
                    placeholder="How was the experience? record your tactical observations here..."
                    className="w-full min-h-[160px] bg-slate-950/50 border border-white/5 rounded-2xl p-6 text-slate-300 font-medium text-sm outline-none focus:border-brand-500/30 transition-colors resize-none no-scrollbar placeholder:text-slate-700"
                    value={selectedItem.notes || ''}
                    onChange={(e) => updateItem(selectedItem.id, { notes: e.target.value })}
                  />
                </section>

                {/* Management Zone */}
                <section className="space-y-6 pt-10 border-t border-white/5 pb-20">
                  <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Archive Management</h3>
                  <div className="flex flex-wrap gap-4">
                    {['Plan to Watch', 'Watching', 'Completed'].map(status => (
                      <button
                        key={status}
                        onClick={() => updateItem(selectedItem.id, { status })}
                        className={cn(
                          "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          selectedItem.status === status
                            ? "bg-white text-black border-white shadow-xl scale-105"
                            : "glass text-slate-500 hover:text-white border-white/5"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        deleteItem(selectedItem.id);
                        setSelectedId(null);
                      }}
                      className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    >
                      Remove Entity
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Omnibar Search Interface */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center p-2 md:p-4 pt-[5vh] md:pt-[15vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div
              initial={{ y: -50, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -50, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-3xl bg-slate-950/98 backdrop-blur-md md:backdrop-blur-2xl border border-white/10 shadow-[0_30px_100px_-20px_rgba(0,0,0,1)] rounded-3xl overflow-hidden relative z-10"
            >
              {/* Omnibar Input Header */}
              <div className="flex items-center gap-4 p-4 md:p-6 border-b border-white/10">
                <Search size={24} className="text-brand-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search movies/shows..."
                  className="flex-1 bg-transparent text-base md:text-2xl font-medium outline-none placeholder:text-slate-500 font-display text-white"
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    setIsLoading(false);
                  }}
                />
                <div className="hidden sm:flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-black uppercase text-slate-400 border border-white/5 shadow-sm">ESC</kbd>
                  <span className="text-[10px] uppercase font-bold text-slate-500">to close</span>
                </div>
              </div>

              {/* Omnibar Results Area */}
              <div className="max-h-[60vh] overflow-y-auto w-full no-scrollbar relative min-h-[100px]">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-brand-500" size={32} />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Searching Archive...</span>
                  </div>
                ) : searchQuery.length > 1 && searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-400">Results</div>
                    {searchResults.map(res => (
                      <button
                        key={res.id}
                        onClick={() => {
                          addItem(res);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group text-left"
                      >
                        <div className="w-12 h-16 rounded overflow-hidden bg-slate-800 flex-shrink-0">
                          {res.poster_path ? (
                            <img src={`${IMG_PATH}${res.poster_path}`} loading="lazy" alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700"><Film size={16} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-base truncate group-hover:text-brand-400 transition-colors">{res.title || res.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-300">{(res.release_date || res.first_air_date || 'TBA').split('-')[0]}</span>
                            <span className="capitalize">{res.media_type === 'movie' ? 'Movie' : 'Series'}</span>
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star size={12} fill="currentColor" />
                              {res.vote_average?.toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 pr-4 transition-opacity">
                          <div className="px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest border border-brand-500/30">
                            + Add
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length === 0 ? (
                  <div className="p-2">
                    <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                      <TrendingUp size={14} /> Trending Today
                    </div>
                    {trendingMedia.length > 0 ? trendingMedia.map(res => (
                      <button
                        key={res.id}
                        onClick={() => {
                          addItem(res);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group text-left"
                      >
                        <div className="w-12 h-16 rounded overflow-hidden bg-slate-800 flex-shrink-0">
                          {res.poster_path ? (
                            <img src={`${IMG_PATH}${res.poster_path}`} loading="lazy" alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700"><Film size={16} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-base truncate group-hover:text-emerald-400 transition-colors">{res.title || res.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-300">{(res.release_date || res.first_air_date || 'TBA').split('-')[0]}</span>
                            <span className="capitalize">{res.media_type === 'movie' ? 'Movie' : 'Series'}</span>
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star size={12} fill="currentColor" />
                              {res.vote_average?.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </button>
                    )) : (
                      <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-slate-600" size={32} /></div>
                    )}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-slate-500 text-sm font-medium">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="max-w-[1700px] mx-auto p-8 md:p-12 py-16 md:py-24 border-t border-white/5 text-center">
        <div className="flex flex-col items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <Zap className="w-4 h-4 md:w-5 md:h-5" fill="white" />
            <span className="text-lg md:text-xl font-black font-display tracking-tighter uppercase">StreamBase v5.1</span>
          </div>
          <p className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] md:tracking-[0.4em]">Universal Archive Management System • Built for the Elite</p>
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;
