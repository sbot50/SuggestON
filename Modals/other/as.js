const Discord = require("discord.js");
const {
  PermissionsBitField,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  dontDefer: true,
  async submit({ client, channel, guild, member, interaction, db }) {
    let message = interaction.message;
    let guilddb = await db.read(guild.id);
    let link = message.embeds[0].author.iconURL.split("?")[1];
    let urlParams = new URLSearchParams("?" + link);
    let cid = channel.id;
    if (!(channel.id in guilddb)) {
      cid = urlParams.get("sc");
    }
    let channeldb = guilddb[cid];
    let embed = message.embeds[0];
    embed = EmbedBuilder.from(embed);
    let reason = interaction.fields.getTextInputValue("reason");
    if (reason && reason.length > 0) {
      embed.addFields([
        {
          name: "Accepted by " + member.user.username,
          value: reason,
        },
      ]);
    } else {
      embed.addFields([
        {
          name: "​",
          value: "**Accepted by " + member.user.username + "**",
        },
      ]);
    }
    let attachments = message.attachments;
    if (channeldb.acceptchannel != undefined) {
      await interaction.editReply({
        content: " ",
        embeds: [embed],
        files: attachments,
        components: [],
      });
      if (channeldb.delete && channeldb.delete.includes("accepted")) {
        await message.delete();
      }
      let acceptchannel = await guild.channels.fetch(channeldb.acceptchannel);
      acceptchannel.send({ content: " ", embeds: [embed], files: attachments });
    } else {
      await interaction.editReply({
        content: " ",
        embeds: [embed],
        files: attachments,
        components: [],
      });
    }
    if (urlParams.get("message") != null) {
      let channel = channeldb[urlParams.get("channel") + "channel"];
      channel = await guild.channels.fetch(channel);
      let message = await channel.messages.fetch(urlParams.get("message"));
      if (channeldb.acceptchannel != undefined) {
        await message.edit({
          content: " ",
          embeds: [embed],
          files: attachments,
          components: [],
        });
        if (channeldb.delete && channeldb.delete.includes("accepted")) {
          await message.delete();
        }
      } else {
        await message.edit({
          content: " ",
          embeds: [embed],
          files: attachments,
          components: [],
        });
      }
    }
  },
};
