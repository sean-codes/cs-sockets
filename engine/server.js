//Require Build In
const csServer = require('./csServer');

csServer.on('message', function(socket, message){
	//To a Specific SocketID
    socket.message(socket, message);
    //To everyone but SocketID
    //socket.send('multicast', message);

    //To Everyone in Room
    //socket.send('broadcast', message);

    //To Everyone in Game
    //socket.send('globalcast', message);
});