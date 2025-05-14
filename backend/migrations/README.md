# Database Setup Instructions

This directory contains SQL scripts to set up the database for the application.

## Setting up the database in Supabase

1. Log in to your Supabase account and go to your project dashboard.
2. Click on the "SQL Editor" tab in the left sidebar.
3. Click on "New Query" to create a new SQL query.
4. Copy the contents of the `supabase_setup.sql` file and paste it into the SQL editor.
5. Click "Run" to execute the SQL script.

This will create all the necessary tables and insert some sample data for testing.

## Tables Created

- `watchlists`: Stores user watchlist items
- `pies`: Stores signal pies
- `pie_items`: Stores items within signal pies
- `saved_calculations`: Stores user-saved calculations
- `user_roles`: Stores user roles (user, admin)
- `ml_models`: Tracks ML model versions and training history
- `signal_history`: Tracks signal predictions

## Sample Data

The script also inserts some sample data for testing:

- 3 signal pies (buy, sell, black swan)
- 9 pie items (3 for each pie)
- 5 watchlist items
- 2 saved calculations

## Troubleshooting

If you encounter any issues with the script:

1. Make sure you have the necessary permissions to create tables in your Supabase project.
2. Check if any of the tables already exist. If they do, you may need to drop them first or use `IF NOT EXISTS` in the CREATE TABLE statements.
3. If you're getting foreign key constraint errors, make sure you're creating the tables in the correct order.

## Manual Setup

If you prefer to set up the database manually:

1. Create each table individually using the CREATE TABLE statements in the `supabase_setup.sql` file.
2. Create the indexes using the CREATE INDEX statements.
3. Insert the sample data using the INSERT statements.

## Next Steps

After setting up the database, you'll need to:

1. Update the `.env` file in the backend directory with your Supabase URL and API keys.
2. Update the `.env` file in the frontend directory with your Supabase URL and anon key.
3. Start the backend server: `npm run start`
4. Start the frontend server: `npm run dev`