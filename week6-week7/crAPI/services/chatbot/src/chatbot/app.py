import logging
import sys

from quart import Blueprint, Quart, jsonify
from quart_cors import cors

from .chat_api import chat_bp
from .config import Config
from .extensions import init_mongo

# Configure logging for all chatbot modules
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
# Ensure chatbot loggers are at INFO level
logging.getLogger("chatbot").setLevel(logging.INFO)

root_bp = Blueprint("root", __name__, url_prefix="/chatbot")
session_api_key_map = {}
root_bp.register_blueprint(chat_bp)


@root_bp.route("/", methods=["GET"])
async def index():
    return jsonify({"message": "Hello from chatbot!"}), 200


app = Quart(__name__)
app.config.from_object(Config)
app = cors(app, allow_origin="*")
app.register_blueprint(root_bp)

# Initialize MongoDB
init_mongo()

if __name__ == "__main__":
    app.run(debug=True, port=5555)
