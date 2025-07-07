
from PIL import Image, ImageDraw
import random

# 이미지 크기 및 블록 크기 설정
img_width = 1200
img_height = 630
block_size = 60
grid_width = img_width // block_size
grid_height = img_height // block_size

# 블록 색상 정의
colors = {
    'I': (0, 255, 255),  # Cyan
    'O': (255, 255, 0),  # Yellow
    'T': (128, 0, 128),  # Purple
    'S': (0, 255, 0),    # Green
    'Z': (255, 0, 0),    # Red
    'J': (0, 0, 255),    # Blue
    'L': (255, 165, 0)   # Orange
}

# 이미지 생성
image = Image.new('RGB', (img_width, img_height), (20, 20, 40))
draw = ImageDraw.Draw(image)

# 테트리스 블록 모양 정의 (4x4 그리드 내)
tetrominoes = {
    'I': [(0, 1), (1, 1), (2, 1), (3, 1)],
    'O': [(1, 0), (2, 0), (1, 1), (2, 1)],
    'T': [(0, 1), (1, 1), (2, 1), (1, 0)],
    'S': [(1, 1), (2, 1), (0, 2), (1, 2)],
    'Z': [(0, 1), (1, 1), (1, 2), (2, 2)],
    'J': [(0, 1), (1, 1), (2, 1), (2, 0)],
    'L': [(0, 1), (1, 1), (2, 1), (0, 0)]
}

# 블록 그리기 함수
def draw_block(draw, x, y, color):
    draw.rectangle(
        (x, y, x + block_size - 2, y + block_size - 2),
        fill=color,
        outline=(255, 255, 255),
        width=2
    )

# 여러 블록을 무작위로 ��치
for _ in range(15):
    piece_type = random.choice(list(tetrominoes.keys()))
    shape = tetrominoes[piece_type]
    color = colors[piece_type]
    
    start_x = random.randint(0, grid_width - 4) * block_size
    start_y = random.randint(0, grid_height - 4) * block_size
    
    for (x, y) in shape:
        draw_block(draw, start_x + x * block_size, start_y + y * block_size, color)

# 이미지 저장
output_path = '/root/tetris-game-cloned/tetris-preview.png'
image.save(output_path)

print(f"이미지가 {output_path}에 저장되었습니다.")
