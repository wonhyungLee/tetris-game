
import http.server
import ssl
import os

PORT = 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))
httpd = http.server.HTTPServer(('0.0.0.0', PORT), http.server.SimpleHTTPRequestHandler)
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(certfile='cert.pem', keyfile='key.pem')
httpd.socket = ssl_context.wrap_socket(httpd.socket, server_side=True)
print(f"Serving HTTPS on port {PORT}")
httpd.serve_forever()
