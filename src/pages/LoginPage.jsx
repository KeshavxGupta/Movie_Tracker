import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Zap, Loader2, Mail, Lock, ChevronLeft, Clapperboard } from 'lucide-react';

const LoginPage = () => {
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/app';

    const handleAuth = async (e) => {
        e.preventDefault();
        if (!supabase) {
            toast.error('Supabase not configured. Please check your environment variables.');
            return;
        }

        setIsAuthLoading(true);
        try {
            if (authMode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email: authEmail,
                    password: authPassword,
                });
                if (error) throw error;
                toast.success('Registration successful! Please check your email to verify.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password: authPassword,
                });
                if (error) throw error;
                toast.success('Authentication successful. Redirecting...');
                navigate(from, { replace: true });
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 flex items-center justify-center relative overflow-hidden">
            {/* Dynamic Backgrounds matching landing page */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-8 group">
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Back to stream
                    </Link>

                    <div className="flex items-center gap-3 justify-center mb-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Clapperboard className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-center text-white tracking-tight">
                        {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-center text-slate-400 mt-2">
                        Securely sync your cinematic journey across devices.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
                >
                    {/* Subtle animated border top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="email"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                    placeholder="you@cinemaphile.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="password"
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isAuthLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl mt-4 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] active:scale-[0.98]"
                        >
                            {isAuthLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    {authMode === 'login' ? 'Access Archive' : 'Create Secure Profile'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                            className="text-sm font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                            {authMode === 'login'
                                ? "Don't have an account? Sign up"
                                : "Already tracking? Log in"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
