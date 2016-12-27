//Finished/Opcode Values
const FO_UNFINISHED = 1;
const FO_CONTINUATION = 128;
const FO_FINISHED = 129;
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

class csSocket {
    constructor (server, socket) {
        this.socket = socket;
        this.server = server;
        this.buffer = EMPTY_BUFFER;
        this.state  = STATE_START;
        this.payloadLength = 0;
        this.payloadStart = 0;
        this.cont = false;
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
                this.start(payLoadLength);
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

    start(newDataLength){
        if(this.buffer.length < 2) return;
        newDataLength -= 2;
        this.maskOpBlah = this.bufferRead(1)[0];
        if(this.maskOpBlah !== FO_FINISHED){
            if(this.maskOpBlah == FO_UNFINISHED){
                this.finished = false;
            }
            if(this.maskOpBlah == FO_CONTINUATION){
                this.finished = true;
            }
            this.cont = true;
        } 
        this.payloadLength = this.bufferRead(1)[0] & 0x7f; 
        if(this.payloadLength === PL_LARGE){
            this.state = STATE_GET_LENGTH;
            this.getLength(newDataLength);
        } else {
            this.state = STATE_GET_MASK;
            this.getMask(newDataLength);
        }
    }

    getLength(newDataLength){
        if(this.buffer.length < 2) return
        newDataLength -= 2;
        this.payloadLength = this.bufferRead(2).readUInt16BE(0);
        if(this.payloadLength < PL_MAX){
            this.state = STATE_GET_MASK;
            this.getMask(newDataLength);
        } else {
            this.socket.destroy();
        }
    }

    getMask(newDataLength){
        if(this.buffer.length < 4) return
        newDataLength -= 4;
        this.mask = this.bufferRead(4);
        this.state = STATE_GET_DATA;
        this.getData(newDataLength);
    }
    
    getData(newDataLength){
        if(this.buffer.length >= this.payloadLength + this.payloadStart){
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
                this.server.emit('message', this, Buffer.concat([this.continuationBuffer, response]).toString());
                this.continuationBuffer = EMPTY_BUFFER;
            } else {                
                this.continuationBuffer = Buffer.concat([this.continuationBuffer, response]);
            }
            
            this.state = STATE_START;

            //Response Length
            newDataLength -= response.length;
            if(newDataLength > 0){
                this.start(newDataLength);
            }
        }
    }

    //Sending Data
    message(to, data){
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
        var headerWithData = Buffer.concat([header, Buffer.from(data)]);
        to.socket.write(headerWithData);
    }
}

module.exports = csSocket;
