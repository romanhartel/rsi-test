import PubSub from "./pubsub";
import RedisRepo from "./redis.repo";

const redisRepo = new RedisRepo();

export default function RedisExpiredEvents() {

    PubSub.subscribe("__keyevent@0__:expired");

    PubSub.on("message", async (channel: string, message: string) => {

        const [type, key] = message.split(":");
        switch (type) {
            case "reminder": {
                const value = await redisRepo.get(key);
                console.log("TYPE:", type);
                console.log("KEY:", key);
                console.log("VALUE:", value);
                break;
            }
        }

    });

  }