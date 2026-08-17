# Database Setup and Migrations

## Prerequisites

1. Ensure you have PostgreSQL client (`psql`) installed
2. Create a `.env` file in the project root with the following variables:
   ```
   SUPABASE_DB_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres
   ```

## Running Migrations

1. Make the migration script executable:
   ```bash
   chmod +x scripts/run_migrations.sh
   ```

2. Run the migrations:
   ```bash
   ./scripts/run_migrations.sh
   ```

## Database Schema

The database consists of the following main tables:

### `public.issues`
- Tracks all reported issues
- Contains fields for title, description, category, status, location, etc.
- References `auth.users` for the reporter (`user_id`) and assignee (`assigned_to`)

### `public.issue_votes`
- Tracks upvotes on issues
- Implements a many-to-many relationship between users and issues

### `public.comments`
- Stores comments on issues
- References both `auth.users` and `public.issues`

## Row Level Security (RLS)

RLS is enabled on all tables with the following policies:

- Users can only see and modify their own data
- Public read access for issues and comments
- Only admins can update issues assigned to others

## Common Issues

### "Could not find the table 'public.issues' in the schema cache"
This usually means the database migrations haven't been run or failed. Try:
1. Running the migrations again
2. Checking the database connection string
3. Verifying the user has sufficient permissions

### "Foreign key constraint violation"
This happens when trying to reference a non-existent user. Ensure:
1. The user exists in `auth.users`
2. The `user_id` in the issues table matches a valid user ID
3. The foreign key constraints are properly set up

## Resetting the Database

To start fresh:

1. Drop and recreate the database
2. Run all migrations
3. Reseed the test data
