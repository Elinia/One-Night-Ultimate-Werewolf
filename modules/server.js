var express = require('express');
var app = express();
var serv = require('http').Server(app);
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(8889);
console.log("Server started.");

var DEBUG = true;
var SOCKET_LIST = [];
var SOCKET_DICT = [];
var ONLINE_DICT = [];
var READY_DICT = [];
var SCORE_DICT = [];
var SPEC_DICT = [];
var STATUS = 0;
var io = require('socket.io')(serv,{});

var theGame = require('./game');
var game = new theGame(function(name, event, message) { /* sendMessage */
	if (SOCKET_DICT[name])
		SOCKET_DICT[name].emit(event, message);
}, function() { /* gameoverCallback*/
	/* TODO refresh */
	init();
});

var num = 0;
io.sockets.on('connection', function(socket){
    num = num + 1;
    socket.id = num;
    console.log("Connection start " + num);
    
	
	socket.on('chat',function(data){
		for (var i in SOCKET_LIST)
			SOCKET_LIST[i].emit('chat', data);
	});
	
	socket.on('signIn',function(data){
        socket.name = data.username;
        if (data.username == '') {
        	console.log("fail " + socket.id);
            socket.emit('signInResponse',{success:false, id:socket.id, info:"不能使用空用户名"});
        } else if (ONLINE_DICT[data.username]) {
			console.log("fail " + socket.id);
            socket.emit('signInResponse',{success:false, id:socket.id, info:"该用户已在别处登录……"});
        } else if (game.getGameStatus() != 0) {
        	/* 游戏开始后进入还没写好 */
			console.log(socket.name + " join when game started");
            //socket.emit('signInResponse',{success:true, id:socket.id, status:STATUS});
        	var playersName = game.getPlayersName();
        	for (var i in playersName) {
        		if (playersName[i] == socket.name) {
        			addPlayer(socket, 'player');
					socket.emit('reconnect', {
						gameStatus: game.getGameStatus(),
						timer : game.getTime(),
						character: game.reconnect(socket.name).originalCharacter
					});
        			return;
        		}
        	}
        	ONLINE_DICT[data.username] = true;
        	SPEC_DICT[data.username] = true;
        	addPlayer(socket, 'spectator');
        	socket.emit('spec', {
				gameStatus: game.getGameStatus()
			});
        } else {
            ONLINE_DICT[data.username] = true;
            READY_DICT[data.username] = false;
            addPlayer(socket, 'player');
        }
	});
	socket.on('ready', function() {
		if (game.getGameStatus() != 0) {
			return;
		}
		   
		socket.info.ready = true;
		var playerCount = 0;
		for(var i in SOCKET_LIST) {
			SOCKET_LIST[i].emit('updatePlayer', [socket.info]);
		}	
		var allReady = true;
		READY_DICT[socket.name] = true;
		for (var i in ONLINE_DICT) {
			if (!ONLINE_DICT[i]) continue;
			playerCount++;
			if (!READY_DICT[i]) {
				allReady = false;
				//break;
			}
		}
			console.log('check, players ' + playerCount);
		if (allReady && playerCount >= 2 && playerCount <= 5) {
			console.log('start, players ' + playerCount);
			var playerName = [];
			var playerId = [];
			for (var i in SOCKET_LIST) {
				playerName.push(SOCKET_LIST[i].name);
				playerId.push(SOCKET_LIST[i].id);
			}
			game.start({
				playersCount: playerCount,
				playersName: playerName,
				playersId: playerId,
				//nightTime: 3,
				//dayTime: 4,
				//voteTime: 5
				nightTime: 30,
				dayTime: 900,
				voteTime: 90
			});
		}
	});
	socket.on('prophet', function(data) {
		game.socketMessage(socket.name, 'prophet', data);
	});
	socket.on('wolf', function(data) {
		game.socketMessage(socket.name, 'wolf', data);
	});
	socket.on('villager', function(data) {
		game.socketMessage(socket.name, 'villager', data);
	});
	socket.on('thief', function(data) {
		game.socketMessage(socket.name, 'thief', data);
	});
	socket.on('disturber', function(data) {
		game.socketMessage(socket.name, 'disturber', data);
	});
	socket.on('vote', function(data) {
		game.socketMessage(socket.name, 'vote', data);
	});
	socket.on('disconnect',function(){
		console.log("Log out " + socket.id + " " + SOCKET_LIST.length);
		ONLINE_DICT[socket.name] = false;
		READY_DICT[socket.name] = false;
		SPEC_DICT[socket.name] = false;
		for(var i in SOCKET_LIST)
    		if (SOCKET_LIST[i].id != socket.id)
        		SOCKET_LIST[i].emit('remove', {id:socket.id, name:socket.name});
		console.log("Log out " + socket.name);
		
		delete SOCKET_DICT[socket.name];
		delete SOCKET_LIST[socket.id];
		
		var playerCount = 0;
		for (var i in SOCKET_LIST) {
			playerCount++;
		}
		if (playerCount == 0)
			init();
	});
});

