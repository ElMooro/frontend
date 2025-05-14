-- Enable Row Level Security on all tables
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pie_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_history ENABLE ROW LEVEL SECURITY;

-- Create policies for watchlists
CREATE POLICY "Users can view their own watchlists"
  ON watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlists"
  ON watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists"
  ON watchlists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists"
  ON watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for pies
CREATE POLICY "Users can view their own pies"
  ON pies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pies"
  ON pies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pies"
  ON pies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pies"
  ON pies FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for pie_items
-- Note: pie_items are linked to pies, which are linked to users
CREATE POLICY "Users can view their own pie items"
  ON pie_items FOR SELECT
  USING (
    pie_id IN (
      SELECT id FROM pies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own pie items"
  ON pie_items FOR INSERT
  WITH CHECK (
    pie_id IN (
      SELECT id FROM pies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own pie items"
  ON pie_items FOR UPDATE
  USING (
    pie_id IN (
      SELECT id FROM pies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    pie_id IN (
      SELECT id FROM pies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own pie items"
  ON pie_items FOR DELETE
  USING (
    pie_id IN (
      SELECT id FROM pies WHERE user_id = auth.uid()
    )
  );

-- Create policies for saved_calculations
CREATE POLICY "Users can view their own saved calculations"
  ON saved_calculations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved calculations"
  ON saved_calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved calculations"
  ON saved_calculations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved calculations"
  ON saved_calculations FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can manage user roles
CREATE POLICY "Service role can manage user roles"
  ON user_roles
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policies for signal_history
CREATE POLICY "Users can view signal history for their pies"
  ON signal_history FOR SELECT
  USING (
    pie_id IN (
      SELECT id FROM pies WHERE user_id = auth.uid()
    )
  );

-- Only service role can insert signal history
CREATE POLICY "Service role can insert signal history"
  ON signal_history FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');