# AGENTS.md

## 저장소 구조
- `내전봇/` — 실행 대상인 Node.js(ESM) 디스코드 봇. 봇 실행은 `npm start`, 도메인 로직 테스트는 `npm test`(`node --test`).
- `TestDrive/` — 봇과 무관한 연습용 파일입니다.
- 최상위에는 `package.json`이 없습니다. `npm` 명령은 반드시 `내전봇/`에서 실행해야 합니다(루트에서 실행하면 실패).

## Base44 개발 환경
- 실행: `docker compose -f docker-compose.base44.yml up -d` (컨테이너: `app-bot-1`).
- `내전봇/`을 컨테이너 `/app`에 바인드 마운트하고 `node --watch src/index.js`로 실행하므로 소스 수정이 자동 반영됩니다. 의존성은 `naejun_node_modules` 볼륨에 시작할 때 `npm ci`로 설치되며, `better-sqlite3`는 프리빌트 바이너리를 사용하므로 빌드 도구가 필요 없습니다.
- SQLite DB는 `naejun_data` 볼륨의 `/app/data/naejun.db`에 저장됩니다(컨테이너를 지워도 데이터 유지, 이 볼륨을 지우면 모집 데이터가 사라집니다).
- 디스코드 봇에는 원래 웹 UI가 없습니다. 미리보기에서 봇 상태를 볼 수 있도록 `BASE44_PREVIEW_MODE=1`일 때만 `src/status-server.js`가 포트 3000에 읽기 전용 상태 페이지(로그인 상태, 참여 서버 수, 진행 중인 모집 목록)를 띄웁니다. 값이 없거나 `1`이 아니면 상태 페이지를 띄우지 않고, 토큰이 없으면 원래처럼 즉시 오류를 던지며 종료합니다.
- compose healthcheck는 그 상태 페이지(`/`)를 확인합니다(미리보기 모드 전제).

## 시크릿
- `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`는 사용자가 Discord Developer Portal에서 발급합니다. `/run/base44/app.env`로 전달되며 compose `env_file`의 마지막 항목으로 주입됩니다. 값이 없어도 봇은 부팅되고 상태 페이지에 오류가 표시됩니다.
- 슬래시 명령어 등록은 봇 실행 후 한 번만: `docker compose -f docker-compose.base44.yml exec bot npm run register`
- `.env` 파일 없이 동작합니다(`dotenv`는 조용히 넘어가고, 이미 설정된 프로세스 환경변수를 덮어쓰지 않습니다).

## 확인 방법
- `curl -fsS http://localhost:3000/` → 상태 페이지 HTML(제목 `내전봇 상태`).
- `docker compose -f docker-compose.base44.yml exec bot npm test` → 도메인 테스트 5개 통과.
- 로그인 성공 로그: `<봇태그> 로그인 완료`.
