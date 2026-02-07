$ErrorActionPreference = "Stop"

# Load environment variables from .env.local if available
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^\s*([^#=]+)\s*=\s*(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, [System.EnvironmentVariableTarget]::Process)
        }
    }
}

# Check for Password
if (-not $env:SUPABASE_DB_PASSWORD) {
    Write-Error "SUPABASE_DB_PASSWORD is not set. Please add it to your .env.local file."
    exit 1
}

# Project Reference from URL
# URL format: https://[ref].supabase.co
if ($env:NEXT_PUBLIC_SUPABASE_URL -match "https://([^.]+)\.supabase\.co") {
    $PROJECT_REF = $matches[1]
}
else {
    Write-Error "Could not extract Project Ref from NEXT_PUBLIC_SUPABASE_URL."
    exit 1
}

Write-Host "Deploying migrations to project: $PROJECT_REF"

# Construct DB URL
# Default Supabase DB connection string format
# We must escape the password to handle special characters
$EncodedPassword = [Uri]::EscapeDataString($env:SUPABASE_DB_PASSWORD)
# Priority 1: Use explicit connection string if provided
if ($env:SUPABASE_DB_URL) {
    # If the URL doesn't have sslmode, append it
    if ($env:SUPABASE_DB_URL -notmatch "sslmode=") {
        if ($env:SUPABASE_DB_URL -match "\?") { 
            $DB_URL = "$($env:SUPABASE_DB_URL)&sslmode=require" 
        }
        else { 
            $DB_URL = "$($env:SUPABASE_DB_URL)?sslmode=require" 
        }
    }
    else {
        $DB_URL = $env:SUPABASE_DB_URL
    }
}
else {
    # Priority 2: Use Supabase Connection Pooler (Europe Region)
    # User confirmed region is Europe. Common EU regions:
    # eu-central-1 (Frankfurt) - Most common
    # eu-west-1 (Ireland)
    # eu-west-2 (London)
    # We will try eu-central-1 first, then fallback.
    
    # eu-west-3 failed (Tenant not found).
    # Trying eu-west-2 (London).
    $POOLER_HOST = "aws-0-eu-west-2.pooler.supabase.com"
    $DB_USER = "postgres.$PROJECT_REF"
    $DB_URL = "postgresql://$($DB_USER):$($EncodedPassword)@$($POOLER_HOST):6543/postgres?sslmode=require"
}

# Run Migration
# We use db push to ensure schema matches migrations. 
# WARNING: This will apply changes.
Write-Host "Pushing schema changes..."
npx supabase db push --db-url "$DB_URL"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database migration completed successfully."
}
else {
    Write-Error "❌ Database migration failed."
    exit $LASTEXITCODE
}