function broadcast(tag, json) {
	for (var i in SOCKET_LIST) {
		SOCKET_LIST[i].emit(tag, json);
	}
}

function addPlayer(socket, jobName) {
	socket.emit('signInResponse',{success:true, id:socket.id, gameStatus:STATUS});
    SOCKET_LIST[socket.id] = socket;
	console.log("length change " + SOCKET_LIST.length);
    SOCKET_DICT[socket.name] = socket;
    var playersPack = [];
    if (!SCORE_DICT[socket.name]) {
    	SCORE_DICT[socket.name] = 0;
    }
    socket.info = {id: socket.id, score: SCORE_DICT[socket.name], name: socket.name, job: jobName, ready:false};
	console.log("send info" + socket.id);
    for(var i in SOCKET_LIST) {
		console.log("??" + i);
        playersPack.push(SOCKET_LIST[i].info);
        SOCKET_LIST[i].emit('updatePlayer', [socket.info]);
    }
    socket.emit('updatePlayer', playersPack);
}

/*function result() {
	STATUS = 0;
	var wolfs = [];
	var villagers = [];
	for (var i in PLAYER_INFO_LIST) {
		if (PLAYER_INFO_LIST[i].newchar == 'wolf') {
			wolfs.push({
				name: PLAYER_INFO_LIST[i].name,
				voted: false
			});
		} else {
			villagers.push({
				name: PLAYER_INFO_LIST[i].name
			})
		}
	}
	var rightCount = 0;
	var wrongCount = 0;
	switch (wolfs.length) {
	case 0:
		for (var i in PLAYER_INFO_LIST) {
			if (PLAYER_INFO_LIST[i].vote != null) {
				++wrongCount;
			} else {
				++rightCount;
			}
		}
		if (rightCount >= wrongCount) {
			villsWin();
		} else {
			wolfsWin();
		}
		break;
	case 1:
		for (var i in PLAYER_INFO_LIST) {
			if (PLAYER_INFO_LIST[i].vote != wolfs[0].name) {
				++wrongCount;
			} else {
				++rightCount;
			}
		}
		if (rightCount >= wrongCount) {
			villsWin();
		} else {
			wolfsWin();
		}
		break;
	default:
		for (var i in PLAYER_INFO_LIST) {
			if (PLAYER_INFO_LIST[i].newchar != 'wolf') {
				for (var j in wolfs) {
					if (PLAYER_INFO_LIST[i].vote == wolfs.name) {
						wolfs.voted = true;
						break;
					}
				}
			}
		}
		var allWolfsVoted = true;
		for (var i in wolfs) {
			if (!wolfs.voted) {
				allWolfsVoted = false;
				break;
			}
		}
		if (allWolfsVoted) {
			villsWin();
		} else {
			wolfsWin();
		}
		break;
	}
	init();
}

function villsWin() {
	for (var i in SOCKET_LIST) {
		SOCKET_LIST[i].emit('result', {
			gameStatus: STATUS,
			winner: 'villagers',
			players: PLAYER_INFO_LIST,
			pool: POOL
		});
	}
	for (var i in PLAYER_INFO_LIST) {
		if (PLAYER_INFO_LIST[i].newchar != 'wolf') {
			SCORE_DICT[PLAYER_INFO_LIST[i].name] += 1;
		}
	}
}

function wolfsWin() {
	for (var i in SOCKET_LIST) {
		SOCKET_LIST[i].emit('result', {
			gameStatus: STATUS,
			winner: 'wolfs',
			players: PLAYER_INFO_LIST,
			pool: POOL
		});
	}
	for (var i in PLAYER_INFO_LIST) {
		if (PLAYER_INFO_LIST[i].newchar == 'wolf') {
			SCORE_DICT[PLAYER_INFO_LIST[i].name] += 2;
		}
	}
}*/

function init() {
	swapFlag = 0;
	STATUS = 0;
	for (var i in SOCKET_LIST) {
		SOCKET_LIST[i].info.ready = false;
		SPEC_DICT[SOCKET_LIST[i].name] = false;
		READY_DICT[SOCKET_LIST[i].name] = false;
	}
	
    var playersPack = [];
	
    for(var i in SOCKET_LIST) {
		SOCKET_LIST[i].info.job = 'player';
        playersPack.push(SOCKET_LIST[i].info);
    }
    for(var i in SOCKET_LIST)
		SOCKET_LIST[i].emit('updatePlayer', playersPack);
	
}