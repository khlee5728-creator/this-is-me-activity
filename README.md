# This Is Me - 초등학생용 영어교육 앱

## 프로젝트 개요
초등학생을 위한 영어 자기소개 활동 웹앱

## 기술 스택
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **AI**: OpenAI (백엔드 API를 통해 호출)
- **Backend API**: https://playground.ils.ai.kr/api

## 설치 및 실행

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
개발 서버가 http://localhost:3000 에서 실행됩니다.

### 빌드
```bash
npm run build
```

### 빌드 결과 미리보기
```bash
npm run preview
```

## 프로젝트 구조
```
src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # Step1, Step2, Step3 페이지
│   ├── Step1Page.tsx    # 사용자 정보 입력
│   ├── Step2Page.tsx    # 사진 업로드 및 스타일 선택
│   └── Step3Page.tsx    # 결과 확인 및 다운로드
├── hooks/         # 커스텀 훅
├── services/      # API 호출 서비스
│   └── api.ts     # 백엔드 API 호출 함수
├── types/         # TypeScript 타입 정의
│   └── index.ts   # 공통 타입 정의
├── utils/         # 유틸리티 함수
├── App.tsx        # 메인 앱 컴포넌트
├── main.tsx       # 진입점
└── index.css      # 전역 스타일
```

## 기능
1. **Step 1**: 사용자 정보 입력
   - 필수: 이름, 나이, 사는곳 (Only Typing)
   - 선택: 좋아하는 색, 음식, 취미 (Typing & Options - AI 실시간 생성)

2. **Step 2**: 사진 업로드 및 AI 스타일 변환
   - 카메라 촬영 또는 사진 업로드
   - 5가지 스타일 선택: Cartoon, Fairy Tale, Super Hero, Lego, Fantasy

3. **Step 3**: 결과 확인 및 다운로드
   - AI가 생성한 이미지와 자기소개 글 확인
   - 스크린 캡처 기능으로 이미지 다운로드

## API 엔드포인트
백엔드 API는 다음 엔드포인트를 사용합니다:
- `POST /api/chat/completions`: Chat Completions API를 통한 문항 옵션 생성 (Color, Food, Hobby)
- `POST /api/images/generations`: Images Generations API를 통한 이미지 스타일 변환

백엔드 URL: `https://playground.ils.ai.kr/api`

## 개발 환경
- Node.js 18+
- npm 또는 yarn

