import { createServer } from 'node:http';

const statusLabels = { open: '모집 중', closed: '마감', assigned: '팀 배정 완료', ended: '종료' };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const formatUptime = (since) => {
  const seconds = Math.max(0, Math.floor((Date.now() - since) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}시간 ${minutes}분` : minutes ? `${minutes}분 ${seconds % 60}초` : `${seconds}초`;
};

const stateText = { starting: '연결 중', ready: '로그인 완료', error: '오류' };

function renderPage(status, sessions) {
  const state = status.state === 'ready' ? 'ready' : status.state === 'error' ? 'error' : 'starting';
  const rows = sessions.map((session) => `
      <tr>
        <td>${escapeHtml(session.game)}</td>
        <td><span class="chip">${escapeHtml(statusLabels[session.status] ?? session.status)}</span></td>
        <td>${session.participants.length}/${session.capacity}${session.waitlist.length ? ` <span class="muted">(대기 ${session.waitlist.length})</span>` : ''}</td>
        <td class="muted">${escapeHtml(session.hostId)}</td>
      </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>내전봇 상태</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 20px; background: #12141c; color: #e8eaf2;
    font-family: system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; }
  main { max-width: 760px; margin: 0 auto; display: grid; gap: 20px; }
  header { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  h1 { font-size: 22px; margin: 0; }
  .badge { padding: 5px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
  .badge.ready { background: #1d3b2a; color: #63e6a1; }
  .badge.starting { background: #3c331a; color: #f0c674; }
  .badge.error { background: #3d1f24; color: #ff8f9c; }
  .card { background: #1b1e2a; border: 1px solid #2a2f3f; border-radius: 14px; padding: 20px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
  .stats dt { font-size: 12px; color: #8b93a7; margin-bottom: 6px; }
  .stats dd { margin: 0; font-size: 17px; font-weight: 600; }
  h2 { font-size: 16px; margin: 0 0 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #262b39; }
  th { font-size: 12px; color: #8b93a7; font-weight: 600; }
  tr:last-child td { border-bottom: none; }
  .chip { background: #2a3145; padding: 3px 9px; border-radius: 6px; font-size: 12px; }
  .muted { color: #8b93a7; }
  .notice { border-left: 3px solid #ff8f9c; background: #241a1e; padding: 12px 14px; border-radius: 8px; font-size: 14px; }
  .hint { font-size: 13px; color: #8b93a7; line-height: 1.7; }
  code { background: #2a3145; padding: 2px 6px; border-radius: 5px; font-size: 12px; }
</style>
</head>
<body>
<main>
  <header>
    <h1>⚔️ 내전봇</h1>
    <span class="badge ${state}">${escapeHtml(stateText[state])}</span>
  </header>
  ${status.error ? `<div class="notice">${escapeHtml(status.error)}</div>` : ''}
  <section class="card">
    <dl class="stats">
      <div><dt>봇 계정</dt><dd>${escapeHtml(status.tag ?? '—')}</dd></div>
      <div><dt>참여 서버</dt><dd>${status.guildCount}개</dd></div>
      <div><dt>가동 시간</dt><dd>${escapeHtml(formatUptime(status.readyAt ?? status.startedAt))}</dd></div>
    </dl>
  </section>
  <section class="card">
    <h2>진행 중인 내전 모집</h2>
    ${sessions.length ? `<table>
      <thead><tr><th>게임</th><th>상태</th><th>참가 인원</th><th>방장</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>` : '<p class="muted">진행 중인 내전 모집이 없습니다.</p>'}
  </section>
  <p class="hint">
    Discord에서 <code>/내전 시작 인원:10 게임:리그 오브 레전드</code>로 모집을 열고, 모집 메시지의
    <code>참가</code> · <code>참가 취소</code> · <code>현황</code> 버튼으로 대기열을 관리합니다.
    방장 또는 서버 관리자가 <code>/내전 마감</code>, <code>/내전 팀나누기</code>, <code>/내전 종료</code>를 실행합니다.
  </p>
</main>
</body>
</html>`;
}

// Base44 preview only: exposes a read-only status page so the bot process is visible on port 3000.
export function startStatusServer({ store, status, port = Number(process.env.PREVIEW_STATUS_PORT ?? 3000) }) {
  const server = createServer((request, response) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    if (!['/', '/index.html'].includes(pathname)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('찾을 수 없는 경로입니다.');
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    response.end(renderPage(status, store.listSessions()));
  });
  server.listen(port, '0.0.0.0', () => console.log(`상태 페이지를 http://0.0.0.0:${port} 에서 제공합니다.`));
  return server;
}
