//****************************************************************

/**
 * Generic class wrapped around a Redis client connection to subscribe to a channel.
 * Subscriber listens for new incoming messages on that channel.
 */

//****************************************************************

import Redis from 'ioredis';
import Logger from '../helpers/Logger';

//****************************************************************

const LOG_TAG: string = 'Redis.PubSub';

//****************************************************************

export default class RedisSubscriber
{
    private redis: Redis.Redis;

    constructor(redis: Redis.Redis)
    {
        this.redis = redis;

        this.listen();
    };

    subscribe(channel: string)
    {
        this.redis.subscribe(channel, (error: Error | null) => {

            if (error) {
                Logger.error(LOG_TAG, `Process (Pid ${process.pid}) failed to subscribe to channel ${channel}`);
            } else {
                Logger.info(LOG_TAG, `Process (Pid ${process.pid}) subscribed to channel ${channel}`);
            }
        });
    }

    OnMessage(callback: Function)
    {
        this.redis.on('message', (channel: string, message: string) => {
            callback(channel, message);
        });
    }

    private listen()
    {
        this.redis.on('error', (error: any) => {

            if (error.code === 'ECONNREFUSED') {
                Logger.error(LOG_TAG, 'Cannot access Redis! Disconnecting...');
                this.redis.disconnect();
                return;
            }
        });
    }
};
