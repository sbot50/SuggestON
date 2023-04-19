const {
  PermissionsBitField,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("toggle")
    .setDescription("Disable/(re-)enable features of the bot.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("self")
        .setDescription("Toggle if people can react to their own suggestions.")
        .addChannelOption((option) =>
          option
            .setName("suggestchannel")
            .setDescription("The suggestion channel.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("thread")
        .setDescription("Toggle if treads are created for suggestions.")
        .addChannelOption((option) =>
          option
            .setName("suggestchannel")
            .setDescription("The suggestion channel.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deletion")
        .setDescription("Toggle if accepted/denied/popular messages get deleted when transported.")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("accepted or denied or popular messages?")
            .setRequired(true)
            .addChoices(
              { name: "Accepted", value: "accepted" },
              { name: "Denied", value: "denied" },
              { name: "Popular", value: "popular"}
            )
        )
        .addChannelOption((option) =>
          option
            .setName("suggestchannel")
            .setDescription("The suggestion channel.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("buttons")
        .setDescription(
          "Toggle if accept/deny buttons are added to suggestions."
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("accept or deny buttons?")
            .setRequired(true)
            .addChoices(
              { name: "Accept", value: "accept" },
              { name: "Deny", value: "deny" },
              { name: "Note", value: "note" }
            )
        )
        .addChannelOption((option) =>
          option
            .setName("suggestchannel")
            .setDescription("The suggestion channel.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("emojis")
        .setDescription(
          "Toggle if upvote/downvote emojis are added to messages."
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("upvote or downvote emojis?")
            .setRequired(true)
            .addChoices(
              { name: "Upvote", value: "upvote" },
              { name: "Downvote", value: "downvote" }
            )
        )
        .addChannelOption((option) =>
          option
            .setName("suggestchannel")
            .setDescription("The suggestion channel.")
            .setRequired(true)
        )
    ),
  permissions: ["EmbedLinks", "AttachFiles"],
  async execute({ client, args, guild, member, interaction, db }) {
    if (!member.permissions.has([PermissionsBitField.Flags.ManageMessages])) {
      let embed = new EmbedBuilder().setColor(0xa31600).addFields([
        {
          name: "**ERROR**",
          value:
            "You aren't permitted to use this command! You need 'Manage Messages'",
        },
      ]);
      await interaction
        .editReply({ content: " ", embeds: [embed], ephemeral: true })
        .then((message) => {
          setTimeout(function () {
            message.delete();
          }, 5000);
        });
      return;
    }
    let suggestchannel = args.suggestchannel;
    let guilddb;
    if (!db.has(guild.id)) {
      let embed = new EmbedBuilder().setColor(0xa31600).addFields([
        {
          name: "**ERROR**",
          value: "That channel isn't in the database!",
        },
      ]);
      await interaction
        .editReply({ content: " ", embeds: [embed], ephemeral: true })
        .then((message) => {
          setTimeout(function () {
            message.delete();
          }, 5000);
        });
      return;
    } else {
      guilddb = await db.read(guild.id);
      if (!(suggestchannel in guilddb)) {
        let embed = new EmbedBuilder().setColor(0xa31600).addFields([
          {
            name: "**ERROR**",
            value: "That channel isn't in the database!",
          },
        ]);
        await interaction
          .editReply({ content: " ", embeds: [embed], ephemeral: true })
          .then((message) => {
            setTimeout(function () {
              message.delete();
            }, 5000);
          });
        return;
      }
    }
    let channeldb = guilddb[suggestchannel];
    let sub = interaction.options._subcommand;
    if (sub == "self") {
      let embed = new EmbedBuilder()
        .setColor(0x1cd0ce)
        .setDescription(
          "People will be able to react to their own suggestions now!"
        );
      if (!channeldb.selftoggle) {
        channeldb.selftoggle = "true";
      } else {
        if (channeldb.selftoggle == "true") {
          channeldb.selftoggle = "false";
          embed.setDescription(
            "People wont be able to react to their own suggestions now!"
          );
        } else {
          channeldb.selftoggle = "true";
        }
      }
      guilddb[suggestchannel] = channeldb;
      await db.write(guild.id, guilddb);
      await interaction.editReply({ content: " ", embeds: [embed] });
    } else if (sub == "thread") {
      let embed = new EmbedBuilder()
        .setColor(0x1cd0ce)
        .setDescription("The bot will add threads to suggestions now!");
      if (!channeldb.threadtoggle) {
        channeldb.threadtoggle = "false";
        embed.setDescription(
          "The bot won't add threads to suggestions anymore!"
        );
      } else {
        if (channeldb.threadtoggle == "true") {
          channeldb.threadtoggle = "false";
          embed.setDescription(
            "The bot won't add threads to suggestions anymore!"
          );
        } else {
          channeldb.threadtoggle = "true";
        }
      }
      guilddb[suggestchannel] = channeldb;
      await db.write(guild.id, guilddb);
      await interaction.editReply({ content: " ", embeds: [embed] });
    } else if (sub == "deletion") {
      let deletelist = channeldb.delete;
      if (!deletelist) {
        deletelist = [];
      }
      let embed = new EmbedBuilder()
        .setColor(0x1cd0ce)
      if (deletelist.includes(args.type)) {
        deletelist.splice(deletelist.indexOf(args.type), 1);
        embed.setDescription("Ok, " + args.type + " suggestions won't be deleted from the suggestion channel.");
      } else {
        deletelist.push(args.type);
        embed.setDescription("Ok, " + args.type + " suggestions will be deleted from the suggestion channel.");
      }
      channeldb.delete = deletelist;
      guilddb[suggestchannel] = channeldb;
      await db.write(guild.id, guilddb);
      await interaction.editReply({ content: " ", embeds: [embed] });
    } else if (sub == "buttons") {
      let deletelist = channeldb.deletebuttons;
      if (!deletelist) {
        deletelist = [];
      }
      let embed = new EmbedBuilder()
        .setColor(0x1cd0ce)
      if (deletelist.includes(args.type)) {
        deletelist.splice(deletelist.indexOf(args.type), 1);
        embed.setDescription("Ok, the " + args.type + " button will be added to suggestions.");
      } else {
        deletelist.push(args.type);
        embed.setDescription("Ok, the " + args.type + " button won't be added to suggestions.");
      }
      channeldb.deletebuttons = deletelist;
      guilddb[suggestchannel] = channeldb;
      await db.write(guild.id, guilddb);
      await interaction.editReply({ content: " ", embeds: [embed] });
    } else if (sub == "emojis") {
      let deletelist = channeldb.deleteemojis;
      if (!deletelist) {
        deletelist = [];
      }
      let embed = new EmbedBuilder()
        .setColor(0x1cd0ce)
      if (deletelist.includes(args.type)) {
        deletelist.splice(deletelist.indexOf(args.type), 1);
        embed.setDescription("Ok, the " + args.type + " button will be added to suggestions.");
      } else {
        deletelist.push(args.type);
        embed.setDescription("Ok, the " + args.type + " button won't be added to suggestions.");
      }
      channeldb.deleteemojis = deletelist;
      guilddb[suggestchannel] = channeldb;
      await db.write(guild.id, guilddb);
      await interaction.editReply({ content: " ", embeds: [embed] });
    }
  },
};
