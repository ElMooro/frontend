-- This script can be run directly in the Supabase SQL Editor
-- It creates all the necessary tables for the application

-- Set the correct schema
SET search_path TO public;

-- Create watchlists table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  series_id TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pies table
CREATE TABLE IF NOT EXISTS public.pies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'black_swan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pie_items table
CREATE TABLE IF NOT EXISTS public.pie_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pie_id UUID NOT NULL REFERENCES public.pies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  series_id TEXT NOT NULL,
  weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 100),
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_calculations table
CREATE TABLE IF NOT EXISTS public.saved_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  formula TEXT NOT NULL,
  input_series JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create ml_models table to track model versions and training history
CREATE TABLE IF NOT EXISTS public.ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  description TEXT,
  training_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signal_history table to track signal predictions
CREATE TABLE IF NOT EXISTS public.signal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pie_id UUID NOT NULL REFERENCES public.pies(id) ON DELETE CASCADE,
  probability NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS watchlists_user_id_idx ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS pies_user_id_idx ON public.pies(user_id);
CREATE INDEX IF NOT EXISTS pie_items_pie_id_idx ON public.pie_items(pie_id);
CREATE INDEX IF NOT EXISTS saved_calculations_user_id_idx ON public.saved_calculations(user_id);
CREATE INDEX IF NOT EXISTS signal_history_pie_id_idx ON public.signal_history(pie_id);
CREATE INDEX IF NOT EXISTS signal_history_prediction_date_idx ON public.signal_history(prediction_date);

-- Insert some sample data for testing
INSERT INTO public.pies (id, user_id, name, type, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'mock-user-id', 'Market Crash Detector', 'black_swan', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'mock-user-id', 'Bull Market Signal', 'buy', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'mock-user-id', 'Bear Market Signal', 'sell', NOW(), NOW());

-- Insert pie items
INSERT INTO public.pie_items (pie_id, source, series_id, weight, label, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'fred', 'VIXCLS', 40, 'CBOE Volatility Index', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'fred', 'T10Y2Y', 30, '10-Year Treasury Constant Maturity Minus 2-Year', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'fred', 'BAMLH0A0HYM2', 30, 'ICE BofA US High Yield Index Option-Adjusted Spread', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'fred', 'UMCSENT', 30, 'University of Michigan: Consumer Sentiment', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'fred', 'INDPRO', 40, 'Industrial Production Index', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'fred', 'RSAFS', 30, 'Advance Retail Sales', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'fred', 'UNRATE', 40, 'Unemployment Rate', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'fred', 'CPIAUCSL', 30, 'Consumer Price Index', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'fred', 'HOUST', 30, 'Housing Starts', NOW(), NOW());

-- Insert watchlist items
INSERT INTO public.watchlists (user_id, source, series_id, label, created_at, updated_at)
VALUES
  ('mock-user-id', 'fred', 'GDP', 'US Gross Domestic Product', NOW(), NOW()),
  ('mock-user-id', 'fred', 'UNRATE', 'Unemployment Rate', NOW(), NOW()),
  ('mock-user-id', 'fred', 'CPIAUCSL', 'Consumer Price Index', NOW(), NOW()),
  ('mock-user-id', 'fred', 'FEDFUNDS', 'Federal Funds Rate', NOW(), NOW()),
  ('mock-user-id', 'fred', 'HOUST', 'Housing Starts', NOW(), NOW());

-- Insert saved calculations
INSERT INTO public.saved_calculations (user_id, name, formula, input_series, created_at, updated_at)
VALUES
  ('mock-user-id', 'GDP Growth Rate', 'series1 / series1.shift(1) - 1', 
   '[{"key": "series1", "source": "fred", "series_id": "GDP", "label": "US Gross Domestic Product"}]'::jsonb, 
   NOW(), NOW()),
  ('mock-user-id', 'Unemployment vs Inflation', 'series1 * series2', 
   '[{"key": "series1", "source": "fred", "series_id": "UNRATE", "label": "Unemployment Rate"}, 
     {"key": "series2", "source": "fred", "series_id": "CPIAUCSL", "label": "Consumer Price Index"}]'::jsonb, 
   NOW(), NOW());

-- Grant permissions for anon and authenticated roles
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_history ENABLE ROW LEVEL SECURITY;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables to anon and authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant insert, update, delete on tables to authenticated
GRANT INSERT, UPDATE, DELETE ON public.watchlists TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pie_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.saved_calculations TO authenticated;

-- Create policies for row level security
CREATE POLICY watchlists_policy ON public.watchlists FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY pies_policy ON public.pies FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY pie_items_policy ON public.pie_items FOR ALL TO authenticated USING (pie_id IN (SELECT id FROM public.pies WHERE user_id = auth.uid()));
CREATE POLICY saved_calculations_policy ON public.saved_calculations FOR ALL TO authenticated USING (user_id = auth.uid());