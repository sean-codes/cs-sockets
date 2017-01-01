# CS-Sockets
NodeJS Websockets For Sending Text/JSON (strings)

Still a work in progress!

# Purpose 
Text only based networking for simple JSON networking

# Performance
Local Machine ~3,000 per second 256 byte string Up/Down

100k 127byte strings Up/Down in 1 minute.

Remote ~500+ 256 byte string Up/Down (Coffee Shop Wireless Connection)


#Usage
An echo server:

    const csServer = require('csServer');
    const server = new csServer('127.0.0.1', '9999', 'index.html');

    server.on('connect', function(client){
        client.on('message', function(message){
            this.sendMessage(this, message);
        });
    });

Starting CS-Socket:

    const csServer = require('csServer');

Client Opening Connection:

    csServer.on('open', [function(client)]);

Client Sends Data:

    client.on('message', [function(message)]);

Sending Data to a Client:

    client.send([client to receive], message);

Client Disconnecting

    client.on('disconnect', [function])
