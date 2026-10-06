"""Serve the game folder on http://localhost:8080 with caching turned off, so a reload always shows the latest build."""
import http.server, functools, os

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    http.server.ThreadingHTTPServer(('127.0.0.1', 8080), functools.partial(NoCache, directory=here)).serve_forever()
