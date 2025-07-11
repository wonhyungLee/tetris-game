# 🔊 테트리스 게임 사운드 시스템

이 게임은 **Web Audio API**를 사용하여 실시간으로 사운드를 생성합니다.
별도의 오디오 파일이 필요하지 않으며, 모든 소리는 코드로 생성됩니다.

## 🎵 포함된 사운드

### 배경음악 (BGM)
- **레벨 1-3**: 밝고 경쾌한 멜로디 (A 메이저)
- **레벨 4-6**: 조금 더 복잡한 멜로디 (B 메이저) 
- **레벨 7+**: 빠르고 긴장감 있는 멜로디 (C# 메이저)

### 효과음 (SFX)
- **라인 클리어**: 클리어한 라인 수에 따라 다른 화음
  - 1줄: 단순한 비프음
  - 2줄: 2음 화음
  - 3줄: 3음 화음  
  - 4줄 (테트리스): 특별한 4음 아르페지오
- **레벨업**: 상승하는 아르페지오
- **게임오버**: 하강하는 음계
- **블록 드롭**: 낮은 톤의 짧은 소리
- **블록 회전**: 중간 톤의 매우 짧은 소리

## 🎛️ 사운드 컨트롤

- **음소거 토글**: 우상단 스피커 버튼으로 모든 소리 켜기/끄기
- **자동 볼륨 조절**: BGM과 효과음이 서로 방해하지 않도록 최적화
- **브라우저 호환성**: 모든 최신 브라우저에서 작동

## 🔧 기술적 특징

- **Web Audio API 사용**: 고품질 실시간 오디오 생성
- **메모리 효율성**: 오디오 파일 없이 코드로만 구현
- **브라우저 정책 준수**: 사용자 상호작용 후 오디오 활성화
- **성능 최적화**: CPU 사용량 최소화

## 🎮 사용법

1. 게임 시작 시 자동으로 사운드 시스템 초기화
2. 첫 클릭 후 오디오 활성화
3. 우상단 스피커 버튼으로 음소거 토글 가능

---

**참고**: 이 사운드 시스템은 별도 라이브러리나 파일 없이 순수 JavaScript와 Web Audio API만으로 구현되었습니다.