-- Run this in your Supabase SQL Editor to set up the StreamBase Archive

-- 1. Create the items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  rating FLOAT,
  episodes INTEGER DEFAULT 0,
  total_episodes INTEGER DEFAULT 0,
  poster TEXT,
  backdrop TEXT,
  year TEXT,
  overview TEXT,
  added_at BIGINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 3. Create policies so users can only see/edit their own data
CREATE POLICY "Users can view their own items" 
  ON items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" 
  ON items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
  ON items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" 
  ON items FOR DELETE 
  USING (auth.uid() = user_id);
