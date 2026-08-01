export class DomainError extends Error {}

export class SessionService {
  constructor(store, { random = Math.random } = {}) {
    this.store = store;
    this.random = random;
  }

  get(guildId) {
    return this.store.getSession(guildId);
  }

  create({ guildId, channelId, hostId, game, capacity }) {
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 20 || capacity % 2 !== 0) {
      throw new DomainError('모집 인원은 2명부터 20명 사이의 짝수여야 합니다.');
    }
    if (!game?.trim()) throw new DomainError('게임 이름을 입력해 주세요.');
    if (this.get(guildId)) throw new DomainError('이미 진행 중인 내전 모집이 있습니다.');

    const session = this.store.createSession({ guildId, channelId, hostId, game: game.trim(), capacity });
    this.store.addMember(session.id, hostId, 'participant');
    return this.get(guildId);
  }

  join(guildId, userId) {
    const session = this.requireSession(guildId);
    if (session.status === 'assigned' || (session.status === 'closed' && session.participants.length < session.capacity)) {
      throw new DomainError('모집이 마감되어 참가할 수 없습니다.');
    }
    if (session.participants.some((member) => member.userId === userId) || session.waitlist.some((member) => member.userId === userId)) {
      throw new DomainError('이미 참가자 또는 대기자로 등록되어 있습니다.');
    }
    this.store.addMember(session.id, userId, session.participants.length < session.capacity ? 'participant' : 'waitlist');
    const updated = this.get(guildId);
    if (updated.participants.length === updated.capacity) this.store.setStatus(updated.id, 'closed');
    return this.get(guildId);
  }

  cancel(guildId, userId) {
    const session = this.requireSession(guildId);
    if (session.status === 'assigned') throw new DomainError('팀 배정 후에는 참가를 취소할 수 없습니다.');
    const role = session.participants.some((member) => member.userId === userId) ? 'participant' : session.waitlist.some((member) => member.userId === userId) ? 'waitlist' : null;
    if (!role) throw new DomainError('참가자 또는 대기자로 등록되어 있지 않습니다.');

    this.store.removeMember(session.id, userId);
    if (role === 'participant') {
      const firstWaiter = session.waitlist[0];
      if (firstWaiter) this.store.promoteMember(session.id, firstWaiter.userId);
    }
    const updated = this.get(guildId);
    this.store.setStatus(session.id, updated.participants.length === updated.capacity ? 'closed' : 'open');
    return this.get(guildId);
  }

  close(guildId, actorId, isAdmin) {
    const session = this.requireOperator(guildId, actorId, isAdmin);
    if (session.status !== 'open') throw new DomainError('이미 모집이 마감되었거나 팀이 배정되었습니다.');
    this.store.setStatus(session.id, 'closed');
    return this.get(guildId);
  }

  assign(guildId, actorId, isAdmin) {
    const session = this.requireOperator(guildId, actorId, isAdmin);
    if (session.status !== 'closed') throw new DomainError('모집을 먼저 마감해 주세요.');
    if (session.participants.length !== session.capacity) throw new DomainError('정원이 모두 모여야 팀을 나눌 수 있습니다.');
    const shuffled = [...session.participants];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    const split = shuffled.length / 2;
    this.store.saveTeams(session.id, shuffled.slice(0, split).map((member) => member.userId), shuffled.slice(split).map((member) => member.userId));
    this.store.setStatus(session.id, 'assigned');
    return this.get(guildId);
  }

  end(guildId, actorId, isAdmin) {
    const session = this.requireOperator(guildId, actorId, isAdmin);
    this.store.deleteSession(session.id);
    return session;
  }

  setMessage(guildId, channelId, messageId) {
    const session = this.requireSession(guildId);
    this.store.setMessage(session.id, channelId, messageId);
    return this.get(guildId);
  }

  requireSession(guildId) {
    const session = this.get(guildId);
    if (!session) throw new DomainError('진행 중인 내전 모집이 없습니다.');
    return session;
  }

  requireOperator(guildId, actorId, isAdmin) {
    const session = this.requireSession(guildId);
    if (session.hostId !== actorId && !isAdmin) throw new DomainError('모집 방장 또는 서버 관리자만 사용할 수 있습니다.');
    return session;
  }
}
