/*!
 * CS-Sockets: Server for text based websocketing
 * Copyright(c) 2017 Sean Mann <sean_codes@outlook.com>
 * MIT Licensed
 */

//Require
const csSocket = require('./csSocket');
const Emitter = require('events').EventEmitter;
const crypto = require('crypto');
const fs = require('fs');

//Constants
const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

class csServer extends Emitter{
    constructor(config){
        super();
        this.config = config;

        if(config.ssl)
            this.server = this.startSecureServer(config.ssl);
        else 
            this.server = this.startServer(config.ssl);
        
        this.server.listen(this.config.port);
        this.server.on('upgrade', this.httpUpgrade);
        this.server.csServer = this;
    }

    startServer(){
        var http = require('http');
        var server = http.createServer(this.httpRequest);
        return server; 
    }

    startSecureServer(){
        var http = require('https');
        var server = http.createServer({
              key: fs.readFileSync(this.config.ssl.key)
            , cert: fs.readFileSync(this.config.ssl.cert)
        }, this.httpRequest);
        return server;
    }

    httpRequest(request, response){
        if(!this.csServer.config.html) return;
        response.writeHead(200);
        fs.readFile(this.csServer.config.html, function(error, content){
            response.end(content);
        });
    }

    httpUpgrade(request, socket, head){
        var secWebSocketKey = request.headers['sec-websocket-key'] + WS_MAGIC_STRING;
        var hashedKey = crypto
            .createHash('SHA1')
            .update(secWebSocketKey)
            .digest('base64');

        this.csServer.writeUpgradeHeader(socket, hashedKey);
        this.csServer.initSocket(socket);

        this.csServer.emit('connect', socket.cs);
    };

    writeUpgradeHeader(socket, hashedKey){
        socket.write( 
              'HTTP/1.1 101 Switching Protocols\r\n'
            + 'Upgrade: websocket\r\n'
            + 'Connection: Upgrade\r\n'
            + `Sec-WebSocket-Accept: ${hashedKey}\r\n\r\n`
        );
    }

    initSocket(socket){
        //Socket Configuration
        socket.setTimeout(0);
        socket.allowHalfOpen = false;
        socket.setNoDelay(true);

        //Link with CS
        socket.cs = new csSocket(this, socket);

        socket.on('data', function(newData){
            if(socket.id == -1) return;
            this.cs.buffer = Buffer.concat([socket.cs.buffer, newData]);
            this.cs.receivedData(newData.length);
        }); 

        socket.on('close', function(){
            this.cs.emit('disconnect'); 
        });

        socket.on('end', function(){
            this.destroy();
        });
    }
}

module.exports = csServer;