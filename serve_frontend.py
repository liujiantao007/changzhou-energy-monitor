#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import os
import urllib.parse
import io

PORT = int(os.environ.get('PORT', '65080'))

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
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def translate_path(self, path):
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        path = urllib.parse.unquote(path)
        # 默认首页改为主题版页面（只拦截根路径，不影响 /index.html 直接访问）
        if path == '/' or path == '':
            path = '/version2-theme.html'
        return super().translate_path(path)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"前端服务启动在 http://localhost:{PORT}")
        print("按 Ctrl+C 停止服务")
        httpd.serve_forever()