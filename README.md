# rsi-test

Microservices Technical Test for RSI

## Installation Procedure

Start with the simple ~~and perfectly safe~~ commands on your preferred terminal:
```
git clone https://github.com/romanhartel/rsi-test.git
cd rsi-test
mv .env.pleaseCommit .env
```

Then open a second terminal - reach for the same folder tree level if necessary - and setup a Redis instance using Docker by running the following commands:

```
cd stack
docker-compose up
```

Considering you have Docker and Compose installed and configured on your machine.
Otherwise you can check [here to get Docker](url=https://docs.docker.com/get-docker/) and [there to install Docker Compose](https://docs.docker.com/compose/).

Please come back to your first terminal. Now you are ready to launch the app:

```
npm install
npm start
```

And you should be all set! :)

P.S.: you could use `npm run dev` while in development mode.

## Tests
### Websocket Client
Format of messages to be sent to `ws://localhost:9009` from any websocket client - but the one lying in the `client` folder:

```json
{
    "name": "Message In A Bottle",
    "time": "1569024291"
}
```

Type of message's attributes:

`name` : `string` of (virtually) any length
`time` : `number` representing a Unix timestamp in seconds

### Redis

Here are some useful Redis commands in order to check stuff related to the current projet. These are available from any Redis command-line client.

If you have access to `apt` you should be able to connect to one by executing the commands below from a terminal:

```
sudo apt install redis-tools
redis-cli
```

Now with the said commands:

```
KEYS *
GET {key}
TTL {key}
FLUSHDB
INFO
```

|Redis Command|Action|
|-------------|------|
|`KEYS *`|Show all keys in store|
|`GET {key}`|Show the value of a particular key|
|`TTL {key}`|Show the time before key expires (in seconds)|
|`FLUSHDB`|Flush all keys from the store|
|`INFO`|All you want to know about the current Redis instance|

## Technical Stack

Used to develop this service:

| Application | Version |
|------|---------|
| Node.js | 14.16.1 |
| Redis | 6.2.4 |

## Documentation
### Diagram

![rsi-test-diagram](https://drive.google.com/uc?export=view&id=1XGaGyygdfqYDncCjc_jqaHXypnOwvMLR)

### Work Process (how I did what I did)

https://drive.google.com/file/d/1_APRyY3Dm0b-A2n6PhMKZkpu76UGC1B4/view?usp=sharing

## Improvements

- [x] Logging
- [x] Config of the app environments (dev / staging / prod) with dotenv (server ports, log file paths, etc)
- [ ] SSL
- [x] Optimization: Primary process solely subscribes to Redis expired events and sends expired notification messages back to websocket workers (minimizes the number of Redis connections)
- [ ] Explore high backpressure vs draining scenarios
- [ ] Build a retry then shutdown strategy in case of huge Redis issue (server is down)
- [ ] Global service healthcheck at startup (fork is ok, Redis is ok, websockets are ok, etc...)
- [ ] Build a real WS client for benchmarking
- [ ] Set a complete Docker stack for testing
- [ ] Complete input validation + data sanitization
- [ ] More (some actually) tests! (Jest, mocking, load testing, etc...)
