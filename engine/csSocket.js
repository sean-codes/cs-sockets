//Receiving Data States
const STATE_START = 0;
const STATE_GET_LENGTH = 1;
const STATE_GET_MASK = 2;
const STATE_GET_DATA = 3;

//Finished/Opcode Values
const FO_UNFINISHED = 1;
const FO_CONTINUATION = 128;
const FO_FINISHED = 129;
const FO_END = 0;
const FO_PING = 0;

//Payload
const PL_LARGE = 126;

class csSocket {
    constructor (socket) {
        this.socket = socket;
        this.buffer = Buffer.allocUnsafe(0);
        this.state  = STATE_START;
        this.payloadLength = 0;
        this.payloadStart = 0;
        this.cont = false;
        this.continuationBuffer = Buffer.allocUnsafe(0);
        this.finished = true;
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
        this.payloadLength = this.bufferRead(2).readUInt16BE(0);
        this.state = STATE_GET_MASK;
        this.getMask(newDataLength);
    }

    getMask(newDataLength){
        if(this.buffer.length < 4) return
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
                var responseLength = this.frameDataAndSend(response);
                //call me onmessage function
            } else {                
                this.continuationBuffer = Buffer.concat([this.continuationBuffer, response]);
                var responseLength =  response.length
            }
            
            this.state = STATE_START;
            newDataLength -= responseLength;
            if(newDataLength > 0){
                this.start(newDataLength);
            }
        }
    }

    frameDataAndSend(data){
        if(data.length + this.continuationBuffer.length < PL_LARGE){
            var header = Buffer.allocUnsafe(2);
            header.writeUInt8(FO_FINISHED, 0);
            header.writeUInt8(data.length+this.continuationBuffer.length, 1);
        } else {
            var header = Buffer.allocUnsafe(4);
            header.writeUInt8(FO_FINISHED, 0);
            header.writeUInt8(PL_LARGE, 1);
            header.writeUInt16BE(data.length+this.continuationBuffer.length, 2);
        }
        var test = Buffer.concat([header, this.continuationBuffer, data]);
        this.socket.write(test);
        this.continuationBuffer = Buffer.allocUnsafe(0);
        return test.length;
    }

    bufferRead(cnt){
        var read = Buffer.allocUnsafe(cnt);
        for(var i = 0; i < cnt; i++){
            read.writeUInt8(this.buffer[i], i);
        }
        this.buffer = this.buffer.slice(i, this.buffer.length);
        return read;
    }

    sendMessage(str) { 
        if(str.length < PL_LARGE) {
            var dataOffset = 2;
            var response = Buffer.allocUnsafe(dataOffset+str.length);
            response.writeUInt8(FO_FINISHED, 0);
            response.writeUInt8(str.length, 1);
        } else {
            var dataOffset = 4;
            var response = Buffer.allocUnsafe(dataOffset+str.length);
            response.writeUInt8(FO_FINISHED, 0);
            response.writeUInt8(PL_LARGE, 1);
            response.writeUInt16BE(str.length, 2);
        } 
        response.write(str, dataOffset);
        this.write(response);
    }
}

module.exports = csSocket;
