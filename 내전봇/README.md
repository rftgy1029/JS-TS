# 내전 모집 디스코드 봇

버튼으로 참가자를 모으고, 대기열을 관리하며, 인원이 모두 모이면 랜덤으로 두 팀을 나누는 디스코드 봇입니다.

## 시작하기

1. Node.js 20 이상을 설치합니다.
2. `npm install`을 실행합니다.
3. `.env.example`을 복사해 `.env`로 이름을 바꾸고 `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`를 입력합니다.
4. `npm run register`로 슬래시 명령어를 개발 서버에 등록합니다.
5. `npm start`로 봇을 실행합니다.

## Discord 설정

Discord Developer Portal에서 애플리케이션을 만든 뒤 **Bot** 메뉴에서 토큰을 발급합니다. OAuth2 > URL Generator에서 `bot`, `applications.commands` 범위를 고르고, 봇에는 최소한 View Channels, Send Messages, Embed Links, Read Message History 권한을 부여하세요.

## 명령어

- `/내전 시작 인원:10 게임:리그 오브 레전드`
- `/내전 마감`
- `/내전 팀나누기`
- `/내전 종료`
- `/내전현황` — 삭제된 모집 임베드를 현재 채널에 다시 표시합니다.

모집 메시지의 `참가`, `참가 취소`, `현황` 버튼을 사용합니다. 모집을 시작한 방장과 서버 관리 권한 보유자만 마감·팀 배정·종료를 할 수 있습니다.

## 테스트

`npm test`는 Discord 연결 없이 모집·대기열·마감·팀 배정 규칙을 확인합니다.
