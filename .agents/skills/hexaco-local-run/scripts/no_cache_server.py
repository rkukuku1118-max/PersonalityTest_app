import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header(
            "Clear-Site-Data",
            getattr(self, "clear_site_data", '"cache"'),
        )
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if urlsplit(self.path).path == "/__clear_site_data__":
            self.clear_site_data = '"cache", "storage"'
            self.send_response(302)
            self.send_header("Location", "/")
            self.end_headers()
            return

        super().do_GET()


root = os.path.abspath(sys.argv[1])
port = int(sys.argv[2])
os.chdir(root)
ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()
