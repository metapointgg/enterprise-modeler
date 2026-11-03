#!/usr/bin/env python3
"""Serve the pre-built Enterprise Modeler without Node.js or npm."""

from __future__ import annotations

import argparse
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
STANDALONE_DIR = ROOT / "standalone"


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STANDALONE_DIR), **kwargs)

    def do_GET(self) -> None:
        requested_path = unquote(urlparse(self.path).path)
        relative_path = requested_path.lstrip("/")
        candidate = (STANDALONE_DIR / relative_path).resolve()

        try:
            candidate.relative_to(STANDALONE_DIR.resolve())
        except ValueError:
            self.send_error(403)
            return

        if requested_path != "/" and not candidate.exists():
            self.path = "/index.html"

        super().do_GET()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Serve the pre-built Enterprise Modeler without installing npm dependencies."
    )
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8080, help="TCP port (default: 8080)")
    args = parser.parse_args()

    if not STANDALONE_DIR.is_dir():
        raise SystemExit(
            "The standalone build is missing. Pull the latest main branch after the "
            "GitHub Build workflow has completed."
        )

    index_file = STANDALONE_DIR / "index.html"
    if not index_file.is_file():
        raise SystemExit(f"Standalone build is incomplete: {index_file} is missing.")

    server = ThreadingHTTPServer((args.host, args.port), SpaHandler)
    print(f"Enterprise Modeler: http://{args.host}:{args.port}")
    print(f"Serving: {STANDALONE_DIR}")
    print("No npm install or Node.js runtime is required.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
