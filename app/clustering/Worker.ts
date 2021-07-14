//****************************************************************

/**
 * Another static class that does:
 * - listen and react to all Websocket clients' incoming messages so it can send all valid ones to Primary
 * - send reminder messages back to all Websocket clients
 */

//****************************************************************

import uWebSockets, { WebSocket } from 'uWebSockets.js';
import Logger from '../helpers/Logger';
import DecodeEncode from '../helpers/DecodeEncode';
import CommandMessage from '../helpers/CommandMessage';

//****************************************************************

const wsApp: uWebSockets.TemplatedApp = uWebSockets./*SSL*/App({

    // key_file_name: 'misc/key.pem',
    // cert_file_name: 'misc/cert.pem',

});

//****************************************************************

const LOG_TAG: string = 'Worker';

//****************************************************************

export default class Worker
{
    static listen()
    {
        wsApp.ws('/*', {

            // Set uWebsockets.js options

            idleTimeout: 32,
            maxBackpressure: 1024,
            maxPayloadLength: 16 * 1024,
            compression: uWebSockets.DEDICATED_COMPRESSOR_3KB,

            // Let this client listen to topic 'broadcast'

            open: (ws: WebSocket) => {

                ws.subscribe('broadcast');

                Logger.info(LOG_TAG, `New websocket connection subscribed to topic 'broadcast'`);
            },

            // Receive and handle message from client (send to Redis via primary process if valid)

            message: (ws: WebSocket, message: ArrayBuffer, isBinary: boolean) => {

                const decodedString: string = DecodeEncode.decode(message);
                const command: CommandMessage = new CommandMessage(decodedString);

                Logger.info(LOG_TAG, `Worker received a message from Websocket client => ${decodedString}`);

                if (command.isValid()) {
                    // Message back Websocket client with a positive acknowledgment (using compression if available)

                    let msg: Uint8Array = DecodeEncode.encode('{"code":200,"message":"Gotcha!"}'); // (all of my) Code is arbitrary! :)
                    ws.send(msg, true, true);

                    // Message back Primary to set a reminder on a Redis instance

                    if (process.send) {
                        process.send(decodedString);
                    }

                    Logger.info(LOG_TAG, `Reminder ${command.name} going to Primary to be set on Redis`);
                }
                else {
                    // Message back Websocket client with a negative acknowledgment

                    let msg: Uint8Array = DecodeEncode.encode(`{"code":-1,"message":"Warning: Your reminder ${command.name} is just an old souvenir.."}`);
                    ws.send(msg, true, true);

                    Logger.info(LOG_TAG, `Worker's reminder ${command.name} is just an old souvenir..`);
                }
            },

            pong: (ws: WebSocket) => {

                ws.send('ping', false, true);

                Logger.debug(LOG_TAG, 'ping');
            },

            close: (ws: WebSocket) => {

                Logger.info(LOG_TAG, `Websocket was closed`);
            },

        });

        // Start listening for websocket connections

        wsApp.listen(9009, (listenSocket: any) => {

            if (listenSocket) {
                Logger.info(LOG_TAG, 'Listening to incoming websockets on port 9009');
            }

        });

        // Broadcast message back to all connected Websocket clients when received from primary process

        process.on('message', (message: string) => {

            Logger.info(LOG_TAG, `Worker received the following message from Primary => ${message}`);

            const jsonMessage: string = `{"code":42,"message":"${message}"}`; // (all of my) Code is arbitrary as well!
            const encodedMsg: Uint8Array = DecodeEncode.encode(jsonMessage);

            wsApp.publish('broadcast', encodedMsg, true, true);
        });
    }
}
