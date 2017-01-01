//Require Build In
const csServer = require('../../');
const server = new csServer({
	port: 9999,
	ccssl: {
		key: '/etc/letsencrypt/archive/cube-script.net/privkey1.pem',//Your key path
		cert: '/etc/letsencrypt/archive/cube-script.net/fullchain1.pem'//Your Cert Path
	}
});

server.on('connect', function(client){
	//Client Connected
	console.log('Client Connected');

	client.on('message', function(message){
		//Client Message
		console.log('Client Message: ' + message);
		this.sendMessage(this, message);
	});

	client.on('disonnect', function(){
		//Client Disconnected
		console.log('Client Disconnected');
	});
});