const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  dontDefer: true,
  async click({ client, channel, guild, member, interaction, db }) {
    if (!member.permissions.has([PermissionsBitField.Flags.ManageMessages])) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "You aren't permitted to use this command! You need 'Manage Messages'"
          }
        ])
      await interaction.deferUpdate();
      await interaction.editReply({ content: " " });
      await interaction.followUp({ content: " ", embeds: [embed], ephemeral: true }) .then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
      return;
    };
    if (!db.has(guild.id)) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "This discord isn't in my database anymore!"
          }
        ])
      await interaction.deferUpdate();
      await interaction.editReply({ content: " " });
      await interaction.followUp({ content: " ", embeds: [embed], ephemeral: true }).then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
      return;
    };
    let message = interaction.message
    let guilddb = await db.read(guild.id);
    let link = message.embeds[0].author.iconURL.split("?")[1];
    let urlParams = new URLSearchParams("?" + link);
    if (!(channel.id in guilddb) && urlParams.get("sc") == null) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "This channel isn't in my database anymore!"
          }
        ])
      await interaction.deferUpdate();
      await interaction.editReply({ content: " " }).then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
      await interaction.followUp({ content: " ", embeds: [embed], ephemeral: true });
      return;
    };
		let modal = new ModalBuilder()
      .setCustomId('note')
      .setTitle('Add Note');

    let reason = new TextInputBuilder()
      .setCustomId('note')
      .setLabel("Note")
      .setStyle(TextInputStyle.Paragraph)

    let reasonInput = new ActionRowBuilder().addComponents(reason);
    modal.addComponents(reasonInput);
    interaction.showModal(modal);
  }
};