//var db = require('./db');
/*var Character = {
	'wolf' : {
		'skill': ''
	},
	'villager': {},
	'prophet': {},
	'thief': {},
	'disturber': {}
};*/

var myTimer = 3600;
setInterval(function(){
	myTimer = myTimer - 1;
},1000);

function Game(sendMessage, gameoverCallback) {
	var gameStatus = 0;
	var playersInfo = [];
	var spectators = [];
	var pool = [];

	var showAllInfosTo = function(names) {
		for (var i in names) {
			sendMessage(names[i], 'spec', playersInfo);
		}
	};
	this.reconnect = function(name) {
		var playerInfo = getPlayerInfoByName(name);
		return playerInfo;
	};
	this.getTime = function() {
		return myTimer;
	};
	var getPlayerInfoByName = function(name) {
		for (var i in playersInfo) {
			if (name == playersInfo[i].name) {
				return playersInfo[i];
			}
		}
		return null;
	};
	var getRandomPlayerName = function() {
		return playersInfo[Math.floor(Math.random()*playersInfo.length)].name;
	}
	var characterDistribution = function(playersCount) {
		selected = [];
		switch (playersCount) {
		case 1:
			pool = ['villager', 'wolf', 'prophet', 'disturber'];
			break;
		case 2:
			pool = ['prophet', 'prophet', 'prophet', 'prophet', 'prophet'];
		//	pool = ['villager', 'wolf', 'prophet', 'disturber', 'thief'];
			break;
		case 3:
			pool = ['villager', 'wolf', 'prophet', 'disturber', 'thief', 'wolf'];
			break;
		case 4:
			pool = ['villager', 'wolf', 'prophet', 'disturber', 'thief', 'wolf', 'villager'];
			break;
		case 5:
			pool = ['villager', 'wolf', 'prophet', 'disturber', 'thief', 'wolf', 'villager', 'villager'];
			break;
		default:
		}
		for (var i = 0; i < playersCount; ++i) {
			var j = Math.floor(Math.random()*pool.length);
			playersInfo[i].originalCharacter = pool[j];
			playersInfo[i].finalCharacter = pool[j];
			pool.splice(j, 1);
		}
	};
	var doProphet = function(name, message) {
		var playerInfo = getPlayerInfoByName(name);
		if (playerInfo == null || gameStatus != 1 || playerInfo.originalCharacter != 'prophet') {
			return false;
		}
		playerInfo.nightOp = message.op;
		if (message.op == 'player') {
			for (var i in playersInfo) {
				if (message.info.name == playersInfo[i].name) {
					playerInfo.nightTarget = [message.info.name];
					sendMessage(name, 'succAct', {info:'查验成功'});
					sendMessage(name, 'prophet', [{name:message.name, id:message.info.id, character:playersInfo[i].originalCharacter}]);
					
					return true;
				}
			}
			sendMessage(name, 'failedAct', {info:'操作无效'});
			return false;
		}
		sendMessage(name, 'succAct', {info:'查验成功'});
		return true;
	};
	var doWolf = function(name, message) {
		var playerInfo = getPlayerInfoByName(name);
		if (playerInfo == null || gameStatus != 1 || playerInfo.originalCharacter != 'wolf') {
			return false;
		}
		return true;
	};
	var doVillager = function(name, message) {
		var playerInfo = getPlayerInfoByName(name);
		if (playerInfo == null || gameStatus != 1 || playerInfo.originalCharacter != 'villager') {
			return false;
		}
		return true;
	};
	var doThief = function(name, message) {
		var playerInfo = getPlayerInfoByName(name);
		if (playerInfo == null || gameStatus != 1 || playerInfo.originalCharacter != 'thief'
		 || name == message.name) {
			sendMessage(name, 'failedAct', {info:'操作无效'});
			return false;
		}
		for (var i in playersInfo) {
			if (playersInfo[i].name == message.name) {
				playerInfo.nightOp = 'done';
				playerInfo.nightTarget = [message.name];
				sendMessage(name, 'succAct', {info:'盗取成功'});
				sendMessage(name, 'thief', {id:playersInfo[i].id, character:playersInfo[i].originalCharacter});
				return true;
			}
		}
		sendMessage(name, 'failedAct', {info:'操作无效'});
		return false;
	};
	var doDisturber = function(name, message) {
		var playerInfo = getPlayerInfoByName(name);
		if (playerInfo == null || gameStatus != 1 || playerInfo.originalCharacter != 'disturber'
		 || playerInfo.name == message.name1 || playerInfo.name == message.name2 || message.name1 == message.name2) {
			sendMessage(name, 'failedAct', {info:'操作无效'});
			return false;
		}
		var count = 0;
		playerInfo.nightTarget = [];
		for (var i in playersInfo) {
			if (playersInfo[i].name == message.name1) {
				playerInfo.nightTarget.push(message.name1);
				++count;
			} else if (playersInfo[i].name == message.name2) {
				playerInfo.nightTarget.push(message.name2);
				++count;
			}
		}
		if (count < 2) {
			sendMessage(name, 'failedAct', {info:'操作无效'});
			return false;
		} else {
			playerInfo.nightOp = 'done';
			sendMessage(name, 'succAct', {info:'交换成功'});
			return true;
		}
	};
	var doVote = function(name, message) {
		var playerInfo = getPlayerInfoByName(name);
		if (message.name == '') {
			sendMessage(name, 'succAct', {info:'投票成功'});
			playerInfo.vote = '';
			return;
		}
		if (name == message.name || gameStatus != 3) {
			sendMessage(name, 'failedAct', {info:'操作无效'});
			return false;
		}
		sendMessage(name, 'succAct', {info:'投票成功'});
		playerInfo.vote = message.name;
	};
	var setRandom = function() {
		for (var i in playersInfo) {
			var playerInfo = playersInfo[i];
			if (playerInfo.nightOp != 'idle') {
				continue;
			}
			switch (playerInfo.originalCharacter) {
			case 'prophet':
				if (Math.random() < 0.5) {
					playerInfo.nightOp = 'pool';
				} else {
					while(!doProphet(playerInfo.name, {
						op: 'player', 
						info: {
							name: getRandomPlayerName()
						}
					})); // 可能导致死循环
				}
				break;
			case 'thief':
				while (!doThief(playerInfo.name, {
					name: getRandomPlayerName()
				})); // 可能导致死循环
				break;
			case 'disturber':
				while (!doDisturber(playerInfo.name, {
					name1: getRandomPlayerName(),
					name2: getRandomPlayerName()
				})); // 可能导致死循环
				break;
			case 'villager':
			case 'wolf':
			default:
				break;
			}
		}
	};
	var processProphet = function() {
		for (var i in playersInfo) {
			if (playersInfo[i].originalCharacter == 'prophet') {
				if (playersInfo[i].nightOp == 'pool') {
					/*var j = Math.floor(Math.random() * pool.length);
					var k = Math.floor(Math.random() * pool.length);
					while (j == k) {
						k = Math.floor(Math.random() * pool.length);
					}*/
					sendMessage(playersInfo[i].name, 'prophet', [pool[0], pool[1]]);
				} else if (playersInfo[i].nightOp == 'player') {
					var targetPlayerInfo = getPlayerInfoByName(playersInfo[i].nightTarget[0]);
					sendMessage(playersInfo[i].name, 'prophet', [{
						name: playersInfo[i].nightTarget[0],
						id:playersInfo[i].id,  //加id感觉好不科学
						character: targetPlayerInfo.originalCharacter
					}])
				}
			}
		}
	};
	var processWolf = function() {
		for (var i in playersInfo) {
			if (playersInfo[i].originalCharacter == 'wolf') {
				var wolfList = [];
				for (var j in playersInfo) {
					if (playersInfo[j].originalCharacter == 'wolf') {
						wolfList.push(playersInfo[j].id); // 用id感觉好不科学 // 用id很物理
					}
				}
				sendMessage(playersInfo[i].name, 'wolf', wolfList);
			}
		}
	};
	var processVillager = function() {
		for (var i in playersInfo) {
			if (playersInfo[i].originalCharacter == 'villager') {
				sendMessage(playersInfo[i].name, 'villager', {});
			}
		}
	};
	var processThief = function() { // 支持最多一个盗贼
		for (var i in playersInfo) {
			if (playersInfo[i].originalCharacter == 'thief') {
				var targetPlayerInfo = getPlayerInfoByName(playersInfo[i].nightTarget[0]);
				playersInfo[i].finalCharacter = targetPlayerInfo.originalCharacter;
				targetPlayerInfo.finalCharacter = playersInfo[i].originalCharacter;
				sendMessage(playersInfo[i].name, 'thief', {
					name: playersInfo[i].nightTarget[0],
					id:playersInfo[i].id,  //加id感觉好不科学
					character: targetPlayerInfo.originalCharacter
				});
				break;
			}
		}
	};
	var processDisturber = function() { // 支持最多一个捣蛋者
		for (var i in playersInfo) {
			if (playersInfo[i].originalCharacter == 'disturber') {
				var playerInfo1 = getPlayerInfoByName(playersInfo[i].nightTarget[0]);
				var playerInfo2 = getPlayerInfoByName(playersInfo[i].nightTarget[1]);
				var tmpCharacter = playerInfo1.finalCharacter;
				playerInfo1.finalCharacter = playerInfo2.finalCharacter;
				playerInfo2.finalCharacter = tmpCharacter;
				break;
			}
		}
	};
	var processActions = function() {
		setRandom(); /* 时间结束后未行动角色的随机行动 */
		processProphet();
		processWolf();
		//processVillager();
		processThief();
		processDisturber();
	};
	var processVotes = function() {
		var votesCount = 0;
		for (var i in playersInfo) playersInfo[i].voted = 0;
		for (var i in playersInfo) {
			if (playersInfo[i].vote != '') {
				getPlayerInfoByName(playersInfo[i].vote).voted += 1;
				++votesCount;
			}
		}
		var wc = 0;
		for (var i in playersInfo)
			if (playersInfo[i].finalCharacter == 'wolf')
				wc++;
		var drawVote = 0;
		for (var i in playersInfo)
			if (playersInfo[i].voted > 0)
				drawVote = playersInfo[i].voted;
		var flag = 1;
		for (var i in playersInfo)
			if (playersInfo[i].voted != drawVote)
				flag = 0;
		if (flag == 1 && wc == 0) {
			winner('villagers');
			return;
		}
		for (var i in playersInfo) {
			if (playersInfo[i].finalCharacter == 'wolf'
				&& (playersInfo[i].voted * 2 >= votesCount) ) {
				winner('villagers');
				return;
			}
		}
		
		winner('wolfs');
	};
	var addScore = function(name, score) {
		/*var dbh = new db();
		dbh.addScore(name, score, function() {
			dbh.closeDB();
		});*/
	};
	var winner = function(side) {
		for (var i in playersInfo) {
			sendMessage(playersInfo[i].name, 'result', {players:playersInfo, 
			gameStatus: 0,
			winner: side});
			if (side == 'wolfs' && playersInfo[i].finalCharacter == 'wolf') {
				addScore(playersInfo[i].name, 2);
			} else if (side == 'villagers' && playersInfo[i].finalCharacter != 'wolf') {
				addScore(playersInfo[i].name, 1);
			}
		}
	}
	var night = function(config) {
		gameStatus = 1;
		for (var i = 0; i < config.playersCount; ++i) {
			sendMessage(playersInfo[i].name, 'night', {
				gameStatus: gameStatus,
				character: playersInfo[i].originalCharacter
			});
		}
		showAllInfosTo(spectators);
		myTimer = config.nightTime;
		setTimeout(function(){day(config);}, config.nightTime * 1000);
	};
	var day = function(config) {
		console.log("pro actions");
		processActions();
		console.log("in day");
		gameStatus = 2;
		for (var i = 0; i < config.playersCount; ++i) {
			sendMessage(playersInfo[i].name, 'day', {
				gameStatus: gameStatus
			});
		}
		showAllInfosTo(spectators);
		console.log("delay next phase");
		myTimer = config.dayTime;
		setTimeout(function(){vote(config);}, config.dayTime * 1000);
	};
	var vote = function(config) {
		if (gameStatus == 3) {
			return;
		}
		gameStatus = 3;
		for (var i = 0; i < config.playersCount; ++i) {
			sendMessage(playersInfo[i].name, 'voting', {
				gameStatus: gameStatus
			});
		}
		showAllInfosTo(spectators);
		myTimer = config.voteTime;
		setTimeout(result, config.voteTime * 1000);
	};
	var result = function() {
		processVotes();
		showAllInfosTo(spectators);
		gameStatus = 0;
		playersInfo = [];
		spectators = [];
		gameoverCallback();
	};
	this.initial = function() {
		gameStatus = 0;
		playersInfo = [];
		spectators = [];
	};
	this.start = function(config) {
		gameStatus = 1;
		for (var i = 0; i < config.playersCount; ++i) {
			playersInfo.push({
				name: config.playersName[i],
				id: config.playersId[i],
				originalCharacter: '',
				finalCharacter: '',
				nightOp: 'idle',
				nightTarget: [],
				vote: '',
				voted: 0
			});
		} 
		characterDistribution(config.playersCount);
	//	for (var i in playersInfo)
		//	sendMessage(playersInfo[i].name, 'play', {gameStatus : 1, character : playersInfo[i].originalCharacter});
		night(config);
	};
	this.skipToVote = function(config) {
		if (gameStatus != 2) {
			return;
		}
		vote(config);
	}
	this.socketMessage = function(name, event, message) {
		switch (event) {
		case 'prophet':
			doProphet(name, message);
			break;
		case 'wolf':
			doWolf(name, message);
			break;
		case 'villager':
			doVillager(name, message);
			break;
		case 'thief':
			doThief(name, message);
			break;
		case 'disturber':
			doDisturber(name, message);
			break;
		case 'vote':
			doVote(name, message);
		default:
			break;
		}
	};
	this.addSpectator = function(name) {
		spectators.push(name);
		showAllInfosTo([name]);
	};
	this.removeSpectator = function(name) {
		for (var i in spectators) {
			if (spectators[i].name == name) {
				spectators.splice(i, 1);
				break;
			}
		}
	};
	this.getPlayersName = function() {
		var playersName = [];
		for (var i in playersInfo) {
			playersName.push(playersInfo[i].name);
		}
		return playersName;
	};
	this.getSpectatorsName = function() {
		return spectators;
	};
	this.getGameStatus = function() {
		return gameStatus;
	};
	this.getScore = function(name) {
		/*var dbh = new db();
		dbh.getScore(name, function(score) {
			dbh.closeDB();
			return score;
		});*/
	};
}

module.exports = Game;

/*game = new Game();

console.log(game.getScore('abc'));*/