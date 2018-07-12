const redis = require("redis");
const client = redis.createClient({
    host: "localhost",
    port: 6379
});

client.on("error", function(err) {
    console.log(err);
});

const leo = {
    name: "leonardo"
};

client.setex("leonardo", 20, JSON.stringify(leo), function(err, data) {
    client.get("leonardo", function(err, data) {
        if (data) {

        }
    });
});

const {promisify} = require("util");

export.get = promisify(client.get).bind(client);
