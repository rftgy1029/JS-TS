import 'dotenv/config';
import { Client, Events, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { SqliteStore } from './sqlite-store.js';
import { DomainError, SessionService } from './session-service.js';
import { buildEndedSessionMessage, buildSessionMessage } from './presentation.js';

if (!process.env.DISCORD_TOKEN) throw new Error('.env에 DISCORD_TOKEN을 설정해 주세요.');

const store = new SqliteStore();
const sessions = new SessionService(store);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const isAdmin = (interaction) => interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;

async function refreshMessage(session) {
  if (!session?.messageId) return;
  try {
    const channel = await client.channels.fetch(session.channelId);
    if (!channel?.isTextBased()) return;
    const message = await channel.messages.fetch(session.messageId);
    await message.edit(buildSessionMessage(session));
  } catch (error) {
    console.warn('모집 메시지 갱신 실패:', error.message);
  }
}

async function endMessage(session) {
  if (!session?.messageId) return;
  try {
    const channel = await client.channels.fetch(session.channelId);
    if (!channel?.isTextBased()) return;
    const message = await channel.messages.fetch(session.messageId);
    await message.edit(buildEndedSessionMessage(session));
  } catch (error) {
    console.warn('종료 메시지 갱신 실패:', error.message);
  }
}

client.once(Events.ClientReady, (readyClient) => console.log(`${readyClient.user.tag} 로그인 완료`));

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.guildId) {
      await interaction.reply({ content: '이 봇은 서버에서만 사용할 수 있습니다.', ephemeral: true });
      return;
    }
    if (interaction.isButton()) {
      await handleButton(interaction);
      return;
    }
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === '내전') await handleCommand(interaction);
      if (interaction.commandName === '내전현황') await handleStatusCommand(interaction);
    }
  } catch (error) {
    console.error(error);
    const content = error instanceof DomainError ? error.message : '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    try {
      if (interaction.replied || interaction.deferred) await interaction.followUp({ content, ephemeral: true });
      else await interaction.reply({ content, ephemeral: true });
    } catch (replyError) {
      console.error('오류 안내 전송 실패:', replyError);
    }
  }
});

async function handleCommand(interaction) {
  const action = interaction.options.getSubcommand();
  if (action === '시작') {
    const session = sessions.create({ guildId: interaction.guildId, channelId: interaction.channelId, hostId: interaction.user.id, game: interaction.options.getString('게임', true), capacity: interaction.options.getInteger('인원', true) });
    const response = await interaction.reply({ ...buildSessionMessage(session), withResponse: true });
    const message = response.resource?.message ?? await interaction.fetchReply();
    sessions.setMessage(interaction.guildId, interaction.channelId, message.id);
    return;
  }
  if (action === '마감') {
    const session = sessions.close(interaction.guildId, interaction.user.id, isAdmin(interaction));
    await refreshMessage(session);
    return interaction.reply('🔒 모집을 마감했습니다.');
  }
  if (action === '팀나누기') {
    const session = sessions.assign(interaction.guildId, interaction.user.id, isAdmin(interaction));
    await refreshMessage(session);
    return interaction.reply('✅ 팀 배정을 완료했습니다.');
  }
  const ended = sessions.end(interaction.guildId, interaction.user.id, isAdmin(interaction));
  await endMessage(ended);
  return interaction.reply('🏁 현재 내전을 종료했습니다. 이제 새 모집을 시작할 수 있습니다.');
}

async function handleStatusCommand(interaction) {
  const session = sessions.requireSession(interaction.guildId);
  const response = await interaction.reply({ ...buildSessionMessage(session), withResponse: true });
  const message = response.resource?.message ?? await interaction.fetchReply();
  sessions.setMessage(interaction.guildId, interaction.channelId, message.id);
}

async function handleButton(interaction) {
  if (!interaction.customId.startsWith('naejun:')) return;
  const action = interaction.customId.split(':')[1];
  if (action === 'status') {
    const session = sessions.requireSession(interaction.guildId);
    return interaction.reply({ ...buildSessionMessage(session), ephemeral: true });
  }
  const session = action === 'join' ? sessions.join(interaction.guildId, interaction.user.id) : sessions.cancel(interaction.guildId, interaction.user.id);
  await interaction.update(buildSessionMessage(session));
}

client.login(process.env.DISCORD_TOKEN);
