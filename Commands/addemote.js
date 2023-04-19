const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
let emotes = JSON.parse(fs.readFileSync("./Misc/emojis.json","utf-8")).emojis;

function capfirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  data: new SlashCommandBuilder()
	  .setName('addemote')
	  .setDescription('Add a custom emoji with functionality to a suggestionchannel!')
	  .addSubcommand(subcommand =>
		  subcommand
			  .setName('type')
			  .setDescription('The type of functionality.')
			  .addStringOption(option => 
          option
            .setName('type')
            .setDescription('The type of functionality, send it to the accept/deny channel or make it decoration.')
            .setRequired(true)
            .addChoices(
              {name: 'AcceptChannel', value: 'accept'},
              {name: 'DenyChannel', value: 'deny'},
              {name: 'PopChannel', value: 'pop'},
              {name: 'Decoration', value: 'deco'}
            )
        )
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
        )
        .addStringOption(option => 
          option
            .setName('default')
            .setDescription('Should the emoji be added by default?')
            .setRequired(true)
            .addChoices(
              {name: 'Yes', value: 'yes'},
              {name: 'No', value: 'no'}
            )
        )
        .addStringOption(option => 
          option
            .setName('delete')
            .setDescription('Should the suggestion be deleted when using this emoji?')
            .setRequired(true)
            .addChoices(
              {name: 'Yes', value: 'yes'},
              {name: 'No', value: 'no'}
            )
        )
    )
    .addSubcommand(subcommand =>
		  subcommand
			  .setName('custom')
			  .setDescription('Send to custom channel.')
			  .addChannelOption(option => 
          option
            .setName('channel')
            .setDescription('Channel to send the suggestion to.')
            .setRequired(true)
        )
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
        )
        .addStringOption(option => 
          option
            .setName('default')
            .setDescription('Should the emoji be added by default?')
            .setRequired(true)
            .addChoices(
              {name: 'Yes', value: 'yes'},
              {name: 'No', value: 'no'}
            )
        )
        .addStringOption(option => 
          option
            .setName('delete')
            .setDescription('Should the suggestion be deleted when using this emoji?')
            .setRequired(true)
            .addChoices(
              {name: 'Yes', value: 'yes'},
              {name: 'No', value: 'no'}
            )
        )
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
        .addFields([
          {
            name: "**ERROR**",
            value: "That channel isn't in the db!"
          }
        ])
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
    let d = args.default;
    let del = args.delete
    let echannel;
    if (args.type == undefined) {
      echannel = args.channel;
    } else {
      if (args.type == "deco") {
        echannel = "Decoration";
      } else {
        echannel = channeldb[args.type + "channel"];
        if (echannel == undefined) {
          let embed = new EmbedBuilder()
            .setColor(0xa31600)
            .addFields([
              {
                name: "**ERROR**",
                value: "No " + args.type + "channel" + " has been linked to this suggestion channel!"
              }
            ])
          await interaction.editReply({ content: " ", embeds: [embed] }).then((message) => {
            setTimeout(function () {
              message.delete();
            }, 5000);
          });
          return;
        }
      }
    }
    let customemoregex = /^\<\:[A-z0-9]+\:[0-9]+\>$/i;
    if (!emotes.includes(emoji) && !customemoregex.test(emoji)) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "You didn't input a valid emoji!"
          }
        ])
      await interaction.editReply({ content: " ", embeds: [embed] }).then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
      return;
    }
    if (customemoregex.test(emoji)) {
      emoji = emoji.replace(/\<\:[A-z0-9]+\:/, "").replace(">","");
    }
    channeldb.custom[emoji] = {
      emoji: emoji,
      channel: echannel,
      default: d,
      delete: del
    }
    guilddb[channel.id] = channeldb;
    await db.write(guild.id, guilddb);
    let embed = new EmbedBuilder()
      .setColor("#1cd0ce")
      .setDescription("**Custom emoji successfully added!**")
      .addFields([
        {
          name: "**Emoji**",
          value: args.emoji
        }
      ])
    if (args.type == undefined) {
      embed.addFields([
        {
          name: "**Type**",
          value: "Custom"
        }
      ])
    } else {
      if (args.type != "deco") {
        embed.addFields([
          {
            name: "**Type**",
            value: capfirst(args.type) + " Channel"
          }
        ])
      } else {
        embed.addFields([
          {
            name: "**Type**",
            value: "Decoration"
          }
        ])
      }
    }
    if (args.type != "deco") {
      embed.addFields([
        {
          name: "**Send To**",
          value: "<#" + echannel + ">"
        }
      ])
    }
    if (d == "yes") {
      embed.addFields([
        {
          name: "**Appears by default**",
          value: "True"
        }
      ])
    } else {
      embed.addFields([
        {
          name: "**Appears by default**",
          value: "False"
        }
      ])
    }
    if (del == "yes") {
      embed.addFields([
        {
          name: "**Deletes message when used**",
          value: "True"
        }
      ])
    } else {
      embed.addFields([
        {
          name: "**Deletes message when used**",
          value: "False"
        }
      ])
    }
    await interaction.editReply({ content: " ", embeds: [embed] });
  }
};