const Discord = require("discord.js");
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('botstats')
	  .setDescription('Gets the bot\'s stats!'),
  permissions: [],
  async execute({client,interaction}) {
    let channel = client.guilds.cache.get("677976964535156746").channels.cache.get("678325599810617344")
    let lastmsgs = await channel.messages.fetch();
    lastmsgs = lastmsgs.filter(m => m.content.split("\n")[0].includes(client.user.username))
    let lastmsg = lastmsgs.first();
    let version = /v\d\.\d\.\d/.exec(lastmsg.content)[0];
    let date = /\d+\/\d+\/\d+/.exec(lastmsg.content)[0];
    let embed = new EmbedBuilder()
      .setColor(0x1cd0ce)
      .addFields([
        {
          name: "**Name/Tag**",
          value: "<@" + client.user.id + ">",
          inline: true
        },
        {
          name: "**ID**",
          value: client.user.id,
          inline: true
        },
        {
          name: "_ _",
          value: "[Invite](https://lnk.repl.co/qMO)",
          inline: true
        },
        {
          name: "**Version**",
          value: version,
          inline: true
        },
        {
          name: "**Update Date**",
          value: date,
          inline: true
        },
        {
          name: "**Guilds**",
          value: client.guilds.cache.size.toString(),
          inline: true
        },
        {
          name: "**Latest Update Log**",
          value: "```\n" + lastmsg.content + "\n```"
        }
      ])
    await interaction.editReply({ content: " ", embeds: [embed] });
  }
};