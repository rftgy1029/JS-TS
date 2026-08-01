import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class SqliteStore {
  constructor(filename = 'data/naejun.db') {
    mkdirSync(dirname(filename), { recursive: true });
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL UNIQUE, channel_id TEXT NOT NULL,
        message_id TEXT, host_id TEXT NOT NULL, game TEXT NOT NULL, capacity INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'open', blue_team TEXT, red_team TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS members (
        session_id INTEGER NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL,
        position INTEGER NOT NULL, PRIMARY KEY (session_id, user_id),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);
  }

  createSession({ guildId, channelId, hostId, game, capacity }) {
    const result = this.db.prepare('INSERT INTO sessions (guild_id, channel_id, host_id, game, capacity) VALUES (?, ?, ?, ?, ?)').run(guildId, channelId, hostId, game, capacity);
    return { id: Number(result.lastInsertRowid) };
  }
  getSession(guildId) {
    const row = this.db.prepare('SELECT * FROM sessions WHERE guild_id = ?').get(guildId);
    return row ? this.hydrate(row) : null;
  }
  hydrate(row) {
    const members = this.db.prepare('SELECT user_id AS userId, role FROM members WHERE session_id = ? ORDER BY role, position').all(row.id);
    return { id: row.id, guildId: row.guild_id, channelId: row.channel_id, messageId: row.message_id, hostId: row.host_id, game: row.game, capacity: row.capacity, status: row.status,
      participants: members.filter((member) => member.role === 'participant'), waitlist: members.filter((member) => member.role === 'waitlist'),
      blueTeam: row.blue_team ? JSON.parse(row.blue_team) : [], redTeam: row.red_team ? JSON.parse(row.red_team) : [] };
  }
  addMember(sessionId, userId, role) {
    const position = this.db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS next FROM members WHERE session_id = ? AND role = ?').get(sessionId, role).next;
    this.db.prepare('INSERT INTO members (session_id, user_id, role, position) VALUES (?, ?, ?, ?)').run(sessionId, userId, role, position);
  }
  removeMember(sessionId, userId) { this.db.prepare('DELETE FROM members WHERE session_id = ? AND user_id = ?').run(sessionId, userId); }
  promoteMember(sessionId, userId) {
    const position = this.db.prepare("SELECT COALESCE(MAX(position), 0) + 1 AS next FROM members WHERE session_id = ? AND role = 'participant'").get(sessionId).next;
    this.db.prepare("UPDATE members SET role = 'participant', position = ? WHERE session_id = ? AND user_id = ?").run(position, sessionId, userId);
  }
  setStatus(id, status) { this.db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, id); }
  setMessage(id, channelId, messageId) { this.db.prepare('UPDATE sessions SET channel_id = ?, message_id = ? WHERE id = ?').run(channelId, messageId, id); }
  saveTeams(id, blueTeam, redTeam) { this.db.prepare('UPDATE sessions SET blue_team = ?, red_team = ? WHERE id = ?').run(JSON.stringify(blueTeam), JSON.stringify(redTeam), id); }
  deleteSession(id) { this.db.prepare('DELETE FROM members WHERE session_id = ?').run(id); this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id); }
  close() { this.db.close(); }
}
