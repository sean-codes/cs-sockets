//Network
const csSocket = require('./csSocket');
const Emitter = require('events').EventEmitter;
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');

//Constants 
const HOSTNAME = 'localhost';
const PORT = 9999;
const HTML_INDEX = 'index.html';

const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const FO_FINISHED = 129;
const PL_LARGE = 126;

class csServer extends Emitter{
    constructor(ip, port, html){
        super();
        this.ip = ip;
        this.port = port;
        this.html = html;
        this.server = http.createServer((requestIncoming, responseOutGoing) => {
            responseOutGoing.statusCode = 200;
            responseOutGoing.setHeader('Contenet-Type', 'text/html');

            fs.readFile(HTML_INDEX, function(error, content){ 
                responseOutGoing.end(content);
            });    
        });
        this.server.csServer = this;
        this.server.listen(PORT, HOSTNAME, () => {
            console.log(`Server is online on http://${HOSTNAME}:${PORT}`);
        });

        this.server.on('upgrade', function(request, socket, head){
            var secWebSocketKey = request.headers['sec-websocket-key'] + WS_MAGIC_STRING;
            var hashedKey = crypto.createHash('SHA1').update(secWebSocketKey).digest('base64');

            socket.write( 
                  'HTTP/1.1 101 Switching Protocols\r\n'
                + 'Upgrade: websocket\r\n'
                + 'Connection: Upgrade\r\n'
                + `Sec-WebSocket-Accept: ${hashedKey}\r\n\r\n`
            );
            socket.setTimeout(0);
            socket.allowHalfOpen = false;
            socket.setNoDelay(true);
            socket.cs = new csSocket(this, socket); 

            this.csServer.emit('open', socket.cs);
            //Basic Event Handling
            socket.on('data', function(newData){
                if(socket.id == -1) return;
                this.cs.buffer = Buffer.concat([socket.cs.buffer, newData]);
                this.cs.receivedData(newData.length);
            }); 

            socket.on('close', function(){
                console.log('Socket Closed');
                this.cs.emit('close'); 
            });

            socket.on('end', function(){
                console.log('Socket End Then running destroy');
                this.destroy();
            });

            socket.on('error', function(){
                console.log('Socket Error');
            });
        });
    }
}

//Create Server
/*
csServer = http.createServer((requestIncoming, responseOutGoing) => {
    responseOutGoing.statusCode = 200;
    responseOutGoing.setHeader('Contenet-Type', 'text/html');

    fs.readFile(HTML_INDEX, function(error, content){ 
        responseOutGoing.end(content);
    });    
});
    

//Listen
csServer.listen(PORT, HOSTNAME, () => {
    console.log(`Server is online on http://${HOSTNAME}:${PORT}`);
});

//Handle Upgrades to Websocket
csServer.on('upgrade', function(request, socket, head){
    var secWebSocketKey = request.headers['sec-websocket-key'] + WS_MAGIC_STRING;
    var hashedKey = crypto.createHash('SHA1').update(secWebSocketKey).digest('base64');

    socket.write( 
          'HTTP/1.1 101 Switching Protocols\r\n'
        + 'Upgrade: websocket\r\n'
        + 'Connection: Upgrade\r\n'
        + `Sec-WebSocket-Accept: ${hashedKey}\r\n\r\n`
    );
    socket.setTimeout(0);
    socket.allowHalfOpen = false;
    socket.setNoDelay(true);
    socket.cs = new csSocket(this, socket); 
    this.emit('open', socket.cs);
    //Basic Event Handling
    socket.on('data', function(newData){
        if(socket.id == -1) return;
        this.cs.buffer = Buffer.concat([socket.cs.buffer, newData]);
        this.cs.receivedData(newData.length);
    }); 

    socket.on('close', function(){
        console.log('Socket Closed');
        this.cs.emit('close'); 
    });

    socket.on('end', function(){
        console.log('Socket End Then running destroy');
        this.destroy();
    });

    socket.on('error', function(){
        console.log('Socket Error');
    })
});
*/
module.exports = csServer;