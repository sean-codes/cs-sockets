//Network
const csSocket = require('./csSocket');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const HOSTNAME = 'localhost';
const PORT = 9999;
const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';



//Create Server
const csServer = http.createServer((requestIncoming, responseOutGoing) => {
    responseOutGoing.statusCode = 200;
    responseOutGoing.setHeader('Contenet-Type', 'text/html');

    fs.readFile('index.html', function(error, content){ 
        responseOutGoing.end(content);
    });    
});

//Listen
csServer.listen(PORT, HOSTNAME, () => {
    console.log(`Server is online on http://${HOSTNAME}:${PORT}`);
});


//Grab Data
csServer.on('upgrade', (request, socket, head) => {
    var secWebSocketKey = request.headers['sec-websocket-key'] + WS_MAGIC_STRING;
    var hashedKey = crypto.createHash('SHA1').update(secWebSocketKey).digest('base64');
    
    //Send Back to requester
    socket.write( 
          'HTTP/1.1 101 Switching Protocols\r\n'
        + 'Upgrade: websocket\r\n'
        + 'Connection: Upgrade\r\n'
        + 'Sec-WebSocket-Accept: '+hashedKey+'\r\n'
        + '\r\n'
    );

    socket.cs = new csSocket(socket); 
    
    //Start Keeping an Eye out for Data
    socket.on('data', (newData) => {
        socket.cs.buffer = Buffer.concat([socket.cs.buffer, newData]);
        socket.cs.receivedData(newData.length);
    }); 
});

