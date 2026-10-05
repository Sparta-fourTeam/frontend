# frontend

Next.js (App Router + TypeScript) 프론트엔드. 백엔드는 Spring Boot이며 REST API로만 통신합니다.

## 시작하기

```bash
npm install
npm run dev   # http://localhost:3000
```

## 환경변수

`.env`, `.env.local` 등 `.env*` 파일은 `.gitignore`로 커밋되지 않습니다.

필요하면 프로젝트 루트에 `.env.local`을 만들어 아래 값을 지정하세요. (없으면 기본값 사용)

`NEXT_PUBLIC_`으로 시작하는 변수는 브라우저에 노출되므로 비밀값을 넣지 마세요.

## 폴더 구조

```
src/
├─ app/                 # 라우팅(페이지, 레이아웃)
├─ components/
│  ├─ common/           # 버튼, 모달 등 재사용 UI
│  └─ layout/           # 헤더, 푸터 등 레이아웃 컴포넌트
├─ config/env.ts        # 환경변수 읽는 곳
├─ constants/apiPaths.ts# 백엔드 API 경로 모음
├─ hooks/               # 커스텀 훅
├─ lib/api/             # fetch 래퍼(공통 API 클라이언트, 에러 처리)
├─ services/            # 도메인별 API 호출 함수
└─ types/               # 공통 타입(API 응답 등)
```
