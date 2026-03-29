import os
from flask import Flask, render_template, request, redirect, url_for, jsonify
from config import load_config, save_config, is_configured, REQUIRED_SETTINGS

app = Flask(__name__)


@app.route("/health")
def health():
    status = {"app": "ok"}
    healthy = all(v == "ok" for v in status.values())
    return jsonify(status), (200 if healthy else 503)


@app.route("/")
def index():
    if REQUIRED_SETTINGS and not is_configured():
        return redirect(url_for("settings"))
    return render_template("index.html")


@app.route("/settings", methods=["GET", "POST"])
def settings():
    if request.method == "POST":
        config = load_config()
        for setting in REQUIRED_SETTINGS:
            value = request.form.get(setting["key"], "").strip()
            if value and not value.startswith("\u2022"):
                config[setting["key"]] = value
        save_config(config)
        return redirect(url_for("settings", saved="1"))

    config = load_config()
    masked = {}
    for setting in REQUIRED_SETTINGS:
        val = config.get(setting["key"], "")
        if setting["type"] == "password" and val:
            masked[setting["key"]] = "\u2022" * min(len(val), 20)
        else:
            masked[setting["key"]] = val

    return render_template(
        "settings.html",
        settings=REQUIRED_SETTINGS,
        values=masked,
        saved=request.args.get("saved"),
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
