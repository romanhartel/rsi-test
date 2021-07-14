import dotenv from 'dotenv';
import Logger, { logLevel } from './helpers/Logger';
import cluster from 'cluster';
import { env } from './helpers/env';
import Redis from 'ioredis';
import RedisSubscriber from './redis/Subscriber';
import RedisRepository from './redis/Repository';
import Primary from './clustering/Primary';
import Worker from './clustering/Worker';

//****************************************************************

dotenv.config();
Logger.setDefaultLevel(logLevel.info);

//****************************************************************

const LOG_TAG: string = 'APP';

//****************************************************************

if (cluster.isMaster) // cluster.isPrimary
{
    const port: number = Number(env('REDIS_PORT'));
    const host: string = env('REDIS_HOST');
    const db: number = Number(env('REDIS_DB'));

    const redisConnSub: Redis.Redis = new Redis({ host: host, port: port, db: db });
    const redisConnRepo: Redis.Redis = new Redis({ host: host, port: port, db: db });

    const redisSubscriber: RedisSubscriber = new RedisSubscriber(redisConnSub);
    const redisRepository: RedisRepository = new RedisRepository(redisConnRepo);

    try {
        Primary.listenToEvents();
        Primary.subscribeToRedisExpired(redisSubscriber, redisRepository); // Redis expired events
        Primary.spawnWorkers(redisRepository);
    } catch (e) {
        Logger.error(LOG_TAG, `Catched the following error: ${e}`);
    }
}

//****************************************************************

else // cluster.isWorker
{
    try {
        Worker.listen();
    } catch (e) {
        Logger.error(LOG_TAG, `Catched the following error: ${e}`);
    }
}
