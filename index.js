console.log(process.version);
const {
	Events,
	Client,
	IntentsBitField,
	Partials,
	PermissionsBitField,
} = require("discord.js");
const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildMessageReactions,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.MessageContent,
	],
});
const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
const got = require("got");
const rest = new REST({ version: "9" }).setToken(token);
const commands = [];
const commandFiles = fs.readdirSync("./Commands");
const Discord = require("discord.js");
const Database = require("./Misc/database");
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	WebhookClient,
	EmbedBuilder,
} = require("discord.js");
const UUID = Date.now() + "";
got("https://oibg-1-t2290424.deta.app/setid/?space=SuggestON&uuid=" + UUID, {
	headers: { auth: process.env.OIBG },
});
let db = new Database();
db.log(true);
const errLog = new WebhookClient({ url: process.env.ERROR_LOGGER });

async function checkperms(interaction, needed, channel, guild, deferred) {
	if (interaction) {
		guild = await client.guilds.cache.get(interaction.guildId);
		channel = await guild.channels.cache.get(interaction.channelId);
	} else {
		guild = await client.guilds.cache.get(guild);
		channel = await guild.channels.cache.get(channel);
	}
	let perms = await guild.members.me.permissionsIn(channel).toArray();
	let missing = needed.filter((perm) => !perms.includes(perm));
	if (!perms.includes("Administrator")) {
		if (missing.length > 0) {
			let notmissing = needed.filter((perm) => !missing.includes(perm));
			notmissing = notmissing.map((perm) => "- '" + perm + "'");
			missing = missing.map((perm) => "- '" + perm + "'");
			let embed = new EmbedBuilder().setColor(0xa31600).addFields([
				{
					name: "**ERROR**",
					value: "I don't have all needed Permissions!",
				},
			]);
			if (notmissing.length != 0) {
				embed.addFields([
					{
						name: "**Gotten Permissions**",
						value: notmissing.join("\n"),
					},
				]);
			} else {
				embed.addFields([
					{
						name: "**Gotten Permissions**",
						value: "None",
					},
				]);
			}
			embed.addFields([
				{
					name: "**Missing Permissions**",
					value: missing.join("\n"),
				},
			]);
			if (interaction) {
        if (deferred) {
				  await interaction.editReply({
					  content: " ",
					  embeds: [embed],
					  ephemeral: true,
				  });
        } else {
          await interaction.reply({
					  content: " ",
					  embeds: [embed],
					  ephemeral: true,
				  });
        }
			}
			return false;
		}
	}
	return true;
}

client.on(Events.ShardError, error => {
	console.error('A websocket connection encountered an error:', error);
});

client.login(token).catch((err) => {
	console.log(err);
});

client.on("ready", () => {
	console.log("Logged in as " + client.user.tag + "!");
	client.user.setActivity("suggestions!", { type: 2 });
	for (const file of commandFiles) {
		const command = require(`./Commands/${file}`);
		if (command.data != undefined) {
			commands.push(command.data.toJSON());
		}
	}
	(async () => {
		await db.load(client.guilds.cache.map(guild => guild.id));
		let num = 0;
		try {
			console.log(
				`Started refreshing ${commands.length} application (/) commands.`
			);

			let cmds = await rest.put(Routes.applicationCommands(clientId), {
				body: commands,
			});

			console.log(
				`Successfully reloaded ${cmds.length} application (/) commands.`
			);
		} catch (error) {
			console.log(error);
		}
	})();
	setInterval(async () => {
		let lastuuid = await got(
			"https://oibg-1-t2290424.deta.app/getid/?space=SuggestON",
			{
				headers: { auth: process.env.OIBG },
			}
		);
		if (lastuuid != UUID && /[0-9]+/.test(lastuuid)) {
			process.exit(0);
		}
		await db.save();
	}, 60000);
});

