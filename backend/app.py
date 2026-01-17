from flask import Flask, jsonify
from flask_cors import CORS
from twelvelabs import TwelveLabs
import os
from dotenv import load_dotenv
from backboard import BackboardClient
import asyncio

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Initialize Twelve Labs client
    TL_API_KEY = os.getenv("TL_API_KEY")
    if not TL_API_KEY:
        raise RuntimeError("Missing TWELVE_LABS_API_KEY env var")
    tl = TwelveLabs(api_key=TL_API_KEY)

    @app.get("/health")
    def health():
        return {"status": "ok", "server": "Flask"}, 200
    
    @app.route('/api/hello', methods=['GET'])  # match Vite proxy prefix
    def test():
        return {"status": "success"}
    
    @app.route('/api/test-connection', methods=['GET'])
    def test_connection():
        try:
            # A simple call to list indexes to verify the API key works
            indexes = list(tl.indexes.list())
            return {"status": "connected", "index_count": len(indexes)}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
