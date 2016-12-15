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
    console.log(`Server is online on http://${hostname}:${port}`);
});

server.on('upgrade', (request, socket, head) => {
    var secWebSocketKey = request.headers['sec-websocket-key'] + webSocketMagicString;
    var hashedKey = crypto.createHash('SHA1').update(secWebSocketKey).digest('base64');
    
    //Send Back to requester
    socket.write( 
          'HTTP/1.1 101 Switching Protocols\r\n'
        + 'Upgrade: WebSocket\r\n'
        + 'Connection : Upgrade\r\n'
        + 'Sec-WebSocket-Accept:'+hashedKey+'\r\n' + '\r\n'
    );


    //Start Keeping an Eye out for Data
    socket.on('data', (data) => {
        console.clear();
        console.log('Receiving Message:', data);
        var isFinished = data[0] & 127;
        var optionCode = data[0] & 15;
        var isMasked = data[1] >> 7;
        var dataLength = data[1] & 127;
        console.log('Is Finished: ' + isFinished);
        console.log('Is Masked: ' + isMasked);
        console.log('Option Code: ' + optionCode);
        console.log('Data Length: ' + dataLength);
        if(optionCode === 1 && isFinished === 1 && isMasked === 1 && dataLength < 127){
            var maskingKey = data.slice(2, 6);
            var maskedData = data.slice(6, 6+dataLength);
            var unMaskedData = '';
            for(var i = 0; i < dataLength; i++){
                unMaskedData += String.fromCharCode(maskedData[i] ^ maskingKey[i % 4]);
            }
            console.log('unMaskedData: ' + unMaskedData);
            echoTextMessage(socket, unMaskedData);
        } else {
            //Close Connection
            socket.end(new Buffer(136, 1));
        }
    });
});

function echoTextMessage(socket, str){
    var response = [129, str.length];
    for(var i = 0; i < str.length; i ++){
        response.push(str.charCodeAt(i));
    }
    console.log(response);
    socket.write(new Buffer(response));//
}


