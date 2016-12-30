//Require Build In
const csServer = require('./csServer');
const server = new csServer('127.0.0.1', '9999', 'index.html');

server.on('open', function(client){
	client.on('message', function(message){
		this.sendMessage(this, message);
	});

	client.on('close', function(){
		console.log('Client Connection Closed');
	});
});