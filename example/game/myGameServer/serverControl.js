class serverControl {
	constructor(server){
		this.server = server;
		this.connections = [];
	}

	addSocket(socket){
		this.connections.push({
			id: socket.id,
			socket: socket
		});
		this.sendUnicast(socket, { type: 'connect', id: socket.id });
	}

	message(socket, message){
		var message = JSON.parse(message);
		switch(message.type){
			case 'connect':
				this.sendMulticast(socket, { type: 'newPlayers', list: [{id: socket.id}] });
				var currentConnections = [];
				this.connections.forEach(function(connection){
					if(connection.id !== socket.id){
						currentConnections.push({
							id: connection.id
						});
					}
				});
				this.sendUnicast(socket, { type: 'newPlayers', list: currentConnections})
				break;

			case 'movement':
				this.sendMulticast(socket, {
					type: 'movement',
					id: socket.id,
					keys: message.keys
				});
				break;
		}
	}

	sendBroadcast(message){
		var message = this.stringify(message);
		var server = this.server;
		this.connections.forEach(function(connection){
			server.send(connection.socket, message);
		});
	}

	sendMulticast(from, message){
		var message = this.stringify(message);
		var server = this.server;
		this.connections.forEach(function(connection){
			if(connection.id !== from.id){
				server.send(connection.socket, message);
			}
		});
	}

	sendUnicast(to, message){
		var message = this.stringify(message);
		this.server.send(to, message);
	}

	stringify(message){
		if(typeof message !== 'string'){
			return JSON.stringify(message);
		}
	}
}


module.exports = serverControl;