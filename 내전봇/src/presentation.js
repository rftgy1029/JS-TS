import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const statusText = { open: '모집 중', closed: '마감', assigned: '팀 배정 완료', ended: '종료' };
const mentionList = (members) => members.length ? members.map((member, index) => `${index + 1}. <@${member.userId}>`).join('\n') : '없음';

export function buildSessionMessage(session) {
  const remaining = Math.max(0, session.capacity - session.participants.length);
  const embed = new EmbedBuilder()
    .setColor(session.status === 'assigned' ? 0x9b59b6 : session.status === 'closed' ? 0xe67e22 : 0x3498db)
    .setTitle(`⚔️ ${session.game} 내전 모집`)
    .addFields(
      { name: '방장', value: `<@${session.hostId}>`, inline: true },
      { name: '모집 상태', value: statusText[session.status], inline: true },
      { name: '참가 인원', value: `${session.participants.length}/${session.capacity}`, inline: true },
      { name: '참가자', value: mentionList(session.participants) },
      { name: '대기자', value: mentionList(session.waitlist) },
    )
    .setFooter({ text: session.status === 'open' ? `${remaining}명이 더 필요합니다.` : session.status === 'closed' && session.participants.length === session.capacity ? '정원이 찼습니다. 참가하면 대기열에 등록됩니다.' : '방장 또는 서버 관리자가 운영할 수 있습니다.' });

  if (session.status === 'assigned') {
    embed.addFields(
      { name: '🔵 블루팀', value: session.blueTeam.map((id, i) => `${i + 1}. <@${id}>`).join('\n') || '없음', inline: true },
      { name: '🔴 레드팀', value: session.redTeam.map((id, i) => `${i + 1}. <@${id}>`).join('\n') || '없음', inline: true },
    );
  }

  const joinDisabled = session.status === 'assigned' || (session.status === 'closed' && session.participants.length < session.capacity);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('naejun:join').setLabel('✅ 참가').setStyle(ButtonStyle.Success).setDisabled(joinDisabled),
    new ButtonBuilder().setCustomId('naejun:cancel').setLabel('❌ 참가 취소').setStyle(ButtonStyle.Danger).setDisabled(session.status === 'assigned'),
    new ButtonBuilder().setCustomId('naejun:status').setLabel('📋 현황').setStyle(ButtonStyle.Secondary),
  );
  return { embeds: [embed], components: [row] };
}

export function buildEndedSessionMessage(session) {
  const embed = new EmbedBuilder()
    .setColor(0x95a5a6)
    .setTitle(`🏁 ${session.game} 내전 모집`)
    .setDescription('이 내전은 종료되었습니다.')
    .addFields(
      { name: '방장', value: `<@${session.hostId}>`, inline: true },
      { name: '최종 참가 인원', value: `${session.participants.length}/${session.capacity}`, inline: true },
      { name: '참가자', value: mentionList(session.participants) },
    );
  return { embeds: [embed], components: [] };
}
