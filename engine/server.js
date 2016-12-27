//Require Build In
const http = require('http');
const fs = require('fs');
const csServer = require('./csServer');

//Sending a Message
csServer.on('message', function(socket, message){
    csServer.send(socket, message);
})