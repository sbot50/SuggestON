const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('removechannel')
	  .setDescription('Removes a suggestion channel from the database.')
    .addChannelOption(option => 
      option
        .setName('suggestchannel')
        .setDescription('The suggestion channel.')
        .setRequired(true)
    ),
  permissions: [],
  async execute({client,member,args,guild,interaction,db}) {
    if (!member.permissions.has([PermissionsBitField.Flags.ManageChannels])) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "You aren't permitted to use this command! You need 'Manage Channels'"
          }
        ])
      await interaction.editReply({ content: " ", embeds: [embed], ephemeral: true }).then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
      return;
    } else {
      let suggestchannel = args.suggestchannel
      let guilddb;
      if (!db.has(guild.id)) {
        let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "That channel isn't in the database!"
          }
        ])
        await interaction.editReply({ content: " ", embeds: [embed], ephemeral: true }).then((message) => {
          setTimeout(function () {
            message.delete();
          }, 5000);
        });
        return;
      } else {
        guilddb = await db.read(guild.id);
        if (!(suggestchannel in guilddb)) {
          let embed = new EmbedBuilder()
            .setColor(0xa31600)
            .addFields([
              {
                name: "**ERROR**",
                value: "That channel isn't in the database!"
              }
            ])
          await interaction.editReply({ content: " ", embeds: [embed], ephemeral: true }).then((message) => {
            setTimeout(function () {
              message.delete();
            }, 5000);
          });
          return;
        }
      }
      delete guilddb[args.suggestchannel];
      await db.write(guild.id,guilddb);
      let embed = new EmbedBuilder()
        .setColor(0x1cd0ce)
        .setDescription("removed <#" + suggestchannel + "> from the database, it is no longer a suggestion channel!")
      await interaction.editReply({ content: " ", embeds: [embed] });
    }
  }
};