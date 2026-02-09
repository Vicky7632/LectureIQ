const { createClient }=require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-12871.crce206.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 12871
    }
});
redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});
module.exports=redisClient;