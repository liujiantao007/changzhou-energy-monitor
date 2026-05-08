#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import os
import urllib.parse
import io

PORT = 65080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        mtype = http.server.SimpleHTTPRequestHandler.guess_type(self, path)
        if mtype == 'application/json':
            return 'application/json; charset=utf-8'
        elif mtype.startswith('text/'):
            return mtype + '; charset=utf-8'
        return mtype

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def translate_path(self, path):
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        path = urllib.parse.unquote(path)
        return super().translate_path(path)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"前端服务启动在 http://localhost:{PORT}")
        print("按 Ctrl+C 停止服务")
        httpd.serve_forever()