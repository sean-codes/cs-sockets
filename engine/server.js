//Require Build In
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

//My Consts
const hostname = 'localhost';
const port = 9999;
const webSocketMagicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const STATE_START = 0;
const STATE_GET_LENGTH = 1;
const STATE_GET_MASK = 2;
const STATE_GET_DATA = 3;

//Create Server
const server = http.createServer((requestIncoming, responseOutGoing) => {
    responseOutGoing.statusCode = 200;
    responseOutGoing.setHeader('Contenet-Type', 'text/html');

    fs.readFile('index.html', function(error, content){ 
        responseOutGoing.end(content);
    });    
});

server.listen(port, hostname, () => {
    console.log(`Server is online on http://${hostname}:${port}`);
});

server.on('upgrade', (request, socket, head) => {
    var secWebSocketKey = request.headers['sec-websocket-key'] + webSocketMagicString;
    var hashedKey = crypto.createHash('SHA1').update(secWebSocketKey).digest('base64');
    
    //Send Back to requester
    socket.write( 
          'HTTP/1.1 101 Switching Protocols\r\n'
        + 'Upgrade: websocket\r\n'
        + 'Connection: Upgrade\r\n'
        + 'Sec-WebSocket-Accept: '+hashedKey+'\r\n'
        + '\r\n'
    );

    socket.cs = {
        socket : socket,
        buffer : Buffer.allocUnsafe(1000000),
        state : STATE_START,
        payloadLength : 0,
        payloadStart : 0,
        bufferLength : 0,
        messagesRead : 0
    }
    socket.cs.start = function(){
        if(this.bufferLength < 2) return;
        this.maskOpBlah = this.bufferRead(1)[0];
        this.payloadLength = this.bufferRead(1)[0] & 0x7f; 
        if(this.payloadLength === 126){
            this.state = STATE_GET_LENGTH;
            this.getLength();
        } else {
            this.state = STATE_GET_MASK;
            this.getMask();
        }
    }
    
    socket.cs.getLength = function(){
        if(this.bufferLength < 2) return
        this.payloadLength = this.bufferRead(2).readUInt16BE(0);
        this.state = STATE_GET_MASK;
        this.getMask();
    }

    socket.cs.getMask = function(){
        if(this.bufferLength < 4) return
        this.mask = this.bufferRead(4);
        this.state = STATE_GET_DATA;
        this.getData();
    }
    
    socket.cs.getData = function(){
        if(this.bufferLength >= this.payloadLength + this.payloadStart){
            var unMaskedData = '';
            var unMaskedBuffer = this.bufferRead(this.payloadLength);
            for(var i = 0; i < unMaskedBuffer.length; i++){
                unMaskedData += String.fromCharCode(unMaskedBuffer[i] ^ this.mask[i % 4]);
            }
            this.messagesRead += 1;
            echoTextMessage(this.socket, unMaskedData);

            this.state = STATE_START;
            this.start();
        }
    }
    socket.cs.bufferRead = function(cnt){
        this.socket.pause();
        var read = Buffer.allocUnsafe(cnt);
        for(var i = 0; i < cnt; i++){
            read[i] = this.buffer[0];
            this.buffer.shift();
            this.bufferLength -= 1;
        }
        this.buffer.copy(this.buffer, 0, i, this.buffer.length);
        this.socket.resume();
        return read;
    }
    //Start Keeping an Eye out for Data
    socket.on('data', (newData) => {
        socket.cs.buffer.fill(newData, socket.cs.bufferLength);
        socket.cs.bufferLength += newData.length;
        if(socket.cs.bufferLength > 40000){
            console.log('oh fuck', socket.cs.bufferLength);  
        }
        switch(socket.cs.state){
            case STATE_START:
                socket.cs.start();
                break;
            case STATE_GET_LENGTH:
                socket.cs.getLength();
                break;
            case STATE_GET_MASK:
                socket.cs.getMask();
                break;
            case STATE_GET_DATA:
                socket.cs.getData();
                break;
        }
    });
});


function echoTextMessage(socket, str) { 
    if(str.length < 125) {
        var dataOffset = 2;
        var response = Buffer.allocUnsafe(dataOffset+str.length);
        response.writeUInt8(129, 0);
        response.writeUInt8(str.length, 1);
    } else {
        var dataOffset = 4;
        var response = Buffer.allocUnsafe(dataOffset+str.length);
        response.writeUInt8(129, 0);
        response.writeUInt8(126, 1);
        response.writeUInt16BE(str.length, 2);
    } 
    response.write(str, dataOffset);
    socket.write(response);
}