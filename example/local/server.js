//Require Build In
const csServer = require('../../');
const server = new csServer({ port: '9999' });

const connections = []
server.on('connect', function(socket){
	console.log('Socket Connect: ' + socket.id);
	connections.push(socket)
});

server.on('disconnect', function(socket){
	console.log('Socket Disconnect: ' + socket.id);
	this.control.removeSocket(this.control.connections[socket.id]);
});

server.on('message', function(socket, message){
	for(var connection of connections){
		server.send(connection, message);
	}
});
