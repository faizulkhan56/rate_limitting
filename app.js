const express = require("express");
const redis = require("redis");
const app = express();

// Create a Redis client
const redisClient = redis.createClient({
  host: "localhost", // Update with your Redis server host
  port: 6379, // Update with your Redis server port
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");

    // Start the server after Redis client is connected
    const port = 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.log("Failed to connect to Redis", err);
  }
})();

// Your rate-limiting function
async function checkRateLimit(ip) {
  const windowMs = 10000; // 10 second window
  const maxRequests = 2; // Maximum requests per window
  const currentTime = Date.now();

  try {
    // Fetch the rate limit information from Redis
    const data = await redisClient.hGetAll(ip);
    let count = parseInt(data.count) || 0;
    let timestamp = parseInt(data.timestamp) || currentTime;

    if (currentTime - timestamp > windowMs) {
      // If window expired, reset count and timestamp
      await redisClient.hSet(ip, { count: 1, timestamp: currentTime });
      return true;
    } else {
      // Increment count if within the window
      count++;
      if (count <= maxRequests) {
        await redisClient.hSet(ip, { count, timestamp });
        return true;
      } else {
        return false;
      }
    }
  } catch (err) {
    console.error("Error accessing Redis:", err);
    return false; // Fail-safe: deny request if Redis access fails
  }
}

app.use(rateLimitMiddleware);

async function rateLimitMiddleware(req, res, next) {
  const key = `${req.query.user_name}_${req.query.user_id}_${req.ip}`;
  console.log(key);

  try {
    const result = await checkRateLimit(key);
    console.log(result);

    if (result) {
      console.log("Request allowed");
      next(); // Proceed to the next middleware or route handler
    } else {
      console.log("Rate limit exceeded, please try again later");
      res.status(429).send("Rate limit exceeded, please try again later");
    }
  } catch (error) {
    console.error("Error checking rate limit:", error);
    res.status(500).send("Internal Server Error");
  }
}

// Your routes go here
app.get("/ok", (req, res, next) => {
  res.send("ok");
});

// Close the Redis client when the server is closed
process.on("SIGINT", () => {
  redisClient.quit(() => {
    console.log("Redis client closed");
    process.exit();
  });
});

console.log("new hits ios new");