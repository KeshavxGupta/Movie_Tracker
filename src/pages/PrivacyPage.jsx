import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-brand-500/30 selection:text-white overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
            <div className="fixed inset-0 film-grain opacity-[0.03] pointer-events-none" />
            <div className="fixed inset-0 vignette opacity-60 pointer-events-none" />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-10 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent">
                <Link to="/" className="group flex items-center gap-3 glass px-5 py-2.5 rounded-2xl hover:bg-white/5 transition-all active:scale-95 border border-white/10">
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Back to Archive</span>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                        <Shield size={18} strokeWidth={3} />
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-4xl mx-auto px-6 pt-40 pb-32 space-y-20">
                {/* Header Section */}
                <header className="space-y-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block px-4 py-1.5 rounded-full glass border-brand-500/40 text-brand-400 text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        Security Protocol Alpha
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black font-display text-white tracking-tighter"
                    >
                        Privacy <span className="text-brand-400">Policy</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 font-medium max-w-xl mx-auto text-sm md:text-base"
                    >
                        Transparency in data handling for the next generation of media archives.
                    </motion.p>
                </header>

                {/* Content Sections */}
                <section className="space-y-16">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black font-display text-white border-l-4 border-brand-500 pl-6">Core Ethics</h2>
                        <div className="glass p-8 rounded-3xl border-white/5 space-y-6 leading-relaxed">
                            <p>
                                At StreamBase, we believe that your media habits are personal. We've built this system to track
                                your collection, not your identity. Our privacy protocol is designed to be minimal,
                                transparent, and secure.
                            </p>
                            <p>
                                We do not sell your data. We do not use it for targeted advertising. We only store
                                what is necessary for the application to function: your library preferences and
                                authentication details.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-black font-display text-white border-l-4 border-brand-500 pl-6">Data Collection</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="glass p-8 rounded-3xl border-white/5 space-y-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-xs">Essential Logs</h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    We synchronize your media library (movies, series, episodes) and watch status
                                    to ensure a seamless experience across all your authorized devices.
                                </p>
                            </div>
                            <div className="glass p-8 rounded-3xl border-white/5 space-y-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-xs">Security Identity</h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    Your email and hashed credentials are encrypted and managed via Supabase,
                                    ensuring that only you can access your private archive.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-black font-display text-white border-l-4 border-brand-500 pl-6">Third Party Systems</h2>
                        <div className="glass p-8 rounded-3xl border-white/5 space-y-6 leading-relaxed">
                            <p>
                                We utilize TMDB (The Movie Database) for metadata and visuals. When you search for media,
                                queries are sent to their servers. We do not send your personal profile data to these providers.
                            </p>
                            <p>
                                Supabase provides our backend infrastructure. All data storage and authentication
                                flows through their secure, encrypted channels.
                            </p>
                        </div>
                    </div>
                </section>

                <footer className="pt-20 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                        Operational Update: March 2026
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default PrivacyPage;
