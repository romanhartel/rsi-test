import express from 'express';
import RedisExpiredEvents from './redis.expired';
import RedisRepo from './redis.repo';

const app = express();
const redisRepo = new RedisRepo();

RedisExpiredEvents();
// redisRepo.setReminder('aaa', '{"value":"aaa","expired":"false"}', 20);
redisRepo.setReminder('aaa', 'aaa', 10);
app.listen(3000, () => console.log("Successfully started server"));
