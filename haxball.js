const roomName = '🦆🦆🦆 TODOS JUEGAN 🦆🦆🦆';
const maxPlayers = 30;
const roomPublic = false;
const token = roomArgs['token']
const region = [{ "code": "co", "lat": 4.570860, "lon": -74.297333 }];

var roomWebhook = 'https://discord.com/api/webhooks/1121548089782710303/qlkzuEiAxNK_wldQpcRH3iUAEpZO7W_j1SPPjp_mdB4Y_n-5Hp_Jdld7dtvMtDC3ERxy'; // this webhook is used to send the details of the room (chat, join, leave) ; it should be in a private discord channel

var gameConfig = {
    roomName: roomName,
    maxPlayers: maxPlayers,
    public: roomPublic,
    noPlayer: true,
    geo: region[0],
}

if (typeof token == 'string' && token.length == 39) {
    gameConfig.token = token;
}

var room = HBInit(gameConfig);

room.setScoreLimit(3);
room.setTimeLimit(3);
room.setTeamsLock(true);
room.setKickRateLimit(6, 0, 0);


var playersAll = [];
var authArray = [];

/* --------- FUNCIONES --------- */

function getDate() {
    let d = new Date();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function updateTeams() {
    playersAll = room.getPlayerList();
}

function sendMessagesInBatches() {
  if (messageQueue.length > 0 && !sendingMessages) {
    sendingMessages = true;

    var messagesToSend = messageQueue.splice(0, 3);

    var messageContent = messagesToSend
      .map((message) => {
        return `[${message.time}] 💬 CHAT\n**${message.player.name}**: ${message.message.replace('@', '@ ')}`;
      })
      .join('\n');

    fetch(roomWebhook, {
      method: 'POST',
      body: JSON.stringify({
        content: messageContent,
        username: roomName,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .catch((error) => {
        console.error('Error al enviar los mensajes:', error);
      })
      .finally(() => {
        sendingMessages = false;
        sendMessagesInBatches();
      });
  }
}

function updateAdmins() { 
  var players = room.getPlayerList();
  if ( players.length == 0 ) return;
  if ( players.find((player) => player.admin) != null ) return;
  room.setPlayerAdmin(players[0].id, true);
}


/* --------- EVENTOS --------- */

room.onPlayerChat = (player, message) => {
    if (gameState !== State.STOP && player.team != Team.SPECTATORS) {
        let pComp = getPlayerComp(player);
        if (pComp != null) pComp.inactivityTicks = 0;
    }

    let msgArray = message.split(/ +/);
    lastMessageTime = Date.now();

    spamDetection.checkSpam(player, message);

    if (!hideClaimMessage || msgArray[0] != '!claim') {
        var currentTime = getDate();
        messageQueue.push({ time: currentTime, player: player, message: message });

        if (messageQueue.length >= 3 && !sendingMessages) {
            sendMessagesInBatches();
        }
    }

    // Config emotes
    if (message === 'q') {
        room.setPlayerAvatar(player.id, '🤨');
        setTimeout(() => {
            room.setPlayerAvatar(player.id, null);
        }, 1500);
    } else if (message === 'mb') {
        room.setPlayerAvatar(player.id, '🥺');
        setTimeout(() => {
            room.setPlayerAvatar(player.id, null);
        }, 1500);   
    } else if (message === 'ez') {
        room.setPlayerAvatar(player.id, '🥱');
        setTimeout(() => {
            room.setPlayerAvatar(player.id, null);
        }, 1500);
    } else if (message === '1') {
        room.setPlayerAvatar(player.id, '🥅');
        setTimeout(() => {
            room.setPlayerAvatar(player.id, null);
        }, 1500);
    }

    if (msgArray[0].toLowerCase() == 't') {
        teamChat(player, message);
        return false;
    }
    if (msgArray[0].substring(0, 1) === '@') {
        playerChat(player, message);
        return false;
    }
    if (chooseMode && teamRed.length * teamBlue.length != 0) {
        var choosingMessageCheck = chooseModeFunction(player, message);
        if (choosingMessageCheck) return false;
    }
    if (slowMode > 0) {
        var filter = slowModeFunction(player, message);
        if (filter) return false;
    }
    if (!player.admin && muteArray.getByAuth(authArray[player.id][0]) != null) {
        room.sendAnnouncement(
            `Estás muteado !`,
            player.id,
            errorColor,
            'bold',
            HaxNotification.CHAT
        );
        return false;
    }

    if (msgArray[0][0] == '!') {
        let command = getCommand(msgArray[0].slice(1).toLowerCase());
        if (command != false && commands[command].roles <= getRole(player)) commands[command].function(player, message);
        return false;
    }

    var stats = new HaxStatistics(player.name);
    var pComp = getPlayerComp(player);

    if (localStorage.getItem(authArray[player.id][0])) {
        stats = JSON.parse(localStorage.getItem(authArray[player.id][0]));
    }

        var announcement = "";
        var chatColor = "";
        var chatStyle = "normal";

        if (stats.wins > 139) {
            announcement += "🐐「𝐆𝐎𝐀𝐓」"
            chatColor = "0xFF6400"
        } else if (stats.wins > 109) {
            announcement += "🪐「ᴏʀɪɢᴇɴ」"
            chatColor = "0xFAAF79"
        } else if (stats.wins > 104) {
            announcement += "🏹「ᴇʟɪᴛᴇ ɪɪɪ」"
            chatColor = "0xA0F8F3"
        } else if (stats.wins > 102) {
            announcement += "🏹「ᴇʟɪᴛᴇ ɪɪ」"
            chatColor = "0xA0F8F3"
        } else if (stats.wins > 99) {
            announcement += "🏹「ᴇʟɪᴛᴇ ɪ」"
            chatColor = "0xA0F8F3"
        } else if (stats.wins > 94) {
            announcement += "⚡「ʟᴇʏᴇɴᴅᴀ ɪɪɪ」"
            chatColor = "0xFFB5F9"
        } else if (stats.wins > 92) {
            announcement += "⚡「ʟᴇʏᴇɴᴅᴀ ɪɪ」"
            chatColor = "0xFFB5F9"
        } else if (stats.wins > 89) {
            announcement += "⚡「ʟᴇʏᴇɴᴅᴀ ɪ」"
            chatColor = "0xFFB5F9"
        } else if (stats.wins > 84) {
            announcement += "🧙「ᴍᴀᴇꜱᴛʀᴏ ɪɪɪ」"
            chatColor = "0x73DEB9"
        } else if (stats.wins > 82) {
            announcement += "🧙「ᴍᴀᴇꜱᴛʀᴏ ɪɪ」"
            chatColor = "0x73DEB9"
        } else if (stats.wins > 79) {
            announcement += "🧙「ᴍᴀᴇꜱᴛʀᴏ ɪ」"
            chatColor = "0x73DEB9"
        } else if (stats.wins > 74) {
            announcement += "🐉「ᴘʀᴏ ɪɪɪ」"
            chatColor = "0xFAAF79A"
        } else if (stats.wins > 72) {
            announcement += "🐉「ᴘʀᴏ ɪɪ」"
            chatColor = "0xFAAF79A"
        } else if (stats.wins > 69) {
            announcement += "🐉「ᴘʀᴏ ɪ」"
            chatColor = "0xFAAF79A"
        } else if (stats.wins > 64) {
            announcement += "☕「ᴍɪᴛɪᴄᴏ ɪɪɪ」"
            chatColor = "0xE6FFAD"
        } else if (stats.wins > 62) {
            announcement += "☕「ᴍɪᴛɪᴄᴏ ɪɪ」"
            chatColor = "0xE6FFAD"
        } else if (stats.wins > 59) {
            announcement += "☕「ᴍɪᴛɪᴄᴏ ɪ」"
            chatColor = "0xE6FFAD"
        } else if (stats.wins > 54) {
            announcement += "🍂「ᴠᴇᴛᴇʀᴀɴᴏ ɪɪɪ」"
            chatColor = "0xD8B0FA"
        } else if (stats.wins > 52) {
            announcement += "🍂「ᴠᴇᴛᴇʀᴀɴᴏ ɪɪ」"
            chatColor = "0xD8B0FA"
        } else if (stats.wins > 49) {
            announcement += "🍂「ᴠᴇᴛᴇʀᴀɴᴏ ɪ」"
            chatColor = "0xD8B0FA"
        } else if (stats.wins > 44) {
            announcement += "🌟「ᴘʀɪᴍᴇ ɪɪɪ」"
            chatColor = "0xFFF86B"
        } else if (stats.wins > 42) {
            announcement += "🌟「ᴘʀɪᴍᴇ ɪɪ」"
            chatColor = "0xFFF86B"
        } else if (stats.wins > 39) {
            announcement += "🌟「ᴘʀɪᴍᴇ ɪ」"
            chatColor = "0xFFF86B"
        } else if (stats.wins > 34) {
            announcement += "🔥「ᴇxᴘᴇʀᴛᴏ ɪɪɪ」"
            chatColor = "0xFAA635"
        } else if (stats.wins > 32) {
            announcement += "🔥「ᴇxᴘᴇʀᴛᴏ ɪɪ」"
            chatColor = "0xFAA635"
        } else if (stats.wins > 29) {
            announcement += "🔥「ᴇxᴘᴇʀᴛᴏ ɪ」"
            chatColor = "0xFAA635"
        } else if (stats.wins > 24) {
            announcement += "🚀「ᴀᴠᴀɴᴢᴀᴅᴏ ɪɪɪ」"
            chatColor = "0xA5D3FF"
        } else if (stats.wins > 22) {
            announcement += "🚀「ᴀᴠᴀɴᴢᴀᴅᴏ ɪɪ」"
            chatColor = "0xA5D3FF"
        } else if (stats.wins > 19) {
            announcement += "🚀「ᴀᴠᴀɴᴢᴀᴅᴏ ɪ」"
            chatColor = "0xA5D3FF"
        } else if (stats.wins > 14) {
            announcement += "💸「ᴄᴀᴍᴘᴇᴏɴ ɪɪɪ」"
            chatColor = "0xFFEBA5"
        } else if (stats.wins > 12) {
            announcement += "💸「ᴄᴀᴍᴘᴇᴏɴ ɪɪ」"
            chatColor = "0xFFEBA5"
        } else if (stats.wins > 9) {
            announcement += "💸「ᴄᴀᴍᴘᴇᴏɴ ɪ」"
            chatColor = "0xFFEBA5"
        } else if (stats.wins > 4) {
            announcement += "🌱「ɴᴏᴠᴀᴛᴏ ɪɪɪ」"
            chatColor = "0xA5F0BF"
        } else if (stats.wins > 2){
            announcement += "🌱「ɴᴏᴠᴀᴛᴏ ɪɪ」"
            chatColor = "0xA5F0BF"
        } else if (stats.wins > 1) {
            announcement += "🌱「ɴᴏᴠᴀᴛᴏ ɪ」"
            chatColor = "0xA5F0BF"
        } else {
            announcement += "🐸「ꜱᴀᴘᴀ」"
            chatColor = "0xAAA0E9"
        }

            if (player.admin) {
                if (getRole(player) == Role.ADMIN) {
                    announcement += "「🦆 ADM」";
                    chatColor = "0x97DBFF";
                    chatStyle = "normal";
                } else if (getRole(player) == Role.MOD_PERM) {
                    announcement += "「🌟 MOD」";
                    chatColor = "0xFFE648";
                } else if (getRole(player) == Role.MOD_TEMP) {
                    announcement = "T-MOD |";
                    chatColor = "0xFFD96A";
                    chatStyle = "bold";
                }
            } else if (getRole(player) == Role.VIP) {
                announcement += "「💎 VIP」";
                chatColor = "0x4DD4E5";
            } else {
                announcement = announcement;
                chatColor = chatColor;
            }

            announcement += " " + player.name + " » " + message
            room.sendAnnouncement(announcement, null, chatColor, chatStyle, 1);
            return false;
}

room.onPlayerJoin = function (player) {

    authArray[player.id] = [player.auth, player.conn];

    if (roomWebhook != '') {
        fetch(roomWebhook, {
            method: 'POST',
            body: JSON.stringify({
                content: `[${getDate()}] ➡️ JOIN (${playersAll.length + 1}/${maxPlayers})\n**` +
                    `${player.name}** ingresó a la sala\n__auth:__ \`${authArray[player.id][0]}\`\n__conn:__ \`${authArray[player.id][1]}\``,
                username: roomName,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((res) => res);
    }
    room.sendAnnouncement(
        `⚪ ¡Bienvenido, ${player.name}! Escriba !help para ver los comandos`,
        player.id,
        null,
        'normal',
        0
    );
    room.sendAnnouncement(
        `⚪ Sala hosteada por Lightning. El primero en ingresar a esta obtendrá admin. Esta sala es anárquica, no abuses de tu poder o recibirás sanción`,
        player.id,
        null,
        'normal',
        0
    );
    room.sendAnnouncement(
        `⚪ Entra al Discord bb<3 https://discord.gg/7eFj8QBnwU`,
        player.id,
        null,
        'normal',
        2
    );
    updateTeams();
    updateAdmins();
};

room.onPlayerLeave = function (player) {

    setTimeout(() => {
            if (roomWebhook != '') {
                var stringContent = `[${getDate()}] ⬅️ LEAVE (${playersAll.length}/${maxPlayers})\n**${player.name}**` +
                    ` salió de la sala\n__auth:__ \`${authArray[player.id][0]}\`\n__conn:__ \`${authArray[player.id][1]}\``;
                fetch(roomWebhook, {
                    method: 'POST',
                    body: JSON.stringify({
                        content: stringContent,
                        username: roomName,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then((res) => res);
            }
    }, 10);
    updateTeams();
    updateAdmins();
};

room.onPlayerKicked = function (kickedPlayer, reason, ban, byPlayer) {
    if (roomWebhook != '') {
        var stringContent = `[${getDate()}] ⛔ ${ban ? 'BAN' : 'KICK'} (${playersAll.length}/${maxPlayers})\n` +
            `**${kickedPlayer.name}** [${authArray[kickedPlayer.id][0]}] {${authArray[kickedPlayer.id][1]}} was ${ban ? 'banned' : 'kicked'}` +
            `${byPlayer != null ? ' by **' + byPlayer.name + '** [' + authArray[byPlayer.id][0] + '] {' + authArray[byPlayer.id][1] + '}' : ''}`
        fetch(roomWebhook, {
            method: 'POST',
            body: JSON.stringify({
                content: stringContent,
                username: roomName,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((res) => res);
    }
    updateTeams();

};
