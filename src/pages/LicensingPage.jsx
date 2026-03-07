import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronLeft, Copyright } from 'lucide-react';
import { Link } from 'react-router-dom';

const LicensingPage = () => {
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
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <FileText size={18} strokeWidth={3} />
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-4xl mx-auto px-6 pt-40 pb-32 space-y-20">
                {/* Header Section */}
                <header className="space-y-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block px-4 py-1.5 rounded-full glass border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        Legal Directive Gamma
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black font-display text-white tracking-tighter"
                    >
                        Licensing <span className="text-emerald-400">& Compliance</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 font-medium max-w-xl mx-auto text-sm md:text-base"
                    >
                        Information regarding data sources, original creators, and intellectual property.
                    </motion.p>
                </header>

                {/* Content Sections */}
                <section className="space-y-16">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black font-display text-white border-l-4 border-emerald-500 pl-6">Data Attribution</h2>
                        <div className="glass p-8 rounded-3xl border-white/5 space-y-6 leading-relaxed">
                            <p>
                                StreamBase utilizes <span className="text-white font-bold">The Movie Database (TMDB) API</span>
                                as its primary source of truth for media, metadata, and visual assets (backdrops, posters).
                            </p>
                            <div className="bg-black/30 p-6 rounded-2xl border border-white/5 space-y-4 text-sm">
                                <p className="italic">
                                    "This product uses the TMDB API but is not endorsed or certified by TMDB."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Copyright size={18} />
                                    </div>
                                    <p className="opacity-70 font-bold uppercase tracking-widest text-[10px]">Reference: TMDB.org</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-black font-display text-white border-l-4 border-emerald-500 pl-6">Open Source Libraries</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="glass p-8 rounded-3xl border-white/5 space-y-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-xs">Framework & Logic</h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    Built using React, Framer Motion, and Lucide React. All logic and custom components
                                    are released under the standard license terms.
                                </p>
                            </div>
                            <div className="glass p-8 rounded-3xl border-white/5 space-y-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-xs">Styling Infrastructure</h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    Utilizes Tailwind CSS for the core layout engine and custom glassmorphism layers.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-black font-display text-white border-l-4 border-emerald-500 pl-6">Brand Identity</h2>
                        <div className="glass p-8 rounded-3xl border-white/5 space-y-6 leading-relaxed">
                            <p>
                                The "StreamBase" brand, including its logo, typography, and tactical visual identity,
                                is the intellectual property of the StreamBase development team.
                            </p>
                            <p>
                                Unauthorized reproduction or duplication of the application's unique design system
                                and interaction models is prohibited.
                            </p>
                        </div>
                    </div>
                </section>

                <footer className="pt-20 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                        Deployment Protocol: StreamBase v1.0
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default LicensingPage;
