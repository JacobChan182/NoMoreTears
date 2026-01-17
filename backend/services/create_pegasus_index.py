from twelvelabs import TwelveLabs
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("TWELVELABS_API_KEY")
client = TwelveLabs(api_key=API_KEY)

print("Creating a new index with Pegasus 1.2 support...")

# Using the models suggested by the error message
index = client.indexes.create(
    index_name="UofTHacks_Pegasus_Index",
    models=[
        {
            "model_name": "marengo2.7", # Upgraded from 2.6
            "model_options": ["visual", "conversation", "text_in_video"]
        },
        {
            "model_name": "pegasus1.2", # Upgraded from 1.1
            "model_options": ["visual", "conversation"]
        }
    ]
)

print(f"✅ Success! New Index ID: {index.id}")
print("Update your .env file with this new INDEX_ID and restart your server.")