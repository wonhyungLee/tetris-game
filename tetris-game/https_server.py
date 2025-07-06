
import http.server
import ssl
import os
import sys
import logging

# --- 로깅 설정 ---
log_file = 'server_run.log'
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='w'
)

class StreamToLogger:
    def __init__(self, logger, level):
        self.logger = logger
        self.level = level
        self.linebuf = ''
    def write(self, buf):
        for line in buf.rstrip().splitlines():
            self.logger.log(self.level, line.rstrip())
    def flush(self):
        pass

sys.stdout = StreamToLogger(logging.getLogger('STDOUT'), logging.INFO)
sys.stderr = StreamToLogger(logging.getLogger('STDERR'), logging.ERROR)
# --- 로깅 설정 끝 ---

# --- 안정성을 높인 커스텀 요청 핸들러 ---
class SafeHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        try:
            super().do_GET()
        except Exception as e:
            logging.error(f"GET 요청 처리 중 오류 발생: {self.path}", exc_info=True)
            self.send_error(500, "Internal Server Error")

    def do_HEAD(self):
        try:
            super().do_HEAD()
        except Exception as e:
            logging.error(f"HEAD 요청 처리 중 오류 발생: {self.path}", exc_info=True)
            self.send_error(500, "Internal Server Error")

    # 다른 HTTP 메소드에 대해서도 필요하다면 추가할 수 있습니다.

# --- 메인 서버 로직 ---
def run_server():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        print(f"작업 디렉토리 변경: {script_dir}")

        PORT = 443
        server_address = ('0.0.0.0', PORT)

        cert_path = 'cert.pem'
        key_path = 'key.pem'
        if not os.path.exists(cert_path) or not os.path.exists(key_path):
            print(f"오류: 인증서 또는 키 파일({cert_path}, {key_path})을 찾을 수 없습니다.")
            sys.exit(1)

        # 커스텀 핸들러(SafeHandler)를 사용합니다.
        httpd = http.server.HTTPServer(server_address, SafeHandler)

        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        httpd.socket = ssl_context.wrap_socket(httpd.socket, server_side=True)

        print(f"HTTPS 서버가 {PORT} 포트에서 실행 중입니다. (안정성 강화 모드)")
        print(f"접속 주소: https://localhost:{PORT}")

        httpd.serve_forever()

    except Exception as e:
        logging.exception("서버 실행 중 치명적인 오류 발생:")
    finally:
        print("서버가 중지되었습니다.")
        logging.info("서버가 중지되었습니다.")
        if 'httpd' in locals() and httpd.socket:
            httpd.server_close()

if __name__ == '__main__':
    run_server()
