/*!
 * CS-Sockets: Server for text based websocketing
 * Copyright(c) 2017 Sean Mann <sean_codes@outlook.com>
 * MIT Licensed
 */

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
        this.id = server.clientCounter.toString();
        this.buffer = EMPTY_BUFFER;
        this.state  = STATE_START;
        this.payloadLength = 0;
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
        this.finOpCode = this.bufferRead(1)[0];
        if(this.finOpCode !== FO_FINISHED){
            switch(this.finOpCode){
                case FO_UNFINISHED:
                    this.finished = false;
                    break;
                case FO_CONTINUATION:
                    this.finished = true;
                    break;
                default:
                    this.socket.end();
                    return;
            }
            if(this.finOpCode == FO_UNFINISHED){
                this.finished = false;
            }
            if(this.finOpCode == FO_CONTINUATION){
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
                
                this.server.emit('message', this, stringResponse);
                this.continuationBuffer = EMPTY_BUFFER;
            } else {                
                this.continuationBuffer = Buffer.concat([this.continuationBuffer, response]);
            }
            
            this.state = STATE_START;

            //Response Length
            newDataLength -= response.length;
            if(newDataLength !== 0){
                process.nextTick(() => { this.start(newDataLength) });
            }
        }
    }
}

module.exports = csSocket;