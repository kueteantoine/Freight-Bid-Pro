import os
import sys
from supabase import create_client, Client

def main():
    # Read .env.local
    env = {}
    with open('.env.local', 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                env[key] = value.strip('"').strip("'")

    url = env.get('NEXT_PUBLIC_SUPABASE_URL')
    key = env.get('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY') or env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not url or not key:
        print("Missing Supabase URL or Key")
        return

    supabase: Client = create_client(url, key)

    try:
        # Query information_schema.columns
        res = supabase.rpc('exec_sql', {'sql': "SELECT column_name FROM information_schema.columns WHERE table_name = 'disputes' AND table_schema = 'public'"}).execute()
        
        print(f"Columns in 'disputes': {res.data}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
