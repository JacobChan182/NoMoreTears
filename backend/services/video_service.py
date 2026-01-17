import traceback
import os
from pathlib import Path
from dotenv import load_dotenv
from twelvelabs import TwelveLabs

# 1. Setup and Load
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=dotenv_path)

# 2. Get variables once at startup
API_KEY = os.getenv("TWELVELABS_API_KEY")
INDEX_ID = os.getenv("TWELVELABS_INDEX_ID")

# 3. Validation - This will stop the server immediately if the .env is wrong
if not API_KEY or not INDEX_ID:
    print(f"❌ ERROR: Missing credentials!")
    print(f"API_KEY: {'Found' if API_KEY else 'MISSING'}")
    print(f"INDEX_ID: {'Found' if INDEX_ID else 'MISSING'}")
    raise ValueError("Check your .env file in the backend directory.")

client = TwelveLabs(api_key=API_KEY)

def start_video_indexing(video_url):
    try:
        # 4. Use the INDEX_ID we verified above
        print(f"DEBUG: Starting task for Index ID: {INDEX_ID}")
        
        task = client.tasks.create(
            index_id=INDEX_ID,  # Use the variable directly
            video_url=video_url
        )
        print(f"✅ Indexing started. Task ID: {task.id}")
        return task.id
    except Exception as e:
        traceback.print_exc()
        return None