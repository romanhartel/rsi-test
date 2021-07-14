//****************************************************************

/**
 * Static class that does:
 * - spawn Workers to accept incoming Websocket connections and to send back reminder commands to Primary
 * - subscribe Primary to Redis' expired event mechanism so it can send back reminder messages to Workers
 * - listen to regular cluster events (exit, online) and handle repop of dead/crashed Workers
 */

//****************************************************************

import os from 'os';
import Logger from '../helpers/Logger';
import cluster, { Worker } from 'cluster';
import CommandMessage from '../helpers/CommandMessage';
import RedisRepository from '../redis/Repository';
import RedisSubscriber from '../redis/Subscriber';

//****************************************************************

const LOG_TAG: string = 'Cluster';

//****************************************************************

let workers: any = {};

//****************************************************************

export default class Primary
{
    /**
     * Finds out the number of CPU cores and fork as many workers as possible based on that limit
     */

    static spawnWorkers(redisRepository: RedisRepository)
    {
        const numCores: number = os.cpus().length;

        Logger.info(LOG_TAG, `Primary process was spawned successfully and found ${numCores} cores are available.`);

        for (let i = 0; i < numCores; i++) {

            const worker: Worker = cluster.fork();

            if (worker.process.pid) {

                // Updating the workers' dictionary with this new pid

                workers[worker.process.pid] = worker;
            }

            // Listen to any message from any Websocket worker process (in order to set a Redis reminder)

            worker.on('message', async (msg: string) => {

                Logger.info(LOG_TAG, `Primary received a message from worker ${worker.process.pid} => ${msg}`);

                const command: CommandMessage = new CommandMessage(msg);

                if (command.isValid()) {
                    // Set the websocket client reminder on Redis

                    await redisRepository.setReminder(command.uuid, command.name, command.expiration);

                    Logger.info(LOG_TAG, `Reminder ${command.name} has been set on Redis`);

                } else {
                    // Do nothing, log something

                    Logger.info(LOG_TAG, `Worker ${worker.process.pid}'s reminder ${command.name} is just an old souvenir..`);
                }
            });
        }
    }

    /**
     * Subscribes to the key expired event loop on Redis.
     * Once an expired event message is triggered it gets parsed and sent back to websocket workers
     * to finally get broadcasted to all websocket clients.
     *
     * @param redisSubscriber instance of RedisSubscriber class
     * @param redisRepository instance of RedisRepository class
     */

    static subscribeToRedisExpired(redisSubscriber: RedisSubscriber, redisRepository: RedisRepository)
    {
        redisSubscriber.subscribe('__keyevent@0__:expired');

        redisSubscriber.OnMessage(async (channel: string, message: string) => {

            const [type, key] = message.split(':');

            switch (type)
            {
                case 'reminder':
                {
                    const value: string | null = await redisRepository.get(key);
                    const message: string = `[${type.toUpperCase()}] ${value}`;

                    Logger.debug(LOG_TAG, `Received event on channel ${channel} => TYPE: ${type} KEY: ${key} VALUE: ${value}`);

                    // Send back all expired messages to workers so they can do their broadcaster job towards clients

                    Object.values(workers).forEach((worker: any) => {
                        (worker as Worker).send(message);
                    });

                    break;
                }
            }
        });
    }

    /**
     * Associated cluster event listeners that allow to:
     * - respawn a dead process
     * - let others know that new processes have been spawned and are currently running
     */

    static listenToEvents()
    {
        cluster.on('exit', (deadWorker: Worker, code: number, signal: string) => {

            if (signal) {
                Logger.warn(LOG_TAG, `Worker #${deadWorker.id} was killed by signal '${signal}'.`);
            } else if (code) {
                Logger.warn(LOG_TAG, `Worker #${deadWorker.id} crashed with error code '${code}'.`);
            }

            Logger.info(LOG_TAG, 'Spawning another worker now...');

            // Replacing the dead worker with a shiny new (an alive) one

            if (deadWorker.process.pid) {

                const dead_worker_pid: number = deadWorker.process.pid;

                if (dead_worker_pid && workers[dead_worker_pid]) {

                    delete workers[dead_worker_pid]; // delete dead reference
                    const worker: Worker = cluster.fork();

                    if (worker.process.pid) {
                        // Updating the workers' dictionary with this new pid
                        workers[worker.process.pid] = worker;
                    }
                }
            }
        });

        cluster.on('online', (worker: Worker) => {

            Logger.info(LOG_TAG, `Worker #${worker.id} was spawned successfully`);

        });
    }
}
