# StreamBase | Universal Media Archive 🎬

StreamBase is a premium, high-performance media tracking application built for cinephiles. It features a cinematic user experience, real-time cloud synchronization, and a robust security architecture.

![StreamBase Dashboard Mockup]()

## ✨ Core Features

### 🚀 Premium Experience
- **Cinematic Landing Page**: Built with `Framer Motion` and `Lenis` for butter-smooth scrolling and high-fidelity animations.
- **Immersive Details Drawer**: A slide-out panel that automatically syncs trailers, cast information, and trending data from TMDB.
- **Glassmorphic UI**: Modern design system utilizing translucency, vibrant gradients, and micro-interactions.

### ⌨️ Advanced Interaction
- **Omnibar Search (Cmd/Ctrl + K)**: A keyboard-first command palette with live as-you-type results and global trending spotlights.
- **Tactical Navigation**: Fully optimized for speed with keyboard shortcuts for all major actions.

### 💾 Data & Sync
- **Secure Cloud Sync**: Powered by Supabase for real-time encryption and synchronization across devices.
- **Private Tactical Logs**: Built-in encrypted notes section for personal movie reviews and observations.
- **Local-First Architecture**: Intelligent caching ensures the app remains performant even under low-latency conditions.

### 🛡️ Hardened Security
- **Schema Validation**: Powered by `Zod` to ensure all data entering the system is strictly verified.
- **API Throttling**: Intelligent rate limiting to protect against external API abuse.
- **Environment Obscurity**: Strict secret management to prevent leaking sensitive keys.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Animation**: Framer Motion, Lenis Smooth Scroll
- **Backend/Auth**: Supabase
- **Data Fetching**: TMDB API (The Movie Database)
- **Validation**: Zod
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Supabase Project
- A TMDB API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KeshavxGupta/streambase.git
   cd streambase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_TMDB_API_KEY=your_tmdb_api_key
   ```

4. **Initialize Supabase Schema**
   Use the provided `supabase_schema.sql` to set up your database tables and RLS policies.

5. **Run the Development Server**
   ```bash
   npm run dev
   ```

## 📜 License
MIT License - feel free to use this for your own tactical operations.

---
*Built with passion for the ultimate media tracking experience.*
