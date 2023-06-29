const roomName = '🦆 TODOS JUEGAN 🦆';
const maxPlayers = 30;
const roomPublic = true;
const token = roomArgs['token'];
const region = [{ "code": "co", "lat": 4.570860, "lon": -74.297333 }];

var roomWebhook = 'https://discord.com/api/webhooks/1121548089782710303/qlkzuEiAxNK_wldQpcRH3iUAEpZO7W_j1SPPjp_mdB4Y_n-5Hp_Jdld7dtvMtDC3ERxy'; // this webhook is used to send the details of the room (chat, join, leave) ; it should be in a private discord channel

var gameConfig = {
    roomName: roomName,
    maxPlayers: maxPlayers,
    public: roomPublic,
    token: token,
    noPlayer: true,
    geo: region[0],
}

var room = HBInit(gameConfig);

room.setScoreLimit(3);
room.setTimeLimit(4);
room.setTeamsLock(true);
room.setKickRateLimit(6, 0, 0);


/* ----------- DEFIS ------------*/

var playersAll = [];
var authArray = [];

var messageQueue = [];
var sendingMessages = false;

var teamRed = [];
var teamBlue = [];
var teamSpec = [];

var voteKickData = {
    active: false,
    target: null,
    initiator: null,
    votes: 0,
    voters: new Set(),
    requiredVotes: 0,
    timeout: null,
};

let roomLink = '';

/* ------- SPAMSITO ------- */

let spamLiga = setInterval(() => {
    room.sendAnnouncement("🏆 Acabamos de iniciar nuestra liga y puedes crear tu propio equipo ahora mismo! Únete al discord y haz campeón a tu club: https://discord.gg/7eFj8QBnwU", null, 0xffea56, 'normal', 1);
}, 200000);


/* -------- FUNCIONES --------*/

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

function getDate() {
    let d = new Date();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function updateTeams() {
    playersAll = room.getPlayerList();
    teamRed = playersAll.filter((p) => p.team == 1);
    teamBlue = playersAll.filter((p) => p.team == 2);
    teamSpec = playersAll.filter((p) => p.team == 0);
}

/* ------------ COMANDOS ------------ */

function votekick(player, message) {
    var msgArray = message.split(/ +/).slice(1);
    let targetPlayer = null;
    let targetPlayerID = null;

    if (room.getPlayerList().length < 3) {
        room.sendAnnouncement(
            `🔴 Deben haber al menos 3 jugadores en la sala`,
            player.id
        );
        return;
    }

    if (msgArray.length > 0) {
        if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
            msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
            if (room.getPlayer(parseInt(msgArray[0])) != null) {
                targetPlayerID = room.getPlayer(parseInt(msgArray[0]));
            } else {
                room.sendAnnouncement(
                    `🔴 No se pudo encontrar al jugador objetivo`,
                    player.id
                );
                return;
            }
        } else {
            room.sendAnnouncement(
                `🔴 Debes mencionar al jugador objetivo usando #`,
                player.id
            );
            return;
        }
    } else {
        room.sendAnnouncement(
            `🔴 Debes mencionar a un jugador objetivo usando #`,
            player.id
        );
        return;
    }

    targetPlayer = targetPlayerID;

    if (voteKickData.active) {
        room.sendAnnouncement(
            `🔴 Ya hay una votación en curso. Espera a que termine antes de iniciar una nueva`,
            player.id,
        );
        return;
    }

    voteKickData = {
        active: true,
        target: targetPlayer.id,
        initiator: player.id,
        votes: 1,
        voters: new Set([player.id]),
        requiredVotes: Math.ceil(room.getPlayerList().length / 2),
        timeout: setTimeout(() => {
            if (voteKickData.active && voteKickData.initiator === player.id) {
                room.sendAnnouncement(
                    `🟣 La votación para expulsar a ${targetPlayer.name} ha expirado`,
                    null
                );
                voteKickData.active = false;
            }
        }, 60 * 1000),
    };

    room.sendAnnouncement(
        `🟡 ${player.name} ha iniciado una votación para expulsar a ${targetPlayer.name}. Usa !vote para votar. Tienen 1 minuto para votar. (${voteKickData.votes}/${voteKickData.requiredVotes})`,
        null,
        announcementColor,
        'bold',
        HaxNotification.CHAT
    );
}

