"""
Brick Breaker Deluxe - Python Static Application Server & Entry Point
"""
import http.server
import socketserver
import os
import sys

PORT = int(os.environ.get("PORT", 3000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


def main():
    print(f"Starting Brick Breaker Deluxe Python Server at http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), CustomHTTPHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            sys.exit(0)


if __name__ == "__main__":
    main()
