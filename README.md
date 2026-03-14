# jichul

## 기술 스택

| 항목         | 버전                |
|------------|-------------------|
| Next.js    | 16.x (App Router) |
| React      | 19.x              |
| TypeScript | 5.x               |

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                 # 루트 레이아웃
│   ├── page.tsx                   # / → /subscriptions 리다이렉트
│   ├── globals.css                # 전역 CSS 변수, 다크모드
│   ├── login/
│   │   └── page.tsx               # 로그인
│   ├── register/
│   │   └── page.tsx               # 회원가입
│   └── (dashboard)/               # 인증 필요 영역 (Route Group)
│       ├── layout.tsx             # Sidebar 포함 공통 레이아웃
│       ├── subscriptions/
│       │   └── page.tsx           # 구독 목록, 요약 카드, 차트, 정렬
│       └── providers/
│           └── page.tsx           # 제공사 관리
│
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx            # 사이드바 내비게이션
│   └── ui/
│       ├── Modal.tsx              # 공용 모달
│       └── form.module.css        # 공용 폼 스타일
│
├── hooks/
│   ├── useSubscriptions.ts        # 구독 CRUD + 요약 상태 관리
│   └── useProviders.ts            # 제공사 CRUD 상태 관리
│
├── lib/
│   ├── api.ts                     # fetch 래퍼 (401 시 자동 토큰 갱신)
│   └── auth.ts                    # 로그인, 로그아웃, 유저 정보 헬퍼
│
├── types/
│   └── index.ts                   # 공통 타입 정의
│
└── proxy.ts                       # 미인증 사용자 /login 리다이렉트
```

## 주요 기능

### 구독 목록 페이지

- 월 총 지출 / 연 총 지출 / 구독 수 요약 카드
- **도넛 차트**: 제공사별 월 지출 비중 (SVG, 외부 라이브러리 미사용)
- **수평 바 차트**: 구독별 월 지출 순위 Top 7
- 구독 테이블: 서비스명 / 제공사 / 금액 / 타입 / 설명
- 컬럼 클릭으로 오름차순/내림차순 정렬
- 구독 등록 / 수정 / 삭제 (모달)

### 제공사 관리 페이지

- 제공사 목록 조회
- 제공사 등록 / 수정 / 삭제
- 연결된 구독이 있는 제공사 삭제 방지

### 인증

- JWT 기반 로그인 (이메일 + 비밀번호)
- 액세스 토큰 만료(401) 시 리프레시 토큰으로 자동 갱신 후 원래 요청 재시도
- 갱신 실패 시 `/login`으로 자동 이동
- 로그아웃 시 토큰 및 쿠키 전체 삭제
- `proxy.ts`로 미인증 사용자 접근 차단

## 환경 변수

| 변수명                   | 설명         | 기본값                     |
|-----------------------|------------|-------------------------|
| `NEXT_PUBLIC_API_URL` | 백엔드 API 주소 | `http://localhost:8080` |

> `NEXT_PUBLIC_API_URL`이 설정되지 않으면 `http://localhost:8080`으로 동작합니다.

## 실행 방법

### 개발 서버

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 프로덕션 빌드

```bash
npm run build
npm start
```

## API 연동 방식

`src/lib/api.ts`의 `api` 객체를 통해 모든 요청이 처리됩니다.

```typescript
// 사용 예시
const res = await api.get<Subscription[]>("/api/subscriptions");
const res = await api.post<Provider>("/api/providers", {name: "Netflix"});
const res = await api.put<Provider>(`/api/providers/${id}`, {name: "수정된 이름"});
const res = await api.delete(`/api/providers/${id}`);
```

401 응답 시 리프레시 토큰으로 자동 갱신 후 1회 재시도합니다. 갱신에 실패하면 토큰을 삭제하고 `/login`으로 이동합니다.

## 토큰 저장 방식

| 저장소            | 항목             | 용도                       |
|----------------|----------------|--------------------------|
| `localStorage` | `accessToken`  | API 요청 헤더 첨부             |
| `localStorage` | `refreshToken` | 토큰 갱신 요청                 |
| `localStorage` | `user`         | 사이드바 사용자 이름 표시           |
| `Cookie`       | `accessToken`  | `proxy.ts`(서버 사이드) 인증 확인 |

쿠키의 `accessToken`은 `proxy.ts`에서 미인증 여부 판단에만 사용되며, 실제 API 요청에는 `localStorage`의 토큰이 사용됩니다.

## 다크모드

`globals.css`에서 `@media (prefers-color-scheme: dark)`로 시스템 설정을 따릅니다. 별도 토글 없이 자동 전환됩니다.
