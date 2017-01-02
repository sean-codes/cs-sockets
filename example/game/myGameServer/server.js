//Require Build In
const csServer = require('../../../');
const serverControl = require('./serverControl.js');
const server = new csServer({
	port: 9999
});

server.control = new serverControl(server);

server.on('connect', function(socket){
	console.log('socket Connected ' + socket.id);
	this.control.addSocket(socket);
});

server.on('disconnect', function(socket){
	console.log('socket Disconnected');
});

server.on('message', function(socket, message){
	this.control.message(socket, message);
});