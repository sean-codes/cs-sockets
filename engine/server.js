//Require Build In
const csServer = require('./csServer');

csServer.on('message', function(client, message){
	//To a Specific clientID
    this.sendMessage(client.id, client.id, message);

    //To everyone but SocketID
    //this.sendMessage(client.id, 'multicast', message);

    //To Everyone in Room
    //this.sendMessage(sclient.id, 'broadcast', message);

    //To Everyone in Game
    //this.sendMessage(client.id, 'globalcast', message);
});