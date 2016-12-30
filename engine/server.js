//Require Build In
const csServer = require('./csServer');

csServer.on('message', function(client, message){
	//To a Specific clientID
    //this.sendMessage(client, client, message);

    //To everyone but SocketID
    //this.sendMessage(client, 'multicast', message);

    //To Everyone in Room
    this.sendMessage(client, 'broadcast', message);

    //To Everyone in Game
    //this.sendMessage(client, 'globalcast', message);
});