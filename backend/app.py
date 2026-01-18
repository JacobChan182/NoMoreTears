from flask import Flask, jsonify, request
from flask_cors import CORS
from twelvelabs import TwelveLabs
import os
from dotenv import load_dotenv
from backboard.client import BackboardClient
import asyncio
from pymongo import MongoClient
from datetime import datetime, UTC
import traceback
from uuid import uuid4
from services.video_service import start_video_indexing, index_and_segment, verify_index_configuration
import json

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Allow all origins for development (adjust for prod)
    CORS(app)

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = jsonify({"status": "ok"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
            return response

    # In-memory fallback when MongoDB is not configured
    in_memory_sessions = {}

    # --- BEGIN: Mongo init ---
    MONGODB_URI = os.getenv("MONGODB_URI")
    if not MONGODB_URI:
        print("Warning: MONGODB_URI not set. Chat history will not be saved.")
        mongo_client = None
        db = None
    else:
        try:
            mongo_client = MongoClient(
                MONGODB_URI,
                tlsAllowInvalidCertificates=True
            )
            mongo_client.admin.command('ping')
            db = mongo_client["test"]
            print("✅ MongoDB connected successfully")
        except Exception as e:
            print(f"⚠️  MongoDB connection failed: {e}")
            print("⚠️  Chat history will not be saved.")
            mongo_client = None
            db = None
    # --- END: Mongo init ---

    # --- BEGIN: TwelveLabs init ---
    TWELVELABS_API_KEY = os.getenv("TWELVELABS_API_KEY")
    if not TWELVELABS_API_KEY:
        raise RuntimeError("Missing TWELVE_LABS_API_KEY env var")
    tl = TwelveLabs(api_key=TWELVELABS_API_KEY)
    # --- END: TwelveLabs init ---

    # Generate educational content (quiz/summary)
    @app.post('/api/backboard/generate-content')
    async def generate_educational_content():
        raw_data = request.get_data(as_text=True)
        print(f"\n📥 RAW INCOMING DATA: {raw_data}")

        try:
            data = request.get_json(force=True)
            print(f"📦 PARSED JSON: {data}")
        except Exception as e:
            print(f"❌ JSON PARSE ERROR: {e}")
            traceback.print_exc()
            return jsonify({"status": "error", "message": "Invalid JSON"}), 400

        lecture_id = data.get("lecture_id")
        video_id = data.get("video_id")
        video_title = data.get("video_title", "Untitled Lecture")
        content_type = data.get("content_type", "quiz")
        topics = data.get("topics", [])

        print(f"🔎 Extracted lecture_id: {lecture_id}")
        print(f"🔎 Extracted video_id: {video_id}")
        print(f"🔎 Extracted video_title: {video_title}")

        # Build topics context
        topics_text = None
        if not topics and lecture_id:
            try:
                from services.data_service import get_segments_for_quiz
                topics_text = get_segments_for_quiz(db, lecture_id)
                preview = topics_text[:200] + "…" if isinstance(topics_text, str) and len(topics_text) > 200 else topics_text
                print(f"📄 Topics from DB: {preview}")
            except Exception as e:
                print(f"❌ Error fetching segments: {e}")
                traceback.print_exc()
                topics_text = f"Error fetching lecture content: {str(e)}"
        elif topics:
            topics_text = "\n\n".join([
                f"Topic: {t.get('title')}\nDescription: {t.get('description')}"
                for t in topics
            ])

        # Validate content context
        invalid_markers = (
            "No content found",
            "No lecture ID",
            "Database not connected",
            "Error",
            "ERROR:",  # NEW: catch explicit error messages
            "TwelveLabs data is still processing",  # NEW
            "No segments found for lecture",        # NEW
        )
        if not topics_text or any(m in topics_text for m in invalid_markers):
            error_msg = topics_text if topics_text else "No content found"
            print(f"❌ Content error: {error_msg}")
            return jsonify({"status": "error", "message": error_msg}), 400

        api_key = os.getenv("BACKBOARD_API_KEY")
        if not api_key:
            print("❌ Missing BACKBOARD_API_KEY")
            return jsonify({"status": "error", "message": "Missing BACKBOARD_API_KEY"}), 500

        # System prompt/task
        if content_type == "quiz":
            system_prompt = "You are an expert educational content creator."
            task = "Generate 3-5 multiple choice quiz questions. Include answers."
        elif content_type == "summary":
            system_prompt = "You are an expert summarizer."
            task = "Create a concise summary."
        else:
            system_prompt = "You are a helpful tutor."
            task = "Provide study tips."

        full_prompt = f"Video: {video_title}\n\nTopics:\n{topics_text}\n\nTask: {task}"

        # Call Backboard
        async def run_generation():
            client = BackboardClient(api_key=api_key)
            assistant = await client.create_assistant(
                name="Educational Content Generator",
                description=system_prompt,
            )
            thread = await client.create_thread(assistant.assistant_id)
            response = await client.add_message(
                thread_id=thread.thread_id,
                content=full_prompt,
                llm_provider="openai",
                model_name="gpt-4o",
                stream=False,
            )
            return assistant, thread, response

        try:
            assistant, thread, response = await run_generation()
        except Exception as e:
            print(f"❌ Generation error: {e}")
            traceback.print_exc()
            return jsonify({"status": "error", "message": str(e)}), 500

        generated_content = response.content

        # Persist to Mongo (optional)
        if db is not None:
            try:
                db.generated_content.insert_one({
                    "lecture_id": lecture_id,
                    "video_id": video_id,
                    "video_title": video_title,
                    "content_type": content_type,
                    "content": generated_content,
                    "timestamp": datetime.now(UTC)
                })
            except Exception as e:
                print(f"⚠️ Failed to persist generated content: {e}")

        return jsonify({
            "status": "success",
            "content": generated_content,
            "thread_id": str(thread.thread_id)
        })

    # Simple health check
    @app.get("/health")
    def health():
        return {"status": "ok", "server": "Flask"}, 200

    # ...existing routes remain unchanged...

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("FLASK_PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=True)