function vote(player) {
    if (voteKickData.active) {
        if (voteKickData.voters.has(player.id)) {
            room.sendAnnouncement(
                `🔴 Ya has votado para expulsar al jugador objetivo`,
                player.id
            );
        } else if (voteKickData.initiator === player.id) {
            room.sendAnnouncement(
                `🔴 No puedes votar en una votación que tú mismo iniciaste`,
                player.id
            );
        } else {
            let remainingVotes = voteKickData.requiredVotes - voteKickData.votes;
            let targetPlayer = room.getPlayer(voteKickData.target);
            if (targetPlayer) {
                voteKickData.voters.add(player.id);
                voteKickData.votes++;

                room.sendAnnouncement(
                    `🟢 ${player.name} ha votado para expulsar a ${targetPlayer.name} (${voteKickData.votes}/${voteKickData.requiredVotes}). Usa !vote para votar.`,
                    null
                );

                if (voteKickData.votes >= voteKickData.requiredVotes) {
                    clearTimeout(voteKickData.timeout);
                
                    room.sendAnnouncement(
                        `🟡 ${targetPlayer.name} ha sido expulsado por votación`,
                        null
                    );
                
                    room.kickPlayer(targetPlayer.id, 'Fuiste expulsado por votación', false);
                    voteKickData.active = false;
                }
            } else {
                room.sendAnnouncement(
                    `🔴 La votación ha terminado o el jugador objetivo ya no está en la sala`,
                    player.id
                );
            }
        }
    } else {
        room.sendAnnouncement(
            `🔴 No hay ninguna votación en curso en la que puedas participar`,
            player.id
        );
    }
}

/* ----------- EVENTOS ------------*/

room.onPlayerChat = (player, message) => {

    let msgArray = message.split(/ +/);
    lastMessageTime = Date.now();


    if (msgArray[0].toLowerCase() == '!login') {
        if (msgArray[1] == '123xx') {
            room.setPlayerAdmin(player.id, true);
        }
    } else if (msgArray[0].toLowerCase() == '!rr' && player.admin) {
        room.stopGame();
        setTimeout(() => {
            room.startGame();
        }, 10);
        room.sendAnnouncement(`🟣 El juego fue reiniciado por ${player.name}`);
    } else if (msgArray[0].toLowerCase() == '!swap' && player.admin) {
        for (let player of teamBlue) {
            room.setPlayerTeam(player.id, 1);
        }   
        for (let player of teamRed) {
            room.setPlayerTeam(player.id, 2);
        }
        room.sendAnnouncement(`🟣 Los equipos fueron intercambiados por ${player.name}`);
    } else if (msgArray[0].toLowerCase() == '!clearbans' && player.admin) {
        room.clearBans();
        room.sendAnnouncement(`🟣 Los baneos de la sala fueron removidos por ${player.name}`);
    } else if ((['!bb', '!gn', '!cya', '!ping']).includes(msgArray[0].toLowerCase())) {
        room.kickPlayer(player.id, 'Hasta luego 🦆', false);
    } else if (msgArray[0].toLowerCase() == '!votekick') {
        votekick(player, message);
    } else if (msgArray[0].toLowerCase() == '!vote') {
        vote(player);
    } else if (msgArray[0].toLowerCase() == '!help') {
        if (!player.admin) {
            room.sendAnnouncement(`📜 Comandos: !help | !bb | !votekick | !vote | !discord`, player.id);
        } else if (player.admin) {
            room.sendAnnouncement(`📜 Comandos: !help | !bb | !votekick | !vote | !discord |!rr | !swap | !clearbans`, player.id);
        }
    } else if (msgArray[0].toLowerCase() == '!discord') {
        room.sendAnnouncement(`⚪ Entra al discord! -> https://discord.gg/7eFj8QBnwU`, player.id);
    }


    if (msgArray[0] != '!login') {
        var currentTime = getDate();
        messageQueue.push({ time: currentTime, player: player, message: message });

        if (messageQueue.length >= 3 && !sendingMessages) {
            sendMessagesInBatches();
        }
    }

    if (msgArray[0].toLowerCase().startsWith('!')) {
        return false;
    }

}

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
        `⚪ Bienvenido a Lightning, ${player.name}! Escriba !help para ver los comandos`,
        player.id,
        null,
        'normal',
        0
    );
    room.sendAnnouncement(
        `⚪ Reportar mala conducta de un administrador: https://discord.gg/7eFj8QBnwU`,
        player.id,
        null,
        'normal',
        1
    );

    updateTeams();
    updateAdmins();

};

room.onPlayerTeamChange = function (changedPlayer, byPlayer) {
    updateTeams();
};

room.onPlayerAdminChange = function (changedPlayer, byPlayer) {
    updateTeams();

    const adminPlayers = room.getPlayerList().filter((player) => player.admin);

    if (changedPlayer.admin) {
        if (byPlayer != null) {
            if (adminPlayers.length<= 3) {
            room.sendAnnouncement(`🟡 ${byPlayer.name} le ha otorgado administrador a ${changedPlayer.name}!`);
            } else {
                room.sendAnnouncement(`🔴 No es posible otorgar más administradores porque ya hay 3 como máximo`);
                room.setPlayerAdmin(changedPlayer.id, false);
            }
        } else {
            room.sendAnnouncement(`🟡 Se le ha otorgado administrador a ${changedPlayer.name}!`);
        }

    }
};

room.onPlayerKicked = function (kickedPlayer, reason, ban, byPlayer) {

    kickFetchVariable = true;
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

};