client.on("interactionCreate", async (interaction) => {
	console.log(interaction);
	let guild = await client.guilds.cache.get(interaction.guildId);
	let channel = await guild.channels.cache.get(interaction.channelId);
	let needed = [
		"ViewChannel",
		"SendMessages",
		"SendMessagesInThreads",
		"ManageMessages",
		"EmbedLinks",
		"AddReactions",
	];
	let hasperms = await checkperms(interaction, needed);
	if (!hasperms) {
		return;
	}
	let member = await guild.members.fetch(interaction.member.user.id);
	let cmd;
	if (interaction.type == 2) {
		await interaction.deferReply();
		let argslist = await interaction.options._hoistedOptions;
		let args = {};
		for (let arg of argslist) {
			args[arg.name] = arg.value;
		}
		for (let file of fs.readdirSync("./Commands/")) {
			if (file == interaction.commandName + ".js") {
				let path = "./Commands/" + interaction.commandName + ".js";
				cmd = require(path);
				break;
			}
		}
		let needed = cmd.permissions;
		let hasperms = await checkperms(interaction, needed, deferred=1);
		if (!hasperms) {
			return;
		}
		try {
			await cmd.execute({
				client,
				args,
				guild,
				channel,
				member,
				interaction,
				db,
			});
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "There was an error while executing this command!",
				ephemeral: true,
			});
		}
	} else if (interaction.isButton()) {
		let cmd;
		if (interaction.message.interaction != null) {
			cmd = interaction.message.interaction.commandName;
		} else {
			cmd = "other";
		}
		let button = interaction.customId.replace(/\d+/g, "");
		button = require(`./Buttons/${cmd}/${button}.js`);
		if (!button.dontDefer) {
			await interaction.deferUpdate();
		}
		try {
			await button.click({ client, guild, channel, member, interaction, db });
		} catch (error) {
			console.error(error);
			if (!button.dontDefer) {
				await interaction.editReply({
					content: "There was an error while clicking this button!",
					ephemeral: true,
				});
			} else {
				await interaction.deferUpdate();
				await interaction.editReply({
					content: "There was an error while clicking this button!",
					ephemeral: true,
				});
			}
		}
	} else if (interaction.isSelectMenu()) {
		await interaction.deferUpdate();
		let cmd;
		if (interaction.message.interaction != null) {
			cmd = interaction.message.interaction.commandName;
		} else {
			cmd = "other";
		}
		let menu = interaction.customId.replace(/\d+/g, "");
		menu = require(`./Menus/${cmd}/${menu}.js`);
		try {
			await menu.choose({ client, guild, channel, member, interaction, db });
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "There was an error while using this menu!",
				ephemeral: true,
			});
		}
	} else if (interaction.type == 5) {
		await interaction.deferUpdate();
		let cmd;
		if (interaction.message.interaction != null) {
			cmd = interaction.message.interaction.commandName;
		} else {
			cmd = "other";
		}
		let modal = interaction.customId.replace(/\d+/g, "");
		modal = require(`./Modals/${cmd}/${modal}.js`);
		try {
			await modal.submit({ client, guild, channel, member, interaction, db });
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "There was an error while using this modal!",
				ephemeral: true,
			});
		}
	}
});

