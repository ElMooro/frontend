-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  series_id TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pies table
CREATE TABLE IF NOT EXISTS pies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'black_swan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pie_items table
CREATE TABLE IF NOT EXISTS pie_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pie_id UUID NOT NULL REFERENCES pies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  series_id TEXT NOT NULL,
  weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 100),
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_calculations table
CREATE TABLE IF NOT EXISTS saved_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  formula TEXT NOT NULL,
  input_series JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create ml_models table to track model versions and training history
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL,
  description TEXT,
  training_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signal_history table to track signal predictions
CREATE TABLE IF NOT EXISTS signal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pie_id UUID NOT NULL REFERENCES pies(id) ON DELETE CASCADE,
  probability NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS watchlists_user_id_idx ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS pies_user_id_idx ON pies(user_id);
CREATE INDEX IF NOT EXISTS pie_items_pie_id_idx ON pie_items(pie_id);
CREATE INDEX IF NOT EXISTS saved_calculations_user_id_idx ON saved_calculations(user_id);
CREATE INDEX IF NOT EXISTS signal_history_pie_id_idx ON signal_history(pie_id);
CREATE INDEX IF NOT EXISTS signal_history_prediction_date_idx ON signal_history(prediction_date);