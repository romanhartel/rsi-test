import PubSub from "./redis.pubsub";
import RedisRepo from "./redis.repo";
import uWebSockets from 'uWebSockets.js';

const redisRepo = new RedisRepo();

export default function RedisExpiredEvents(wsApp: uWebSockets.TemplatedApp) {

    PubSub.subscribe("__keyevent@0__:expired");

    PubSub.on("message", async (channel: string, message: string) => {

        const [type, key] = message.split(":");
        switch (type) {
            case "reminder": {
                const value = await redisRepo.get(key);
                console.log("TYPE:", type);
                console.log("KEY:", key);
                console.log("VALUE:", value);

                /* Broadcast this message */
                const message: string = `[${type.toUpperCase()}] ${value}`;
                const isBinary: boolean = true;
                wsApp.publish('broadcast', message, isBinary);

                break;
            }
        }

    });

  }