client.on("messageCreate", async (message) => {
	if (message.author.bot) return;
	let guild = message.guild;
	if (!db.has(guild.id)) return;
	let channel = message.channel;
	if (channel.thread) return;
	let guilddb = await db.read(guild.id);
	let author = message.author;
	if (channel.id in guilddb) {
		let channeldb = guilddb[channel.id];
		if (channeldb.id == undefined) {
			channeldb.id = 0;
		}
		channeldb.id += 1;
		let text = message.content;
		let attachments = message.attachments;
		attachments = Array.from(attachments.values());
		await message.delete();
		let buttons = new ActionRowBuilder();
		if (!channeldb.deletebuttons || !channeldb.deletebuttons.includes("accept")) {
			buttons.addComponents(
				new ButtonBuilder()
					.setCustomId("accept")
					.setLabel("Accept")
					.setStyle(ButtonStyle.Success)
			);
		}
		if (!channeldb.deletebuttons || !channeldb.deletebuttons.includes("deny")) {
			buttons.addComponents(
				new ButtonBuilder()
					.setCustomId("deny")
					.setLabel("Deny")
					.setStyle(ButtonStyle.Danger)
			);
		}
		if (!channeldb.deletebuttons || !channeldb.deletebuttons.includes("note")) {
			buttons.addComponents(
				new ButtonBuilder()
					.setCustomId("note")
					.setLabel("Note")
					.setStyle(ButtonStyle.Primary)
			);
		}
		buttons = [buttons];
		let avatar;
		if (author.avatarURL()) {
			avatar = author.avatarURL();
		} else {
			num = author.discriminator % 5;
			avatar = "https://cdn.discordapp.com/embed/avatars/" + num + ".png";
		}
		let embedcolor;
		if (channeldb.hex instanceof String) {
			let hex_int = int(channeldb.hex, 16);
			new_int = hex_int + 0x200;
			embedcolor = new_int;
		} else {
			embedcolor = channeldb.hex;
		}
		let embed = new EmbedBuilder().setColor(embedcolor).setAuthor({
			name: author.tag,
			iconURL: avatar + "?id=" + author.id,
		});
		if (text && text.length != 0) {
			embed.setDescription(text);
		}
		if (attachments && attachments.length > 0) {
			let filtered = attachments.filter((a) => a.contentType.startsWith("image/"));
			if (filtered.length > 0) {
				embed.setImage("attachment://" + filtered[0].name);
			}
		}
		embed.setFooter({ text: "Id: " + channeldb.id });
		embed.setTimestamp();
		if (
			channeldb.deletebuttons &&
			channeldb.deletebuttons.includes("accept") &&
			channeldb.deletebuttons.includes("deny") &&
			channeldb.deletebuttons.includes("note")
		) {
			buttons = [];
		}
		channel
			.send({
				content: " ",
				embeds: [embed],
				components: buttons,
				files: attachments,
			})
			.then((message) => {
				message.react(channeldb.up).then(() => {
					message
						.react(channeldb.down)
						.then(() => {
							let keys = Object.keys(channeldb.custom);
							for (k of keys) {
								if (channeldb.custom[k].default == "yes") {
									message.react(k);
								}
							}
						})
						.then(() => {
							if (
								channeldb.deleteemojis &&
								channeldb.deleteemojis.includes("upvote")
							) {
								message.reactions.resolve(channeldb.up).users.remove(client.user.id);
							}
							if (
								channeldb.deleteemojis &&
								channeldb.deleteemojis.includes("downvote")
							) {
								message.reactions.resolve(channeldb.down).users.remove(client.user.id);
							}
						});
				});
				(async () => {
					let needed = ["CreatePublicThreads"];
					let hasperms = await checkperms(
						null,
						needed,
						message.channel.id,
						message.guild.id
					);
					if (
						hasperms &&
						(!channeldb.threadtoggle || channeldb.threadtoggle == "true")
					) {
						let threadname = "Discussion";
						if (
							message.embeds[0].description &&
							message.embeds[0].description.length > 0
						) {
							threadname = message.embeds[0].description
								.split("\n")[0]
								.substring(0, 100);
						}
						channel.threads.create({
							name: threadname,
							autoArchiveDuration: 10080,
							startMessage: message,
						});
					}
				})();
			});
		guilddb[channel.id] = channeldb;
		await db.write(guild.id, guilddb);
	}
});

const events = {
	MESSAGE_REACTION_ADD: "messageReactionAdd",
	MESSAGE_REACTION_REMOVE: "messageReactionRemove",
};

