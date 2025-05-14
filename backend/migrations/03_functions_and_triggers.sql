-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_watchlists_updated_at
BEFORE UPDATE ON watchlists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pies_updated_at
BEFORE UPDATE ON pies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pie_items_updated_at
BEFORE UPDATE ON pie_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_calculations_updated_at
BEFORE UPDATE ON saved_calculations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_models_updated_at
BEFORE UPDATE ON ml_models
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to set default user role on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set default user role on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Function to validate pie item weights
CREATE OR REPLACE FUNCTION validate_pie_item_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight NUMERIC;
BEGIN
  -- Calculate total weight for the pie
  SELECT SUM(weight) INTO total_weight
  FROM pie_items
  WHERE pie_id = NEW.pie_id;
  
  -- Add the new item's weight
  total_weight := total_weight + NEW.weight;
  
  -- Check if total weight exceeds 100
  IF total_weight > 100 THEN
    RAISE EXCEPTION 'Total weight for pie items cannot exceed 100';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate pie item weights on insert
CREATE TRIGGER validate_pie_item_weights_on_insert
BEFORE INSERT ON pie_items
FOR EACH ROW
EXECUTE FUNCTION validate_pie_item_weights();

-- Function to check for duplicate series in a pie
CREATE OR REPLACE FUNCTION check_duplicate_pie_items()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Check if the same series already exists in the pie
  SELECT COUNT(*) INTO existing_count
  FROM pie_items
  WHERE pie_id = NEW.pie_id
    AND source = NEW.source
    AND series_id = NEW.series_id
    AND id != NEW.id;
  
  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Duplicate series in pie: % %', NEW.source, NEW.series_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for duplicate series in a pie
CREATE TRIGGER check_duplicate_pie_items_on_insert
BEFORE INSERT ON pie_items
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_pie_items();

CREATE TRIGGER check_duplicate_pie_items_on_update
BEFORE UPDATE ON pie_items
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_pie_items();