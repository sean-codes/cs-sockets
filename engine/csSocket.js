//Finished/Opcode Values
const FO_UNFINISHED = 1;
const FO_CONTINUATION = 128;
const FO_FINISHED = 129;
const FO_CLOSE = 136;
const FO_END = 0;
const FO_PING = 0;

//Receiving Data States
const STATE_START = 0;
const STATE_GET_LENGTH = 1;
const STATE_GET_MASK = 2;
const STATE_GET_DATA = 3;


//Payload/Buffer
const PL_LARGE = 126;
const PL_MAX = 50000;
const EMPTY_BUFFER = Buffer.allocUnsafe(0);

//Events
const Emitter = require('events').EventEmitter;


class csSocket extends Emitter{
    constructor (server, socket) {
        super();
        this.socket = socket;
        this.server = server;
        this.buffer = EMPTY_BUFFER;
        this.state  = STATE_START;
        this.payloadLength = 0;
        this.cont = false;
        this.count = 0;
        this.continuationBuffer = EMPTY_BUFFER;
        this.finished = true;
    }

    bufferRead(cnt){
        var read = Buffer.allocUnsafe(cnt);
        for(var i = 0; i < cnt; i++){
            read.writeUInt8(this.buffer[i], i);
        }
        this.buffer = this.buffer.slice(i, this.buffer.length);
        return read;
    }

    receivedData(payLoadLength){
        switch(this.state){
            case STATE_START:
                this.start(this, payLoadLength);
                break;
            case STATE_GET_LENGTH:
                this.getLength(payLoadLength);
                break;
            case STATE_GET_MASK:
                this.getMask(payLoadLength);
                break;
            case STATE_GET_DATA:
                this.getData(payLoadLength);
                break;
        }
    }

    start(client, newDataLength){
        if(client.buffer.length < 2) return;
        newDataLength -= 2;
        client.finOpCode = client.bufferRead(1)[0];
        if(client.finOpCode !== FO_FINISHED){
            switch(client.finOpCode){
                case FO_UNFINISHED:
                    client.finished = false;
                    break;
                case FO_CONTINUATION:
                    client.finished = true;
                    break;
                default:
                    client.socket.end();
                    return;
            }
            if(client.finOpCode == FO_UNFINISHED){
                client.finished = false;
            }
            if(client.finOpCode == FO_CONTINUATION){
                client.finished = true;
            }
            client.cont = true;
        } 
        client.payloadLength = client.bufferRead(1)[0] & 0x7f; 
        if(client.payloadLength === PL_LARGE){
            client.state = STATE_GET_LENGTH;
            client.getLength(newDataLength);
        } else {
            client.state = STATE_GET_MASK;
            client.getMask(newDataLength);
        }
    }

    getLength(newDataLength){
        if(this.buffer.length < 2) return
        newDataLength -= 2;
        this.payloadLength = this.bufferRead(2).readUInt16BE(0);

        this.state = STATE_GET_MASK;
        this.getMask(newDataLength);
    }

    getMask(newDataLength){
        if(this.buffer.length < 4) return
        newDataLength -= 4;
        this.mask = this.bufferRead(4);
        this.state = STATE_GET_DATA;
        this.getData(newDataLength);
    }
    
    getData(newDataLength){
        if(this.buffer.length >= this.payloadLength){
            //Create Buffer Header
            var payloadOffset = (this.payloadLength < PL_LARGE) ? 2 : 4;
            var response = Buffer.allocUnsafe(this.payloadLength);

            //Unmask Data
            var unMaskedData = '';
            var unMaskedBuffer = this.bufferRead(this.payloadLength);
            for(var i = 0; i < unMaskedBuffer.length; i++){
                response.writeUInt8(unMaskedBuffer[i] ^ this.mask[i % 4], i);
            }

            //Write back or save for later
            if(this.finished === true){
                var stringResponse = Buffer.concat([this.continuationBuffer, response]).toString();
                
                this.emit('message', stringResponse);

                this.count += 1;
                if(this.count % 1000 == 0){
                    console.log(this.count);
                }
                this.continuationBuffer = EMPTY_BUFFER;
            } else {                
                this.continuationBuffer = Buffer.concat([this.continuationBuffer, response]);
            }
            
            this.state = STATE_START;

            //Response Length
            newDataLength -= response.length;
            if(newDataLength !== 0){
                setTimeout(this.start, 0, this, newDataLength);
            }
        }
    }

    sendMessage(to, data){
        this.frameAndSendData(to, data);
    }

    frameAndSendData(to, data){
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
        to.socket.write(headerWithData);
    }
}

module.exports = csSocket;