client.on("raw", async (event) => {
	if (!events.hasOwnProperty(event.t)) return;
	const { d: data } = event;
	const user = client.users.cache.get(data.user_id);
	const channel =
		client.channels.cache.get(data.channel_id) || (await user.createDM());
	if (channel.messages.cache.get(data.message_id)) return;
	const message = await channel.messages.fetch(data.message_id);
	const emojiKey = data.emoji.id
		? `${data.emoji.name}:${data.emoji.id}`
		: data.emoji.name;
	const reaction = message.reactions.cache.get(emojiKey);
	client.emit(events[event.t], reaction, user);
});

client.on("messageReactionAdd", async (reaction, user) => {
	if (!user || !reaction) return;
	if (user.bot) return;
	let emoji;
	if (reaction._emoji.id != null) {
		emoji = "<:" + reaction._emoji.name + ":" + reaction._emoji.id + ">";
	} else {
		emoji = reaction._emoji.name;
	}
	if (reaction.message.interaction != undefined) {
		let cmd = reaction.message.interaction.commandName;
		if (fs.existsSync(`./Emojis/${cmd}.js`)) {
			let r = require(`./Emojis/${cmd}.js`);
			let message = reaction.message;
			r.react({ emoji, message, user, reaction });
		}
	} else {
		let guild = reaction.message.guild;
		let channel = reaction.message.channel;
		if (!db.has(guild.id)) return;
		let guilddb = await db.read(guild.id);
		if (!(channel.id in guilddb)) return;
		let channeldb = guilddb[channel.id];
		let message = reaction.message;
		if (
			message.embeds[0] == undefined ||
			message.embeds[0].author.iconURL == undefined
		) {
			return;
		}
		let link = message.embeds[0].author.iconURL.split("?")[1];
		let urlParams = new URLSearchParams("?" + link);
		let userid = urlParams.get("id");
		let areaction = reaction._emoji.id;
		if (areaction == undefined) {
			areaction = reaction._emoji.name;
		}
		if (
			(channeldb.selftoggle == undefined || channeldb.selftoggle == "false") &&
			userid == user.id &&
			!(areaction in channeldb.custom)
		) {
			reaction.users.remove(user.id);
			return;
		}
		if (
			channeldb.up != areaction &&
			channeldb.down != areaction &&
			!(areaction in channeldb.custom)
		) {
			reaction.users.remove(user.id);
			return;
		}
		if (areaction in channeldb.custom) {
			let r = channeldb.custom[areaction];
			if (r.channel != "Decoration" || r.delete == "yes") {
				let member = await guild.members.fetch(user.id);
				if (!member.permissions.has([PermissionsBitField.Flags.ManageMessages])) {
					reaction.users.remove(user.id);
					return;
				} else {
					if (r.channel != "Decoration") {
						let channel = await guild.channels.fetch(r.channel);
						let embed = message.embeds[0];
						let attachments = message.attachments;
						await channel.send({
							content: " ",
							embeds: [embed],
							files: attachments,
						});
					}
					if (r.delete == "yes") {
						await message.delete();
					}
					if (r.channel != "Decoration") {
						embed = new EmbedBuilder()
							.setColor(0x1cd0ce)
							.setDescription(
								"Transported message to <#" +
									r.channel +
									">!\nThis message will be deleted in 5 seconds!"
							);
						await reaction.message.channel
							.send({ content: " ", embeds: [embed], ephemeral: true })
							.then((message) => {
								setTimeout(function () {
									message.delete();
								}, 5000);
							});
					}
				}
				return;
			}
		}
		if (
			channeldb.popchannel != undefined &&
			channeldb.popamount != undefined &&
			!message.embeds[0].author.iconURL.includes("&channel")
		) {
			let upvotes = await message.reactions.cache.get(channeldb.up);
			if (upvotes) {
				upvotes = upvotes.count - 1;
			} else upvotes = 0;
			let downvotes = await message.reactions.cache.get(channeldb.down);
			if (downvotes) {
				downvotes = downvotes.count - 1;
			} else downvotes = 0;
			if (upvotes - downvotes >= channeldb.popamount) {
				let popchannel = await guild.channels.fetch(channeldb.popchannel);
				let embed = message.embeds[0];
				let orglink = embed.data.author.icon_url;
				let author = embed.data.author.icon_url + "&sc=" + channeldb.suggestchannel;
				if (!channeldb.delete || !channeldb.delete.includes("popular")) {
					author = author + "&channel=suggest&message=" + message.id;
				}
				embed.data.author.icon_url = author;
				let attachments = message.attachments;
				let components = message.components;
				if (channeldb.delete && channeldb.delete.includes("popular")) {
					await message.delete();
				}
				popchannel
					.send({
						content: " ",
						embeds: [embed],
						files: attachments,
						components: components,
					})
					.then((msg) => {
						if (!channeldb.delete || !channeldb.delete.includes("popular")) {
							let embed = message.embeds[0];
							let author = orglink + "&channel=pop&message=" + msg.id;
							embed.data.author.icon_url = author;
							message.edit({ embeds: [embed] });
						}
					});
			}
		} else if (channeldb.adamount != undefined) {
			let embed = message.embeds[0];
			let upvotes = (await message.reactions.cache.get(channeldb.up).count) - 1;
			let downvotes =
				(await message.reactions.cache.get(channeldb.down).count) - 1;
			let alreadydone = false;
			for (let i = 1; i < msg.embeds[0].fields.length; i++) {
				if (msg.embeds[0].fields[i].name == "​") {
					if (
						msg.embeds[0].fields[i].value == "**Accepted by popular vote**" ||
						msg.embeds[0].fields[i].value == "**Denied by popular vote**"
					) {
						alreadydone = true;
						break;
					}
				}
			}
			if (upvotes - downvotes >= channeldb.adamount && !alreadydone) {
				embed.addFields([
					{
						name: "​",
						value: "**Accepted by popular vote**",
					},
				]);
				let attachments = message.attachments;
				if (channeldb.acceptchannel != undefined) {
					if (channeldb.delete && channeldb.delete.includes("accepted")) {
						await message.delete();
					} else {
						await message.edit({
							content: " ",
							embeds: embeds,
							files: attachments,
							components: [],
						});
					}
					let acceptchannel = await guild.channels.fetch(channeldb.acceptchannel);
					acceptchannel.send({
						content: " ",
						embeds: [embed],
						files: attachments,
						components: [],
					});
				} else {
					message.edit({
						content: " ",
						embeds: [embed],
						files: attachments,
						components: [],
					});
				}
			}
			if (downvotes - upvotes >= channeldb.adamount && !alreadydone) {
				embed.addFields([
					{
						name: "​",
						value: "**Denied by popular vote**",
					},
				]);
				let attachments = message.attachments;
				if (channeldb.denychannel != undefined) {
					if (channeldb.delete && channeldb.delete.includes("denied")) {
						await message.delete();
					} else {
						await message.edit({
							content: " ",
							embeds: embeds,
							files: attachments,
							components: [],
						});
					}
					let denychannel = await guild.channels.fetch(channeldb.denychannel);
					denychannel.send({
						content: " ",
						embeds: [embed],
						files: attachments,
						components: [],
					});
				} else {
					message.edit({
						content: " ",
						embeds: [embed],
						files: attachments,
						components: [],
					});
				}
			}
		}
	}
});

const http = require("http");
const cp = require("child_process");

http
	.createServer((req, res) => {
		res.setStatus = 200;
		res.end("oi!");
	})
	.listen(7860, () => console.log("http server up and running"));

process.on("uncaughtException", (err, origin) => {
	console.log(err);
	errLog.send({ content: "**SuggestON:**\n" + err.stack + "\n\nUUID:" + UUID });
});
process.on("unhandledRejection", (reason, promise) => {
	console.log(reason);
	errLog.send({
		content: "**SuggestON:**\n" + reason.stack + "\n\nUUID:" + UUID,
	});
});
("Loading...");
