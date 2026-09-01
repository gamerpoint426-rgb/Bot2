#!/usr/bin/env python3
# Local-only metrics collector. It does not create network clients.

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from datetime import datetime

OUTPUT = "metrics.jsonl"

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/metric":
            return self._send(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(length))
            data["received_at"] = datetime.utcnow().isoformat() + "Z"
            with open(OUTPUT, "a", encoding="utf-8") as f:
                f.write(json.dumps(data) + "\n")
            self._send(200, {"ok": True})
        except Exception as e:
            self._send(400, {"ok": False, "error": str(e)})

    def log_message(self, fmt, *args):
        pass

if __name__ == "__main__":
    print("Local metrics receiver: http://127.0.0.1:8080")
    HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
