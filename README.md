# CS-Sockets
Pure NodeJS server for snappy string networking

Still a work in progress!
>npm install cs-sockets

# Purpose 
Text only based networking for simple JSON networking

# Performance
Local Machine ~3,000 per second 256 byte string Up/Down

100k 127byte strings Up/Down in 1 minute.

Remote ~500+ 256 byte string Up/Down (Coffee Shop Wireless Connection)


#Usage
###An echo server:

    const csServer = require('csServer');
    const server = new csServer({ port: '9999' });

    server.on('connect', function(socket){
        
    server.on('message', function(socket, message){
            this.send(socket, message);
        });
    });

###Starting CS-Sockets:

    const csServer = require('csServer');
    const server = new csServer({[options]})


###Socket Opens Connection:

    csServer.on('connect', [function(socket)]);

###Socket Sends Data:

    csServer.on('message', [function(message)]);

###Sending Data to a socket:

    csServer.send([socket to receive], message);

###Socket Disconnecting

    csServer.on('disconnect', [function(socket)])

###SSL Connections
To use your SSL and Key add a ssl field to your csServer options
>When the server starts you should see the message Starting Server (SSL)

    const server = new csServer({
        port: 9999,
        ssl: {
            key: '/etc/letsencrypt/archive/cube-script.net/privkey1.pem',//Your key path
            cert: '/etc/letsencrypt/archive/cube-script.net/fullchain1.pem'//Your Cert Path
        }
    });
    



