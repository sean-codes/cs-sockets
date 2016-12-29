//Network
const csSocket = require('./csSocket');
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

//Create Server
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

//Holding Connections
csServer.clientList = [];
csServer.addClient = function(socket){
    console.log('Client Added!');
    var id = this.clientList.length;
    this.clientList.push({
        id:     id,
        room:   0,
        socket: socket
    });
    return this.clientList[id];
}

csServer.removeClient = function(socket){
    console.log('Client Removed!');
    socket.id = -1;//Dead Socket
    csServer.clientList.pop(socket.id);
}

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
    //socket.allowHalfOpen = false;
    //socket.setNoDelay(true);
    socket.cs = new csSocket(this, socket, csServer.addClient(socket)); 

    //Basic Event Handling
    socket.on('data', function(newData){
        this.cs.buffer = Buffer.concat([socket.cs.buffer, newData]);
        this.cs.receivedData(newData.length);
    }); 

    socket.on('close', function(){
        console.log('Socket Closed');
        csServer.removeClient(this);
    });

    socket.on('end', function(){
        console.log('Socket Ended');
    });

    socket.on('error', function(){
        console.log('Socket Error');
    })
});

csServer.sendMessage = function(from, to, data){
    if(typeof to == 'string'){
        for(var i = 0; i < this.clientList.length; i++){
            var client = this.clientList[i];
            switch(to){
                case 'multicast':
                    if(i !== from.id && client.room == from.room){
                        csServer.frameAndSendData(client, data);
                    }
                    break;
                case 'broadcast':
                    if(client.room == from.room){
                        csServer.frameAndSendData(client, data);
                    }
                    break;
                case 'globalcast':
                    csServer.frameAndSendData(client, data);
                    break;
            }
        }
    } else {
        csServer.frameAndSendData(to, data);
    }
    
}

csServer.frameAndSendData = function(client, data){
    //Sending Data
    
    if(data.length < PL_LARGE){
        var header = Buffer.allocUnsafe(2);
        header.writeUInt8(FO_FINISHED, 0);
        header.writeUInt8(data.length, 1);
    } else {
        var header = Buffer.allocUnsafe(4);
        header.writeUInt8(FO_FINISHED, 0);
        header.writeUInt8(PL_LARGE, 1);
        header.writeUInt16BE(data.length, 2);
    }
    var bufferData = Buffer.from(data);
    var headerWithData = Buffer.concat([header, bufferData]);
    client.socket.write(headerWithData);

}

module.exports = csServer;
