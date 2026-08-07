import os
from dotenv import load_dotenv
from supabase import create_client, Client
from config import Config

# Load environment variables from .env file
load_dotenv()

url: str = Config.SUPABASE_URL or os.environ.get("SUPABASE_URL")
key: str = Config.SUPABASE_KEY or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY is not set. Please check your .env file.")

supabase: Client = create_client(url, key) if url and key else None
