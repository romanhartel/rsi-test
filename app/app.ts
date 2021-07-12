import express, { Express } from 'express';
import RedisExpiredEvents from './redis.expired';
import RedisRepo from './redis.repo';
import uWebSockets, { WebSocket } from 'uWebSockets.js';
import CommandMessage from './message';
import * as bodyparser from 'body-parser';

//****************************************************************

const redisRepo = new RedisRepo();

const wsApp: uWebSockets.TemplatedApp = uWebSockets./*SSL*/App({

    /* There are more SSL options, cut for brevity */
    // key_file_name: 'misc/key.pem',
    // cert_file_name: 'misc/cert.pem',

});

RedisExpiredEvents(wsApp);

wsApp.ws('/*', {

    /* There are many common helper features */
    idleTimeout: 32,
    maxBackpressure: 1024,
    maxPayloadLength: 16 * 1024,
    compression: uWebSockets.DEDICATED_COMPRESSOR_3KB,

    open: (ws: WebSocket) => {
        /* Let this client listen to topic "broadcast" */
        ws.subscribe('broadcast');
    },

    /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
    message: (ws: WebSocket, message: ArrayBuffer, isBinary: boolean) => {
        /* You can do app.publish('sensors/home/temperature', '22C') kind of pub/sub as well */

        const decoder: TextDecoder = new TextDecoder();
        const decodedString: string = decoder.decode(message);
        const parsedJsonObject: any = JSON.parse(decodedString);

        const command: CommandMessage = new CommandMessage(parsedJsonObject);
        console.log(`commandName = ${command.name}`);
        console.log(`commandTime = ${command.time}`);

        if (command.isValid()) {
            console.log(`expiration time = ${command.expiration}`);
            redisRepo.setReminder(command.uuid, command.name, command.expiration);
        } else {
            console.log(`Warning: Command ${command.name} is living in the past... Bye!`);
        }

        // const command: CommandMessage = new CommandMessage(jsonData.name, jsonData.time);
        // console.log(command);
        // console.log(typeof(command));

        /* Here we echo the message back, using compression if available */
        let ok = ws.send('{"code":42,"message":"Gotcha!"}', isBinary, true);
    }

});
/*
wsApp.post('/*', (res, req) => {

    console.log('test');
    console.log(req.forEach((key: string, value: string) => {
        console.log(`key ${key} value ${value}`);
    }));
    console.log(req.getParameter(2));
    console.log(req.getParameter(1));

    // It does Http as well
    res.writeStatus('200 OK').writeHeader('Content-Type', 'application/json').end('{"code":42,"message":"Gotcha!"}');

});
*/
wsApp.listen(9001, (listenSocket: any) => {

    if (listenSocket) {
      console.log('Listening to incoming websockets on port 9001');
    }

});

//****************************************************************

const app: Express = express();

app.use(bodyparser.json());
app.disable("x-powered-by");

app.post('/command', (req: express.Request, res: express.Response) => {

    const command: CommandMessage = new CommandMessage(req.body);
    console.log(`commandName = ${command.name}`);
    console.log(`commandTime = ${command.time}`);

    if (command.isValid()) {
        console.log(`expiration time = ${command.expiration}`);
        redisRepo.setReminder(command.uuid, command.name, command.expiration);
    } else {
        console.log(`Warning: Command ${command.name} is living in the past... Bye!`);
    }

    res.status(200).json('{"code":42,"message":"Gotcha!"}');
});

// This is a trap!
// app.use((err: express.ErrorRequestHandler, req: express.Request, res: express.Response, next: express.Request) => {
//     reject(new Error('Something went wrong!, err:' + err));
// }

app.listen(4242, () => console.log("Successfully started HTTP server on port 4242"));
