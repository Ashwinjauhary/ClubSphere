# Legacy Migrations Archive

This folder contains 50+ standalone SQL scripts that were previously polluting the project root directory.
These scripts were executed manually during the development of ClubSphere.

**Important Notes:**
1. These are NOT Supabase CLI format migrations. They are raw SQL scripts.
2. The `supabase_schema.sql` file contains the primary schema dump.
3. For future schema changes, please use `supabase migration new <name>` and apply them via the CLI rather than running loose scripts.
