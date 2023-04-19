const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('suggestcancel')
	  .setDescription('Send a note in a suggestion channelk without it being made into a suggestion.')
    .addStringOption(option => 
      option
        .setName('text')
        .setDescription('Text to send.')
        .setRequired(true)
    ),
  permissions: [],
  async execute({client,args,guild,channel,member,interaction,db}) {
    if (!member.permissions.has([PermissionsBitField.Flags.ManageMessages])) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "You aren't permitted to use this command! You need 'Manage Messages'"
          }
        ])
      await interaction.editReply({ content: " ", embeds: [embed], ephemeral: true }).then(message => {
  setTimeout(function () {
    message.delete();
  }, 5000);
})
      return;
    }
    let guilddb = await db.read(guild.id);
    if (!(channel.id in guilddb)) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "This channel isn't a suggestion channel, or isn't in the database!"
          }
        ])
      await interaction.editReply({ content: " ", embeds: [embed], ephemeral: true }).then(message => {
  setTimeout(function () {
    message.delete();
  }, 5000);
})
      return;
    }
    let embed = new EmbedBuilder()
      .setColor(0x1cd0ce)
      .setAuthor({ name: member.user.username + "#" + member.user.discriminator, iconURL: member.user.avatarURL() })
      .addFields([
        {
          name: "**Message:**",
          value: args.text
        }
      ])
    await interaction.editReply({ content: " ", embeds: [embed] });
  }
};