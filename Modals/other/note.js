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
    let embed = message.embeds[0];
    let note = interaction.fields.getTextInputValue("note");
    let notefield = embed.fields.filter((field) =>
      field.name.startsWith("Note by ")
    )[0];
    if (notefield) {
      let index;
      for (let i = 0; i < embed.fields.length; i++) {
        if (embed.fields[i].name == notefield.name) {
          index = i;
          break;
        }
      }
      embed.fields[index].name = "Note by " + member.user.username;
      embed.fields[index].value = note;
    } else {
      embed = EmbedBuilder.from(embed);
      embed.addFields([
        {
          name: "Note by " + member.user.username,
          value: note,
        },
      ]);
    }
    await interaction.editReply({
      embeds: [embed],
    });
  },
};
