import Redis from "ioredis";

const host = "localhost";
const port = 6379;
const db = 0;
const subscriber = new Redis({ host, port, db });
const publisher = new Redis({ host, port, db });

export default new class PubSub {
    constructor() {};

    publish(channel: string, message: string) {
        publisher.publish(channel, message);
    }

    subscribe(channel: string) {
        subscriber.subscribe(channel);
    }

    on(event: any, callback: any) {
        subscriber.on(event, (channel, message) => {
            callback(channel, message);
        });
    }
}();