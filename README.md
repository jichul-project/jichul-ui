# jichul

## 기술 스택

| 항목              | 버전                |
|-----------------|-------------------|
| Next.js         | 16.x (App Router) |
| React           | 19.x              |
| TypeScript      | 5.x               |
| PWA             | Serwist           |
| Package Manager | npm               |

---

## 프로젝트 개요

구독 서비스 지출을 관리하는 Next.js 기반 PWA 애플리케이션입니다.

주요 목적은 다음과 같습니다.

- 구독 서비스 목록/요약 관리
- 제공사 관리
- JWT 기반 로그인
- 설치형 PWA 지원
- 모바일 환경에서 안정적인 로그인 유지

---

## 프로젝트 구조

```text
src/
├── app/
│ ├── (dashboard)/
│ │ ├── layout.tsx
│ │ ├── providers/
│ │ │ └── page.tsx
│ │ └── subscriptions/
│ │ └── page.tsx
│ ├── api/
│ │ ├── auth/
│ │ │ ├── login/route.ts
│ │ │ ├── logout/route.ts
│ │ │ ├── me/route.ts
│ │ │ └── refresh/route.ts
│ │ └── proxy/
│ │ └── [...path]/route.ts
│ ├── login/
│ │ └── page.tsx
│ ├── globals.css
│ ├── layout.tsx
│ ├── manifest.ts
│ └── page.tsx
├── components/
│ ├── layout/
│ │ ├── Sidebar.module.css
│ │ └── Sidebar.tsx
│ └── ui/
│ ├── Modal.tsx
│ └── form.module.css
├── hooks/
│ ├── useProviders.ts
│ └── useSubscriptions.ts
├── lib/
│ ├── api.ts
│ └── auth.ts
├── types/
│ └── index.ts
├── proxy.ts
└── sw.ts
```

---

## 주요 기능

### 구독 목록 페이지

- 월 총 지출 / 연 총 지출 / 구독 수 요약 카드
- 제공사별 월 지출 비중 도넛 차트
- 구독별 월 지출 순위 바 차트
- 구독 등록 / 수정 / 삭제
- 컬럼 정렬 지원

### 제공사 관리 페이지

- 제공사 목록 조회
- 제공사 등록 / 수정 / 삭제
- 연결된 구독이 있는 제공사 삭제 방지

### 인증

- 이메일 + 비밀번호 로그인
- 액세스 토큰 만료 시 자동 갱신 후 재요청
- 갱신 실패 시 `/login` 이동
- 로그아웃 시 인증 쿠키 삭제
- `proxy.ts`로 인증 필요 페이지 보호

### PWA

- 설치형 앱 지원
- Service Worker 기반 정적 리소스 캐시
- API 요청은 캐시하지 않음
- 모바일 홈 화면 설치 후 standalone 실행 가능

---

## 인증 구조

이 프로젝트는 **쿠키 기반 인증 구조**를 사용합니다.

### 핵심 원칙

- `accessToken` → **HttpOnly Cookie**
- `refreshToken` → **HttpOnly Cookie**
- 클라이언트는 토큰을 `localStorage`에 저장하지 않음
- 모든 API 호출은 **same-origin** 경로로 통일
- Next.js Route Handler가 백엔드 API와 통신하는 **BFF(Backend For Frontend)** 역할 수행

### 인증 흐름

1. 사용자가 `/login`에서 로그인
2. `POST /api/auth/login` 호출
3. Next 서버가 백엔드 로그인 API 호출
4. 응답으로 받은 토큰을 HttpOnly 쿠키에 저장
5. 이후 클라이언트는 `/api/proxy/*` 또는 `/api/auth/*`만 호출
6. 401 발생 시 `/api/auth/refresh`로 토큰 재발급
7. 실패 시 `/login`으로 이동

### 라우팅 보호 방식

- `src/proxy.ts`는 `refreshToken` 쿠키 존재 여부를 기준으로 보호
- 실제 토큰 유효성은 API 요청 시 검증

---

## API 호출 구조

클라이언트는 백엔드 주소를 직접 호출하지 않습니다.

### 클라이언트에서 사용하는 경로

```typescript
const res1 = await api.get("/api/proxy/subscriptions");
const res2 = await api.get("/api/proxy/providers");
const res3 = await api.post("/api/auth/login", {email, password});
const res4 = await api.get("/api/auth/me");
```

### 서버에서의 역할

- `src/app/api/auth/*`  
  인증 관련 처리 및 쿠키 제어
- `src/app/api/proxy/[...path]/route.ts`  
  일반 업무 API를 백엔드로 프록시

---

## 환경 변수

### 필수

| 변수명               | 설명                      | 예시                      |
|-------------------|-------------------------|-------------------------|
| `BACKEND_API_URL` | Next 서버가 호출할 백엔드 API 주소 | `http://localhost:8080` |

### 예시

```env
BACKEND_API_URL=[http://localhost:8080](http://localhost:8080)
```

> 현재 구조에서는 클라이언트가 직접 백엔드를 호출하지 않으므로  
> `NEXT_PUBLIC_API_URL`은 필수가 아닙니다.

---

## 실행 방법

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

> Next.js 16 + Serwist 조합 이슈를 피하기 위해  
> 개발 서버는 `next dev --webpack`으로 실행하도록 설정하는 것을 권장합니다.

### 프로덕션 빌드

```bash
npm run build npm start
```

---

## PWA 구성

### Manifest

- `src/app/manifest.ts` 사용
- `id`, `scope`, `start_url`, `display: "standalone"` 설정
- 홈 화면 설치 가능

### Service Worker

- 소스: `src/sw.ts`
- 빌드 결과물: `public/sw.js`
- API 요청은 `NetworkOnly`
- 정적 리소스는 Serwist 기본 캐시 전략 사용

---

## 로그인 유지 관련 설계 포인트

모바일 설치형 PWA에서 로그인 유지가 안정적으로 동작하도록 다음 원칙을 따릅니다.

- 토큰을 `localStorage`에 저장하지 않음
- 인증 상태는 쿠키 기준으로 관리
- 브라우저/설치형 앱 모두 same-origin 요청 사용
- 짧은 수명의 `accessToken` 대신 `refreshToken` 쿠키 기준으로 라우팅 보호
- 실제 인증 보장은 API 요청 시 처리

이 구조는 브라우저 탭 / 설치형 PWA / 모바일 재실행 환경에서  
기존 localStorage 기반 방식보다 더 안정적입니다.
