const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
		.setName('embedcolor')
	  .setDescription('Set the color of the suggestion embed!')
    .addChannelOption(option => 
      option
        .setName('suggestchannel')
        .setDescription('The suggestion channel.')
        .setRequired(true)
    )
    .addStringOption(option => 
      option
        .setName('hex')
        .setDescription('The hex color.')
        .setRequired(true)
    ),
  permissions: [],
  async execute({client,args,guild,member,interaction,db}) {
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
    }
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
    let channeldb = guilddb[suggestchannel]
    let color = args.hex;
    color = color.replace("#","")
    if (!(/[A-Za-z0-9]+/.test(color)) || color.length < 6) {
      let embed = new EmbedBuilder()
            .setColor(0xa31600)
            .addFields([
              {
                name: "**ERROR**",
                value: "That isn't a valid hex color!"
              }
            ])
          await interaction.editReply({ content: " ", embeds: [embed], ephemeral: true }).then((message) => {
            setTimeout(function () {
              message.delete();
            }, 5000);
          });
      return;
    }
    channeldb.hex = "#" + color;
    guilddb[suggestchannel] = channeldb;
    await db.write(guild.id, guilddb);
    let embed = new EmbedBuilder()
      .setColor(0x1cd0ce)
      .setDescription(`${channeldb.hex} is now the embedcolor!`)
    await interaction.editReply({ content: " ", embeds: [embed] });
  }
};