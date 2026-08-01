import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder().setName('내전').setDescription('내전 모집을 관리합니다.')
    .addSubcommand((command) => command.setName('시작').setDescription('새 내전 모집을 시작합니다.')
      .addIntegerOption((option) => option.setName('인원').setDescription('2~20명 사이의 짝수').setRequired(true).setMinValue(2).setMaxValue(20))
      .addStringOption((option) => option.setName('게임').setDescription('내전 게임 이름').setRequired(true).setMaxLength(100)))
    .addSubcommand((command) => command.setName('마감').setDescription('현재 모집을 마감합니다.'))
    .addSubcommand((command) => command.setName('팀나누기').setDescription('참가자를 무작위 두 팀으로 나눕니다.'))
    .addSubcommand((command) => command.setName('종료').setDescription('현재 내전을 종료합니다.')),
  new SlashCommandBuilder().setName('내전현황').setDescription('진행 중인 내전 모집 메시지를 다시 표시합니다.'),
].map((command) => command.toJSON());
