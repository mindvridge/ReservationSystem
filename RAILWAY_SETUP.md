# Railway 배포 가이드

이 문서는 심리상담 예약 시스템을 Railway에 배포하는 방법을 단계별로 설명합니다.

## 목차

1. [사전 준비](#1-사전-준비)
2. [Railway 프로젝트 생성](#2-railway-프로젝트-생성)
3. [PostgreSQL 데이터베이스 추가](#3-postgresql-데이터베이스-추가)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [배포하기](#5-배포하기)
6. [Clerk Webhook 설정](#6-clerk-webhook-설정)
7. [커스텀 도메인 설정 (선택)](#7-커스텀-도메인-설정-선택)
8. [문제 해결](#8-문제-해결)

---

## 1. 사전 준비

### 필수 계정 생성

배포 전에 다음 서비스들의 계정이 필요합니다:

| 서비스 | 용도 | 가입 URL |
|--------|------|----------|
| **Railway** | 앱 호스팅 & 데이터베이스 | https://railway.app |
| **Clerk** | 사용자 인증 | https://clerk.com |
| **Web3Forms** | 이메일 알림 (무료) | https://web3forms.com |
| **GitHub** | 소스 코드 저장소 | https://github.com |

### Clerk 설정 확인

1. [Clerk Dashboard](https://dashboard.clerk.com)에 로그인
2. 애플리케이션 생성 또는 선택
3. **API Keys** 메뉴에서 다음 값을 복사해 둡니다:
   - `Publishable Key` (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
   - `Secret Key` (CLERK_SECRET_KEY)

### Web3Forms 설정

1. [Web3Forms](https://web3forms.com)에서 Access Key 생성
2. 이메일 주소 인증 완료
3. Access Key 복사해 둡니다

---

## 2. Railway 프로젝트 생성

### 2.1 Railway 로그인

1. [Railway](https://railway.app)에 접속
2. GitHub 계정으로 로그인 (권장)

### 2.2 새 프로젝트 생성

1. Dashboard에서 **"New Project"** 버튼 클릭
2. **"Deploy from GitHub repo"** 선택
3. GitHub 저장소 연결 권한 부여
4. 이 프로젝트의 저장소 선택

> **참고**: 처음에는 환경 변수가 없어서 배포가 실패합니다. 이는 정상이며, 아래 단계에서 설정합니다.

---

## 3. PostgreSQL 데이터베이스 추가

### 3.1 데이터베이스 서비스 추가

1. 프로젝트 대시보드에서 **"+ New"** 클릭
2. **"Database"** → **"Add PostgreSQL"** 선택
3. PostgreSQL 서비스가 자동으로 생성됩니다

### 3.2 DATABASE_URL 연결

Railway가 자동으로 `DATABASE_URL` 환경 변수를 생성합니다.

1. PostgreSQL 서비스 클릭
2. **"Variables"** 탭에서 `DATABASE_URL` 확인
3. 앱 서비스에서 이 변수를 참조하도록 설정:

```
앱 서비스 → Variables → New Variable
Name: DATABASE_URL
Value: ${{Postgres.DATABASE_URL}}
```

> **중요**: `${{Postgres.DATABASE_URL}}` 형식으로 입력하면 Railway가 자동으로 연결합니다.

---

## 4. 환경 변수 설정

### 4.1 앱 서비스 환경 변수 추가

앱 서비스를 클릭하고 **"Variables"** 탭에서 다음 환경 변수들을 추가합니다:

| 변수명 | 설명 | 예시 값 |
|--------|------|---------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `${{Postgres.DATABASE_URL}}` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 공개 키 | `pk_live_...` 또는 `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk 비밀 키 | `sk_live_...` 또는 `sk_test_...` |
| `CLERK_WEBHOOK_SECRET` | Clerk 웹훅 시크릿 | (나중에 설정) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | 로그인 URL | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | 회원가입 URL | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | 로그인 후 리다이렉트 | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | 회원가입 후 리다이렉트 | `/onboarding` |
| `WEB3FORMS_ACCESS_KEY` | Web3Forms 접근 키 | `your_access_key` |
| `CRON_SECRET` | Cron 작업 인증 시크릿 | (임의의 긴 문자열) |
| `NEXT_PUBLIC_APP_URL` | 앱 URL | (배포 후 설정) |
| `NEXT_PUBLIC_TIMEZONE` | 타임존 | `Asia/Seoul` |

### 4.2 환경 변수 일괄 추가 (Raw Editor 사용)

**Variables** 탭에서 **"RAW Editor"** 버튼을 클릭하면 한 번에 여러 변수를 추가할 수 있습니다:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
CLERK_SECRET_KEY=sk_live_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
WEB3FORMS_ACCESS_KEY=your_web3forms_key
CRON_SECRET=your_random_secret_string_here
NEXT_PUBLIC_TIMEZONE=Asia/Seoul
```

### 4.3 CRON_SECRET 생성 팁

터미널에서 임의의 시크릿 생성:

```bash
# macOS/Linux
openssl rand -hex 32

# 또는
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. 배포하기

### 5.1 자동 배포 트리거

환경 변수 설정 후 Railway가 자동으로 재배포를 시작합니다.

또는 수동으로 배포:
1. 앱 서비스 클릭
2. **"Deployments"** 탭
3. **"Redeploy"** 버튼 클릭

### 5.2 배포 로그 확인

**Deployments** 탭에서 빌드 로그를 확인할 수 있습니다:

```
✓ Nixpacks build started
✓ Installing dependencies...
✓ npx prisma generate
✓ npm run build
✓ Build successful!
✓ npx prisma migrate deploy
✓ npm start
```

### 5.3 배포 완료 확인

1. 배포가 성공하면 **"Domains"** 섹션에서 URL을 확인합니다
2. 기본 URL 형식: `https://your-app-name.up.railway.app`
3. URL을 클릭하여 앱이 정상 작동하는지 확인

### 5.4 NEXT_PUBLIC_APP_URL 업데이트

배포된 URL을 확인한 후:

1. **Variables** 탭으로 이동
2. `NEXT_PUBLIC_APP_URL` 변수 추가/수정
3. 값: `https://your-app-name.up.railway.app`
4. 자동으로 재배포됩니다

---

## 6. Clerk Webhook 설정

사용자 생성/수정 시 데이터베이스와 동기화하기 위해 Webhook을 설정합니다.

### 6.1 Clerk Dashboard에서 Webhook 생성

1. [Clerk Dashboard](https://dashboard.clerk.com) → **Webhooks** 메뉴
2. **"+ Add Endpoint"** 클릭
3. 다음 정보 입력:

| 필드 | 값 |
|------|-----|
| Endpoint URL | `https://your-app.up.railway.app/api/webhooks/clerk` |
| Message Filtering | `user.created`, `user.updated`, `user.deleted` 선택 |

4. **"Create"** 클릭

### 6.2 Webhook Secret 복사

1. 생성된 Webhook 클릭
2. **"Signing Secret"** 복사 (`whsec_...` 형식)
3. Railway 환경 변수에 추가:
   - Name: `CLERK_WEBHOOK_SECRET`
   - Value: `whsec_...` (복사한 값)

### 6.3 Webhook 테스트

1. Clerk Dashboard에서 **"Testing"** 탭
2. **"Send test webhook"** 클릭
3. Railway 로그에서 정상 수신 확인

---

## 7. 커스텀 도메인 설정 (선택)

### 7.1 Railway에서 도메인 추가

1. 앱 서비스 → **"Settings"** 탭
2. **"Domains"** 섹션에서 **"+ Custom Domain"** 클릭
3. 도메인 입력 (예: `booking.yourdomain.com`)

### 7.2 DNS 설정

도메인 등록 업체에서 CNAME 레코드 추가:

| Type | Name | Value |
|------|------|-------|
| CNAME | booking | `your-app.up.railway.app` |

### 7.3 Clerk 도메인 설정 업데이트

커스텀 도메인 사용 시:

1. Clerk Dashboard → **"Domains"** 메뉴
2. Production 도메인 추가
3. Webhook URL도 새 도메인으로 업데이트
4. Railway 환경 변수 `NEXT_PUBLIC_APP_URL`도 업데이트

---

## 8. 문제 해결

### 빌드 실패: Prisma 관련 오류

```
Error: Cannot find module '@prisma/client'
```

**해결**: `prisma generate`가 빌드 단계에서 실행되는지 확인. `railway.json`의 buildCommand 확인:

```json
{
  "build": {
    "buildCommand": "npx prisma generate && npm run build"
  }
}
```

### 데이터베이스 연결 실패

```
Error: Can't reach database server
```

**해결**:
1. PostgreSQL 서비스가 실행 중인지 확인
2. `DATABASE_URL` 환경 변수가 `${{Postgres.DATABASE_URL}}` 형식인지 확인
3. PostgreSQL과 앱 서비스가 같은 프로젝트에 있는지 확인

### Clerk 인증 오류

```
Error: Missing Clerk publishable key
```

**해결**:
1. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 환경 변수 확인
2. `NEXT_PUBLIC_` 접두사가 정확히 붙어있는지 확인
3. 값이 `pk_` 로 시작하는지 확인

### 배포 후 502 Bad Gateway

**해결**:
1. **Deployments** 탭에서 로그 확인
2. 시작 명령어 오류가 없는지 확인
3. 필수 환경 변수가 모두 설정되었는지 확인
4. `railway.json` 의 startCommand 확인

### Webhook 수신 실패

**해결**:
1. Webhook URL이 정확한지 확인 (`/api/webhooks/clerk`)
2. `CLERK_WEBHOOK_SECRET` 값이 정확한지 확인
3. Clerk Dashboard에서 Webhook 로그 확인

### 메모리 부족 오류

Railway 무료 티어는 메모리 제한이 있습니다:

**해결**:
1. Railway 유료 플랜 업그레이드
2. 또는 `.npmrc` 파일 추가:
   ```
   node-options=--max_old_space_size=512
   ```

---

## 배포 체크리스트

배포 전 확인사항:

- [ ] Railway 계정 생성 및 GitHub 연결
- [ ] Clerk 애플리케이션 생성 및 API 키 확인
- [ ] Web3Forms Access Key 생성
- [ ] PostgreSQL 데이터베이스 추가
- [ ] 모든 환경 변수 설정
- [ ] 배포 성공 확인
- [ ] `NEXT_PUBLIC_APP_URL` 업데이트
- [ ] Clerk Webhook 설정
- [ ] 회원가입/로그인 테스트
- [ ] 예약 기능 테스트

---

## 유용한 명령어

### Railway CLI 설치 (로컬 개발용)

```bash
# npm으로 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 로그 확인
railway logs

# 환경 변수 로컬에서 사용
railway run npm run dev
```

### 데이터베이스 마이그레이션 수동 실행

```bash
railway run npx prisma migrate deploy
```

### 데이터베이스 초기화 (주의: 모든 데이터 삭제)

```bash
railway run npx prisma migrate reset
```

---

## 추가 리소스

- [Railway 공식 문서](https://docs.railway.app)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 문서](https://clerk.com/docs)
- [Prisma 문서](https://www.prisma.io/docs)
