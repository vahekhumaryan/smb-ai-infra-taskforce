import json
import os

DATA_DIR = os.environ.get("DATA_DIR", "./data")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")

# Define what your app needs from the user at runtime.
# Edit this list for each app.
REQUIRED_SETTINGS = [
    # --- EDIT THESE FOR YOUR APP ---
    # {
    #     "key": "store_url",
    #     "label": "Store URL",
    #     "type": "text",
    #     "placeholder": "https://your-store.example.com",
    # },
    # {
    #     "key": "api_key",
    #     "label": "API Key",
    #     "type": "password",
    #     "placeholder": "sk-...",
    # },
]


def load_config():
    try:
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_config(config):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)


def get_config_value(key):
    return load_config().get(key)


def is_configured():
    if not REQUIRED_SETTINGS:
        return True
    config = load_config()
    return all(config.get(s["key"], "").strip() for s in REQUIRED_SETTINGS)
