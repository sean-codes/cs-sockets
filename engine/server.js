//Require Build In
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

//My Consts
const hostname = '127.0.0.1';
const port = 3000;
const webSocketMagicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

//Create Server
const server = http.createServer((requestIncoming, responseOutGoing) => {
    responseOutGoing.statusCode = 200;
    responseOutGoing.setHeader('Contenet-Type', 'text/html');

    fs.readFile('index.html', function(error, content){ 
        responseOutGoing.end(content);
    });

    
});

server.listen(port, hostname, () => {
    //console.clear();
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


    //Start Keeping an Eye out for Data
    socket.on('data', (data) => {
        console.log('Receiving Message:', data);
        var isFinished = data[0] >> 7;
        var optionCode = data[0] & 15;
        var isMasked = data[1] >> 7;
        var dataLength = data[1] & 127;
        var dataStart = 6;
        if(dataLength > 125){
            if(dataLength == 126){
                dataLength = data.readUInt16BE(2);
                dataStart = 8;
            } else {
                dataLength = data.readUIntBE(2, 6);
                dataStart = 12;
            }
        }
        console.log('Is Finished: ' + isFinished);
        console.log('Is Masked: ' + isMasked);
        console.log('Option Code: ' + optionCode);
        console.log('Data Length: ' + dataLength);
        console.log('Data Start: ' + dataStart);
        if(data[0] === 129 && dataLength < 65535 && optionCode === 1 && isFinished === 1 && isMasked === 1){
            var maskingKey = data.slice(dataStart-4, dataStart);
            var maskedData = data.slice(dataStart, dataStart+dataLength);
            var unMaskedData = '';
            for(var i = 0; i < dataLength; i++){
                unMaskedData += String.fromCharCode(maskedData[i] ^ maskingKey[i % 4]);
            }
            echoTextMessage(socket, unMaskedData);
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

