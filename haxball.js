const roomName = '🦆🦆🦆 TODOS JUEGAN 🦆🦆🦆';
const maxPlayers = 30;
const roomPublic = false;
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
};

var room = HBInit(gameConfig);

room.setScoreLimit(3);
room.setTimeLimit(4);
room.setTeamsLock(true);
room.setKickRateLimit(6, 0, 0);


/* ----------- DEFIS ------------*/

var playersAll = [];
var authArray = [];

/* -------- FUNCIONES --------*/

function sendMessagesInBatches() {
  if (messageQueue.length > 0) {
    sendingMessages = true;

    var messagesToSend = messageQueue.splice(0, 3);

      .map((message) => {
        return `[${message.time}] 💬 CHAT\n**${message.player.name}**: ${message.message.replace('@', '@ ')}`;
      })
      .join('\n');

    fetch(roomWebhook, {
      method: 'POST',
      body: JSON.stringify({
        content: messagesToSend,
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
}

/* ----------- EVENTOS ------------*/

room.onPlayerChat = (player, message) => {

    let msgArray = message.split(/ +/);
    lastMessageTime = Date.now();

    if (msgArray[0] != '!login') {
        var currentTime = getDate();
        messageQueue.push({ time: currentTime, player: player, message: message });

        if (messageQueue.length >= 3 && !sendingMessages) {
            sendMessagesInBatches();
        }
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
