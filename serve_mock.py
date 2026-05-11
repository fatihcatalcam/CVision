import http.server
import socketserver
import json
import os
import sys

PORT = 5174 # run on 5174 to avoid conflict with the existing 5173

# Change to dist dir
os.chdir(r"C:\Users\fthct\OneDrive\Belgeler\GitHub\CVision\frontend\dist")

class MockHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/auth/me'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            fake_user = {
                "id": 1,
                "full_name": "Test User",
                "email": "test@example.com",
                "role": "user",
                "plan_type": "premium",
                "analysis_count": 5,
                "quota_reset_at": "2026-05-01T00:00:00Z",
                "subscription_end_at": "2026-12-01T00:00:00Z",
                "created_at": "2026-01-01T00:00:00Z"
            }
            self.wfile.write(json.dumps(fake_user).encode())
            return
        elif self.path.startswith('/api/dashboard/stats'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            fake_stats = {"total": 5, "average_score": 85}
            self.wfile.write(json.dumps(fake_stats).encode())
            return
        elif self.path.startswith('/api/analysis'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps([]).encode())
            return
        
        # If not an API request, but file doesn't exist, serve index.html for SPA routing
        if not os.path.exists(self.translate_path(self.path)):
            self.path = '/index.html'
        
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/auth/login'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"access_token": "fake-token"}).encode())
            return
        
        self.send_response(404)
        self.end_headers()

with socketserver.TCPServer(("", PORT), MockHandler) as httpd:
    print("Serving at port", PORT)
    httpd.serve_forever()
