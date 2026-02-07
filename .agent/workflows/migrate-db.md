---
description: Automatically migrate the Supabase database
---

# Auto-Migrate Database

This workflow automatically applies local migration files to the remote Supabase database using the credentials in `.env.local`.

1.  **Check for Password**: Ensure `SUPABASE_DB_PASSWORD` is set in `.env.local`.
2.  **Run Migration**: Execute the helper script.

// turbo
3.  Run the migration script:
    ```powershell
    .agent/scripts/db_migrate.ps1
    ```
