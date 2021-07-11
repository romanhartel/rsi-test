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

    async get(key: string) {
        return this.redis.get(key);
    }

    setReminder(key: string, value: string, expire: number) {
        this.redis
            .multi()
            .set(key, value)
            .set(`reminder:${key}`, 1)
            .expire(`reminder:${key}`, expire)
            .exec();
    }
}