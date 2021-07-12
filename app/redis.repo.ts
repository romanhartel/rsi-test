import Redis from "ioredis";

const host = "localhost";
const port = 6379;
const db = 0;

export default class RedisRepo {
    private redis: Redis.Redis;
    constructor() {
        this.redis = new Redis({ port, host, db });
        this.redis.on("ready", () => {
            this.redis.config("SET", "notify-keyspace-events", "Ex");
        });
    }

    async get(key: string): Promise<string | null> {
        return await this.redis.get(key);
    }

    async setReminder(key: string, value: string, expire: number): Promise<[Error | null, any][]> {
        return await this.redis
            .multi()
            .set(key, value)
            .set(`reminder:${key}`, 1)
            .expire(`reminder:${key}`, expire)
            .exec();
    }
}