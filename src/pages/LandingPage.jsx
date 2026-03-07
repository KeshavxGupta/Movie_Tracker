import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PlayCircle, Star, Tv, Clapperboard, ChevronRight, Flame, Layers, Plus, Minus, Quote, CheckCircle2, Search, Zap, History } from 'lucide-react';
import Lenis from 'lenis';

// --- Premium Interaction Helpers ---

const Magnetic = ({ children, strength = 0.5 }) => {
    const ref = useRef(null);
    const x = useSpring(0, { stiffness: 150, damping: 15 });
    const y = useSpring(0, { stiffness: 150, damping: 15 });

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        x.set((clientX - centerX) * strength);
        y.set((clientY - centerY) * strength);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x, y }}
        >
            {children}
        </motion.div>
    );
};

const SpotlightCard = ({ children, className }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative overflow-hidden ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`,
                }}
            />
            {children}
        </div>
    );
};

const LandingPage = () => {
    // Initialize Lenis smooth scroll
    useEffect(() => {
        const lenis = new Lenis({
            autoRaf: true,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    const { scrollY } = useScroll();

    // High-performance Parallax for background blobs
    const bgY1 = useTransform(scrollY, [0, 1000], [0, 300]);
    const bgY2 = useTransform(scrollY, [0, 1000], [0, -250]);
    const bgY3 = useTransform(scrollY, [0, 1000], [0, 400]);

    // High-performance Hero fade & scale
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const heroScale = useTransform(scrollY, [0, 500], [1, 0.9]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    const scrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-brand-500/30 font-sans tracking-tight">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 100, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        x: [0, -100, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-brand-600/10 rounded-full blur-[120px]"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 font-sans">
                {/* Navbar */}
                <motion.nav
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-500 p-2.5 rounded-2xl shadow-lg shadow-brand-500/20">
                            <Clapperboard className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight font-display text-white">
                            StreamBase
                        </span>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex items-center gap-6">
                            {[
                                { name: 'Bento', id: 'bento' },
                                { name: 'Squad', id: 'reviews' },
                                { name: 'Briefing', id: 'briefing' }
                            ].map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => scrollTo(item.id)}
                                    className="text-[10px] font-black text-white/40 hover:text-brand-400 transition-colors uppercase tracking-[0.3em]"
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                        <Magnetic>
                            <Link
                                to="/login"
                                className="text-sm font-black text-white bg-white/5 border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest"
                            >
                                Sign In
                            </Link>
                        </Magnetic>
                    </div>
                </motion.nav>

                {/* Hero Section */}
                <motion.main
                    style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
                    className="max-w-7xl mx-auto px-6 pt-24 pb-48 flex flex-col items-center text-center origin-top relative overflow-visible"
                >
                    {/* Floating 3D Cards Decoration */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible hidden lg:block">
                        <motion.div
                            animate={{ y: [0, -20, 0], rotate: [-2, 2, -2] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -left-20 top-20 w-64 h-80 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <img src="/dashboard_grid.png" className="w-full h-full object-cover" alt="Dashboard Grid" />
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 20, 0], rotate: [2, -2, 2] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -right-20 top-40 w-48 h-64 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <img src="/dashboard_omnibar.png" className="w-full h-full object-cover" alt="Dashboard Omnibar" />
                        </motion.div>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-5xl flex flex-col items-center relative z-10"
                    >
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 px-4 py-2 mb-10 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black tracking-[0.3em] uppercase backdrop-blur-md"
                        >
                            Universal Media Protocol v2.5
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-5xl md:text-[9rem] font-black font-display tracking-tight mb-8 leading-[0.85] text-white"
                        >
                            CINEMATIC<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-200 to-white/20">
                                CONTROL.
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-lg md:text-xl text-slate-400 mb-14 max-w-2xl leading-relaxed font-medium"
                        >
                            The ultimate tactical interface for tracking your media evolution.
                            Archive movies, monitor series, and discover the next masterpiece.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
                        >
                            <Magnetic strength={0.3}>
                                <Link
                                    to="/app"
                                    className="group relative inline-flex items-center justify-center w-full sm:w-auto px-12 py-6 bg-brand-500 font-black text-white text-sm uppercase tracking-[0.25em] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.6)]"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Initialize App
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Link>
                            </Magnetic>
                            <button
                                onClick={() => scrollTo('briefing')}
                                className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-6 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md font-black text-white text-xs uppercase tracking-widest rounded-2xl transition-all duration-300"
                            >
                                Secure Briefing
                            </button>
                        </motion.div>
                    </motion.div>
                </motion.main>

                {/* Interactive Bento Features */}
                <section id="bento" className="max-w-7xl mx-auto px-6 py-20 md:py-40">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <SpotlightCard className="md:col-span-8 bg-slate-900 border border-white/10 rounded-[3rem] p-12 flex flex-col justify-between group cursor-pointer hover:border-brand-500/30 transition-colors">
                            <Link to="/app" className="absolute inset-0 z-20" />
                            <div>
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-8 border border-indigo-500/30">
                                    <Search className="text-indigo-400" size={32} />
                                </div>
                                <h3 className="text-4xl font-black font-display mb-4 text-white uppercase tracking-tight">Omnibar Intel</h3>
                                <p className="text-xl text-slate-400 max-w-md">Search across millions of titles with the tactical keyboard-first interface.</p>
                            </div>
                            <div className="mt-12 w-full h-64 bg-slate-950 rounded-2xl border border-white/5 overflow-hidden group-hover:border-indigo-500/30 transition-colors">
                                <img
                                    src="/dashboard_omnibar.png"
                                    className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                                    alt="Omnibar Search"
                                />
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="md:col-span-4 bg-brand-500 rounded-[3rem] p-12 flex flex-col justify-between text-white group shadow-[0_0_100px_-20px_rgba(99,102,241,0.5)] cursor-pointer hover:scale-[1.02] transition-transform">
                            <Link to="/app" className="absolute inset-0 z-20" />
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8">
                                <Zap className="text-white" size={32} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black font-display mb-4 uppercase tracking-tight">Real-Time Sync</h3>
                                <p className="text-lg text-white/80">Your media life, perfectly synchronized across all operational sectors.</p>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="md:col-span-4 bg-slate-900 border border-white/10 rounded-[3rem] p-12 flex flex-col justify-between group cursor-pointer hover:border-brand-500/30 transition-colors">
                            <Link to="/app" className="absolute inset-0 z-20" />
                            <History className="text-indigo-400 mb-8" size={48} />
                            <div>
                                <h3 className="text-3xl font-black font-display mb-4 text-white uppercase tracking-tight">Timeline Log</h3>
                                <p className="text-slate-400">Chronological history of your cinematic evolution.</p>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="md:col-span-8 bg-slate-900 border border-white/10 rounded-[3rem] p-12 flex flex-row items-center gap-12 group cursor-pointer hover:border-brand-500/30 transition-colors">
                            <Link to="/app" className="absolute inset-0 z-20" />
                            <div className="flex-1">
                                <h3 className="text-4xl font-black font-display mb-4 text-white uppercase tracking-tight">Tactical Notes</h3>
                                <p className="text-xl text-slate-400">Encrypted private observations for every asset in your library.</p>
                            </div>
                            <div className="w-64 h-full bg-slate-950/50 rounded-2xl border border-white/5 hidden sm:block overflow-hidden p-4">
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-white/5 rounded" />
                                    <div className="h-2 w-3/4 bg-white/5 rounded" />
                                    <div className="h-2 w-1/2 bg-white/5 rounded" />
                                </div>
                            </div>
                        </SpotlightCard>
                    </div>
                </section>

                {/* Testimonials */}
                <section id="reviews" className="relative py-20 md:py-40 z-10">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-12 md:mb-24"
                        >
                            <h2 className="text-4xl md:text-7xl font-black font-display mb-6 md:mb-8 uppercase tracking-tighter">SQUAD INTEL</h2>
                            <p className="text-lg md:text-xl text-slate-400 font-medium">Join thousands of operators organizing their cinematic objectives.</p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <TestimonialCard
                                quote="StreamBase is the tactical advantage I needed for my anime archives. Zero friction, total control."
                                author="Kenji Sato"
                                role="Lead Archivist"
                                delay={0.1}
                            />
                            <TestimonialCard
                                quote="The UI doesn't just look good; it feels like future technology. The Omnibar is a game changer."
                                author="Rhea Miller"
                                role="Tech Critic"
                                delay={0.2}
                            />
                            <TestimonialCard
                                quote="Seamless sync across my command centers. Finally, a tracker that respects the craft."
                                author="David Vance"
                                role="Field Operative"
                                delay={0.3}
                            />
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="briefing" className="relative max-w-4xl mx-auto px-6 py-20 md:py-40 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12 md:mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-black font-display mb-8 uppercase tracking-tighter">BRIEFING</h2>
                    </motion.div>

                    <div className="space-y-4">
                        <FaqItem
                            question="Is StreamBase open for all operators?"
                            answer="Affirmative. The core StreamBase architecture is free to access for all cinematic archivists."
                        />
                        <FaqItem
                            question="Does it host operational media?"
                            answer="Negative. StreamBase is a strategic indexing tool. We provide data, metadata, and state management via TMDB protocols."
                        />
                        <FaqItem
                            question="Mobile deployment status?"
                            answer="StreamBase is a high-performance PWA. Deploy to your home screen for full mobile tactical immersion."
                        />
                    </div>
                </section>

                {/* Massive CTA Section */}
                <section className="relative py-32 md:py-60 overflow-hidden text-center">
                    <div className="absolute inset-0 bg-brand-500/5 blur-[120px] rounded-full scale-50"></div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 max-w-5xl mx-auto px-6"
                    >
                        <h2 className="text-5xl md:text-[10rem] font-black font-display mb-12 uppercase tracking-tighter leading-none">
                            ARCHIVE<br />THE WORLD.
                        </h2>
                        <Magnetic strength={0.2}>
                            <Link
                                to="/app"
                                className="inline-flex items-center justify-center px-16 py-8 bg-white text-slate-950 font-black text-2xl uppercase tracking-widest rounded-[2rem] hover:bg-slate-200 transition-all shadow-[0_40px_100px_-20px_rgba(255,255,255,0.4)] hover:scale-110 duration-500"
                            >
                                Launch Operation
                            </Link>
                        </Magnetic>
                    </motion.div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/5 py-24 px-6 text-center text-slate-500 bg-slate-950">
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Clapperboard className="w-8 h-8 text-brand-500" />
                            <span className="font-black font-display text-white text-3xl tracking-tight uppercase">StreamBase</span>
                        </div>
                        <p className="font-medium text-slate-400 max-w-sm">Built for the elite cinematic operative. Protocol v2.5.4</p>
                        <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mt-8">
                            <Link to="/privacy" className="hover:text-brand-400 transition-colors">Privacy</Link>
                            <Link to="/licensing" className="hover:text-brand-400 transition-colors">Licensing</Link>
                            <Link to="/app" className="hover:text-brand-400 transition-colors">Archive</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const TestimonialCard = ({ quote, author, role, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay }}
        className="p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] bg-slate-900/50 border border-white/5 relative group hover:bg-slate-900 transition-all duration-500"
    >
        <Quote className="absolute top-10 right-10 w-16 h-16 text-brand-500/5 group-hover:text-brand-500/10 transition-colors" />
        <p className="text-xl text-slate-300 font-medium leading-relaxed mb-10 relative z-10 tracking-tight italic">
            &quot;{quote}&quot;
        </p>
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center font-black text-xl text-white shadow-lg">
                {author[0]}
            </div>
            <div>
                <div className="font-black text-white uppercase tracking-wider">{author}</div>
                <div className="text-[10px] font-black text-brand-400 uppercase tracking-widest">{role}</div>
            </div>
        </div>
    </motion.div>
);

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            onClick={() => setIsOpen(!isOpen)}
            className="border-b border-white/5 overflow-hidden cursor-pointer group"
        >
            <div className="py-8 flex items-center justify-between">
                <h3 className={`text-2xl font-black font-display uppercase tracking-tight transition-colors ${isOpen ? 'text-brand-400' : 'text-slate-300 group-hover:text-white'}`}>{question}</h3>
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className="p-2 rounded-xl bg-white/5 text-slate-500"
                >
                    <Plus size={24} />
                </motion.div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="pb-12 text-lg text-slate-400 leading-relaxed font-medium">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LandingPage;
