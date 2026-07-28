-- ============================================================
-- SUPABASE DATABASE SCHEMA FOR ETSY DESIGN QC STUDIO
-- Run this script in the Supabase SQL Editor (https://supabase.com)
-- ============================================================

-- 1. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    order_date TEXT,
    store_name TEXT,
    customer_name TEXT,
    product_title TEXT,
    product_group TEXT DEFAULT 'Stained Glass Suncatcher',
    quantity INTEGER DEFAULT 1,
    sku TEXT,
    personalization_size TEXT,
    personalization_text TEXT,
    note TEXT,
    sku_note TEXT,
    drive_link TEXT,

    has_uploaded_design BOOLEAN DEFAULT FALSE,
    uploaded_design_file TEXT,
    design_image TEXT,
    design_width INTEGER,
    design_height INTEGER,
    design_aspect_ratio NUMERIC,

    target_size_label TEXT,
    target_width INTEGER,
    target_height INTEGER,

    ratio_status TEXT DEFAULT 'NEEDS_CHECK',
    ai_status TEXT DEFAULT 'NEEDS_SCAN',
    ai_score INTEGER,
    ai_report JSONB,
    status TEXT DEFAULT 'Chờ kiểm tra',

    mockup_thumb TEXT,
    assignee TEXT DEFAULT 'Dakuho (QC SP)',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast search and sorting
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 2. Create product_groups table
CREATE TABLE IF NOT EXISTS public.product_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    base_mockup TEXT,
    tolerance_percent NUMERIC DEFAULT 1.5,
    min_dpi INTEGER DEFAULT 300,
    ai_rules_prompt TEXT,
    templates JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) & Grant Public Permissions
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_groups ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access so all staff members can collaborate without auth friction
CREATE POLICY "Allow public read access to orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access to orders" ON public.orders FOR ALL USING (true);

CREATE POLICY "Allow public read access to product_groups" ON public.product_groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access to product_groups" ON public.product_groups FOR ALL USING (true);

-- 4. Create Storage Bucket for Uploaded Artwork Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qc-designs', 'qc-designs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for qc-designs" ON storage.objects 
FOR SELECT USING (bucket_id = 'qc-designs');

CREATE POLICY "Public Upload Access for qc-designs" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'qc-designs');

CREATE POLICY "Public Update Access for qc-designs" ON storage.objects 
FOR UPDATE WITH CHECK (bucket_id = 'qc-designs');
