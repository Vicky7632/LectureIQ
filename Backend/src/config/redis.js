const { createClient }=require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-12967.c83.us-east-1-2.ec2.cloud.redislabs.com',
        port: 12967
    }
});
redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});
module.exports=redisClient;