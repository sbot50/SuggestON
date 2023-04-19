const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function capfirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  data: new SlashCommandBuilder()
	  .setName('delemote')
	  .setDescription('Delete a custom emoji from a suggestionchannel!')
	  .addChannelOption(option => 
      option
        .setName('suggestchannel')
        .setDescription('The suggestion channel.')
        .setRequired(true)
    )
    .addStringOption(option => 
      option
        .setName('emoji')
        .setDescription('The emoji.')
        .setRequired(true)
    ),
  permissions: [],
  async execute({client,member,guild,args,interaction,db}) {
    if (!member.permissions.has([PermissionsBitField.Flags.ManageMessages])) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "You aren't permitted to use this command! You need 'Manage Messages'"
          }
        ])
      await interaction.editReply({ content: " ", embeds: [embed], ephemeral: true }).then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
      return;
    };
    let guilddb = await db.read(guild.id);
    let channel = await guild.channels.fetch(args.suggestchannel);
    if (!(channel.id in guilddb)) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addField("**ERROR**","That channel isn't in the db!")
      await interaction.editReply({ content: " ", embeds: [embed] }).then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
      return;
    }
    let channeldb = guilddb[channel.id];
    let suggestchannel = args.suggestchannel;
    let emoji = args.emoji;
    if ((emoji?.match(/\p{Emoji}/u) == null || emoji != emoji?.match(/\p{Emoji}/u)[0]) && (emoji?.match(/\<\:[A-z0-9]+\:[0-9]+\>/) == null || emoji != emoji?.match(/\<\:[A-z0-9]+\:[0-9]+\>/)[0])) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addField("**ERROR**","You didn't input a valid emoji!")
      await interaction.editReply({ content: " ", embeds: [embed] }).then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
      return;
    }
    if (emoji == emoji?.match(/\<\:[A-z0-9]+\:[0-9]+\>/)[0]) {
      emoji = emoji.replace(/\<\:[A-z0-9]+\:/, "").replace(">","");
    }
    delete channeldb.custom[emoji];
    guilddb[channel.id] = channeldb;
    await db.write(guild.id, guilddb);
    let embed = new EmbedBuilder()
      .setColor(0x1cd0ce)
      .setDescription("**Removed emoji!**")
      .addFields([
        {
          name: "**Emoji**",
          value: args.emoji
        }
      ])
    await interaction.editReply({ content: " ", embeds: [embed] });
  }
};