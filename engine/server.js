//Require Build In
const csServer = require('./csServer');
csServer.on('open', function(client){
	//Add to list
	console.log('real open');
	client.on('message', function(message){
		this.sendMessage(this, message);
		//this.sendMessage('globalcast', message);
		//this.sendMessage('broadcast', message);
		//this.sendMessage('multicast', message);
	});

	client.on('close', function(){
		//Remove from list
		console.log('emitted close');
	});
});