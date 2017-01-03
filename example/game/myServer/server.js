//Require Build In
const csServer = require('../../../');
const serverControl = require('./serverControl.js');
const server = new csServer({
	port: 9999
});

server.control = new serverControl(server);

server.on('connect', function(socket){
	console.log('Socket connected: ' + socket.id);
	this.control.addSocket(socket);
});

server.on('disconnect', function(socket){
	this.control.removeSocket(this.control.connections[socket.id]);
});

server.on('message', function(socket, message){
	this.control.message(this.control.connections[socket.id], message);
});