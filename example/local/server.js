//Require Build In
const csServer = require('../../');
const server = new csServer({
	hostname: '127.0.0.1',
	port: '9999',
	html: 'index.html'
});

server.on('connect', function(client){
	//Client Connected
	console.log('Client Connected');

	client.on('message', function(message){
		//Client Message
		this.sendMessage(this, message);
	});

	client.on('disonnect', function(){
		//Client Disconnected
	});
});