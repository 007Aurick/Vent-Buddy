import json
import subprocess
import sys
import time
from pathlib import Path

from flask import Flask, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
MAIN_SCRIPT = BASE_DIR / "main.py"
REPORTS_DIR = BASE_DIR / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
STATE_FILE = BASE_DIR / "session_state.json"

session_process = None
session_started_at = None


def latest_report_since(since):
    reports = sorted(REPORTS_DIR.glob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)
    if reports and reports[0].stat().st_mtime >= since:
        return reports[0]
    return None


@app.post("/start")
def start_session():
    global session_process, session_started_at
    if session_process is not None and session_process.poll() is None:
        return jsonify({"status": "already_running"}), 409

    if STATE_FILE.exists():
        STATE_FILE.unlink()

    session_started_at = time.time()
    session_process = subprocess.Popen([sys.executable, str(MAIN_SCRIPT)], cwd=BASE_DIR)
    return jsonify({"status": "started", "pid": session_process.pid})


@app.get("/transcript")
def transcript():
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return jsonify(json.load(f))
    return jsonify({"state": "starting", "messages": []})


@app.get("/status")
def status():
    if session_process is not None and session_process.poll() is None:
        return jsonify({"status": "running", "pid": session_process.pid})

    if session_started_at is not None:
        report = latest_report_since(session_started_at)
        if report is not None:
            return jsonify({"status": "finished", "report": report.name})

    return jsonify({"status": "idle"})


@app.get("/report/latest")
def download_latest_report():
    reports = sorted(REPORTS_DIR.glob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not reports:
        return jsonify({"error": "no report available"}), 404
    return send_file(reports[0], as_attachment=True, download_name=reports[0].name)


@app.post("/stop")
def stop_session():
    global session_process
    if session_process is None or session_process.poll() is not None:
        return jsonify({"status": "idle"})

    session_process.terminate()
    session_process = None
    return jsonify({"status": "stopped"})


if __name__ == "__main__":
    app.run(port=5000, debug=True)
