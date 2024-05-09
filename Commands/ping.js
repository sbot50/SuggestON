const Discord = require('discord.js');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('ping')
	  .setDescription('Returns the bots ping!'),
  permissions: [],
  async execute({client,interaction}) {
    let embed = new EmbedBuilder()
      .setColor(0x1cd0ce)
      .setDescription('🏓 pong\n' + client.ws.ping + ' ms')
    console.log("test");
    console.log(interaction);
    console.log(interaction.editReply)
    await interaction.editReply({ content: " ", embeds: [embed] });
    console.log("should have replied!");
  }
};