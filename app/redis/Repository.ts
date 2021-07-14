//****************************************************************

/**
 * The Redis repository class gets to:
 * - handle Redis connection
 * - set Redis config so as to generate an event every time a key expires
 * - read values from keys in store
 * - write {key, value} tuples to store and set an expiration time on those
 *
 * @see https://redis.io/topics/notifications
 */

//****************************************************************

import Redis from 'ioredis';
import Logger from '../helpers/Logger';

//****************************************************************

const LOG_TAG: string = 'Redis.Repo';

//****************************************************************

export default class RedisRepository
{
    redis: Redis.Redis;

    constructor(redis: Redis.Redis)
    {
        this.redis = redis;

        this.listen();
    }

    async get(key: string): Promise<string | null>
    {
        return this.redis.get(key);
    }

    async setReminder(key: string, value: string, expire: number): Promise<[Error | null, any][]>
    {
        return this.redis
            .multi()
            .set(key, value)
            .set(`reminder:${key}`, 1)
            .expire(`reminder:${key}`, expire)
            .exec();
    }

    private listen()
    {
        this.redis.on('ready', () => {
            this.redis.config('SET', 'notify-keyspace-events', 'Ex'); // Setup to get notified once key has expired
        });

        this.redis.on('error', (error: any) => {

            if (error.code === 'ECONNREFUSED') {

                Logger.error(LOG_TAG, 'Cannot access Redis! Disconnecting...');
                this.redis.disconnect();
                return;
            }
        });
    }
}
