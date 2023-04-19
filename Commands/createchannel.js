const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
let emotes = JSON.parse(fs.readFileSync("./Misc/emojis.json","utf-8")).emojis;

module.exports = {
  data: new SlashCommandBuilder()
		.setName('createchannel')
	  .setDescription('Sets a channel to be a suggestion channel, and link other channels to it! (overrides existing links)')
    .addChannelOption(option => 
      option
        .setName('suggestchannel')
        .setDescription('The suggestion channel.')
        .setRequired(true)
    )
    .addChannelOption(option => 
      option
        .setName('acceptchannel')
        .setDescription('The accepted suggestions channel. (isn\'t require for adamount)')
        .setRequired(false)
    )
    .addChannelOption(option => 
      option
        .setName('denychannel')
        .setDescription('The denied suggestions channel. (isn\'t require for adamount)')
        .setRequired(false)
    )
    .addChannelOption(option => 
      option
        .setName('popchannel')
        .setDescription('The popular suggestions channel. (required for popamount)')
        .setRequired(false)
    )
    .addIntegerOption(option => 
      option
        .setName('popamount')
        .setDescription('Amount of net-likes needed for a suggestion to go to the popular channel. (requires popchannel)')
        .setRequired(false)
    )
    .addIntegerOption(option => 
      option
        .setName('adamount')
        .setDescription('Amount of net- likes/dislikes to auto accept/deny. (doesn\'t require accept/deny channel)')
        .setRequired(false)
    )
    .addStringOption(option => 
      option
        .setName('upvote')
        .setDescription('The emoji users should use to upvote a suggestion in this channel.')
        .setRequired(false)
    )
    .addStringOption(option => 
      option
        .setName('downvote')
        .setDescription('The emoji users should use to upvote a suggestion in this channel.')
        .setRequired(false)
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
    };
    let suggestchannel = await guild.channels.fetch(args.suggestchannel);
    let acceptchannel = await guild.channels.fetch(args.acceptchannel);
    let denychannel = await guild.channels.fetch(args.denychannel);
    let popchannel = await guild.channels.fetch(args.popchannel);
    let popamount = args.popamount
    let adamount = args.adamount
    let down = args.downvote;
    let up = args.upvote;
    let jsonobject = {};
    if (suggestchannel.type != 0) {
      let embed = new EmbedBuilder()
        .setColor(0xa31600)
        .addFields([
          {
            name: "**ERROR**",
            value: "That suggestchannel isn't a text channel!"
          }
        ])
      await interaction.editReply({ content: " ", embeds: [embed] }).then((message) => {
        setTimeout(function () {
          message.delete();
        }, 5000);
      });
    } else {
      jsonobject.suggestchannel = args.suggestchannel;
      let embed = new EmbedBuilder()
        .setColor(0x1cd0ce)
        .addFields([
          {
            name: "**SuggestChannel**",
            value: "<#" + suggestchannel + ">"
          }
        ])
      if (acceptchannel.type == 0) {
        embed.addFields([
          {
            name: "**AcceptChannel**",
            value: "<#" + acceptchannel + ">"
          }
        ])
        jsonobject.acceptchannel = args.acceptchannel;
      } else {
        embed.addFields([
          {
            name: "**AcceptChannel**",
            value: "None"
          }
        ])
      }
      if (denychannel.type == 0) {
        embed.addFields([
          {
            name: "**DenyChannel**",
            value: "<#" + denychannel + ">"
          }
        ])
        jsonobject.denychannel = args.denychannel;
      } else {
        embed.addFields([
          {
            name: "**DenyChannel**",
            value: "None"
          }
        ])
      }
      if (popchannel.type == 0) {
        embed.addFields([
          {
            name: "**PopChannel**",
            value: "<#" + popchannel + ">"
          }
        ])
        jsonobject.popchannel = args.popchannel;
      } else {
        embed.addFields([
          {
            name: "**PopChannel**",
            value: "None"
          }
        ])
      }
      if (popamount != undefined) {
        embed.addFields([
          {
            name: "**PopAmount**",
            value: popamount + ""
          }
        ])
        jsonobject.popamount = args.popamount;
      } else {
        embed.addFields([
          {
            name: "**PopAmount**",
            value: "N.A."
          }
        ])
      }
      if (adamount != undefined) {
        embed.addFields([
          {
            name: "**ADAmount**",
            value: adamount + ""
          }
        ])
        jsonobject.adamount = args.adamount;
      } else {
        embed.addFields([
          {
            name: "**ADAmount**",
            value: "N.A."
          }
        ])
      }//up.match(/\p{Emoji}/u)
      let customemoregex = /^\<\:[A-z0-9]+\:[0-9]+\>$/i;
      if (emotes.includes(up) || customemoregex.test(up)) {
        embed.addFields([
          {
            name: "**Upvote**",
            value: up + ""
          }
        ])
        if (customemoregex.test(up)) {
          up = up.replace(/\<\:[A-z0-9]+\:/, "").replace(">","");
        }
        jsonobject.up = up;
      } else {
        embed.addFields([
          {
            name: "**Upvote**",
            value: "⬆️"
          }
        ])
        jsonobject.up = "⬆️";
      }
      if (emotes.includes(down) || customemoregex.test(down)) {
        embed.addFields([
          {
            name: "**Downvote**",
            value: down + ""
          }
        ])
        if (customemoregex.test(down)) {
          down = down.replace(/\<\:[A-z0-9]+\:/, "").replace(">","");
        }
        jsonobject.down = down;
      } else {
        embed.addFields([
          {
            name: "**Downvote**",
            value: "⬇️"
          }
        ])
        jsonobject.down = "⬇️";
      }
      let guilddb;
      if (!db.has(guild.id)) {
        guilddb = {};
      } else {
        guilddb = await db.read(guild.id);
      }
      jsonobject.hex = 0x1cd0ce;
      jsonobject.custom = {};
      guilddb[args.suggestchannel] = jsonobject;
      await db.write(guild.id,guilddb);
      await interaction.editReply({ content: " ", embeds: [embed] });
    }
  }
};