-- Social Feed Feature Migration
-- Creates posts and comments tables for social feed functionality
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CREATE POSTS TABLE
-- ============================================================================

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE COMMENTS TABLE
-- ============================================================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 300),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_posts_user ON public.posts(user_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post ON public.comments(post_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);
CREATE INDEX idx_comments_created ON public.comments(created_at DESC);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR POSTS
-- ============================================================================

-- Anyone authenticated can read all posts
CREATE POLICY "Authenticated users can read posts" ON public.posts
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own posts
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR COMMENTS
-- ============================================================================

-- Anyone authenticated can read all comments
CREATE POLICY "Authenticated users can read comments" ON public.comments
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- DONE!
-- ============================================================================
