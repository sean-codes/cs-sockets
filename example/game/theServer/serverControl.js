class serverControl {
	constructor(server){
		this.server = server;
		this.connections = {};
	}

	addSocket(socket){
		this.connections[socket.id] = {
			id: socket.id,
			socket: socket,
			live: true,
			x: 0,
			y: 0
		};
		this.sendUnicast(this.connections[socket.id], { type: 'connect', id: socket.id });
	}

	removeSocket(socket){
		socket.live = false;
		this.sendBroadcast({ type: 'endPlayers', list: [{id: socket.id}] });
	}

	message(socket, message){
		var message = JSON.parse(message);
		switch(message.type){
			case 'connect':
				socket.x = message.x; socket.y = message.y;
				this.connections[socket.id] 
				this.sendMulticast(socket, { 
					type: 'newPlayers', 
					list: [{
						id: socket.id, 
						x: socket.x, 
						y: socket.y
					}] 
				});
				var currentConnections = [];
				for(var socketID in this.connections){
					if(socketID !== socket.id){
						var conn = this.connections[socketID];
						if(conn.live)
							currentConnections.push({ id: conn.id, x: conn.x, y: conn.y });
					}
				};
				if(currentConnections.length > 0){
					this.sendUnicast(socket, { type: 'newPlayers', list: currentConnections});
				}
				break;
			
			case 'movement':
				socket.x = message.x; socket.y = message.y;
				this.sendMulticast(socket, {
					type: 'movement',
					id: socket.id,
					keys: message.keys,
					x: socket.x,
					y: socket.y,
					hspeed: message.hspeed,
					vspeed: message.vspeed
				});
				break;
		}
	}

	sendBroadcast(message){
		var message = this.stringify(message);
		var server = this.server;
		for(var socketID in this.connections){
			var connection = this.connections[socketID];
			server.send(connection.socket, message);
		}
	}

	sendMulticast(from, message){
		var message = this.stringify(message);
		var server = this.server;
		for(var socketID in this.connections){
			var connection = this.connections[socketID];
			if(connection.id !== from.id){
				server.send(connection.socket, message);
			}
		};
	}

	sendUnicast(to, message){
		var message = this.stringify(message);
		this.server.send(to.socket, message);
	}

	stringify(message){
		if(typeof message !== 'string'){
			return JSON.stringify(message);
		}
	}
}

module.exports = serverControl;