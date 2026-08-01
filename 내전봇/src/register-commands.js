import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

for (const key of ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID']) {
  if (!process.env[key]) throw new Error(`.env에 ${key} 값을 설정해 주세요.`);
}
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
console.log('슬래시 명령어를 개발 서버에 등록했습니다.');
