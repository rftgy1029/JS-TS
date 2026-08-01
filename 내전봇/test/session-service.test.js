import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainError, SessionService } from '../src/session-service.js';

class MemoryStore {
  constructor() { this.sessions = new Map(); this.members = new Map(); this.nextId = 1; }
  createSession(data) { const id = this.nextId++; this.sessions.set(data.guildId, { ...data, id, status: 'open', messageId: null, blueTeam: [], redTeam: [] }); this.members.set(id, []); return { id }; }
  getSession(guildId) { const session = this.sessions.get(guildId); if (!session) return null; const members = this.members.get(session.id); return { ...session, participants: members.filter((m) => m.role === 'participant'), waitlist: members.filter((m) => m.role === 'waitlist') }; }
  addMember(id, userId, role) { this.members.get(id).push({ userId, role }); }
  removeMember(id, userId) { this.members.set(id, this.members.get(id).filter((m) => m.userId !== userId)); }
  promoteMember(id, userId) { this.members.get(id).find((m) => m.userId === userId).role = 'participant'; }
  setStatus(id, status) { this.find(id).status = status; }
  setMessage(id, channelId, messageId) { Object.assign(this.find(id), { channelId, messageId }); }
  saveTeams(id, blueTeam, redTeam) { Object.assign(this.find(id), { blueTeam, redTeam }); }
  deleteSession(id) { const session = this.find(id); this.sessions.delete(session.guildId); this.members.delete(id); }
  find(id) { return [...this.sessions.values()].find((session) => session.id === id); }
}
const setup = () => new SessionService(new MemoryStore(), { random: () => 0 });
const newSession = (service) => service.create({ guildId: 'guild', channelId: 'channel', hostId: 'host', game: '롤', capacity: 4 });

test('모집 정원 도달 시 자동 마감한다', () => { const service = setup(); newSession(service); service.join('guild', 'a'); service.join('guild', 'b'); const session = service.join('guild', 'c'); assert.equal(session.status, 'closed'); assert.equal(session.participants.length, 4); });
test('대기자는 참가자 취소 시 자동 승격한다', () => { const service = setup(); newSession(service); for (const id of ['a', 'b', 'c', 'wait']) service.join('guild', id); const session = service.cancel('guild', 'b'); assert.equal(session.status, 'closed'); assert.deepEqual(session.participants.map((m) => m.userId), ['host', 'a', 'c', 'wait']); assert.equal(session.waitlist.length, 0); });
test('중복 참가와 권한 없는 운영을 차단한다', () => { const service = setup(); newSession(service); assert.throws(() => service.join('guild', 'host'), DomainError); assert.throws(() => service.close('guild', 'stranger', false), DomainError); });
test('정원이 찬 마감 모집만 균등하게 팀을 나눈다', () => { const service = setup(); newSession(service); for (const id of ['a', 'b', 'c']) service.join('guild', id); const session = service.assign('guild', 'host', false); assert.equal(session.status, 'assigned'); assert.equal(session.blueTeam.length, 2); assert.equal(session.redTeam.length, 2); assert.equal(new Set([...session.blueTeam, ...session.redTeam]).size, 4); });
test('모집 메시지를 다시 표시하면 새 채널과 메시지를 갱신 대상으로 저장한다', () => { const service = setup(); newSession(service); const session = service.setMessage('guild', 'new-channel', 'new-message'); assert.equal(session.channelId, 'new-channel'); assert.equal(session.messageId, 'new-message'); });
