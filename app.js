const express = require("express");
//const redis = require("redis");
const app = express();
const ipRateLimits = {};
//const redisClient = redis.createClient({
  //host: "host.docker.internal", // Update with your Redis server host
  //port: 6379, // Update with your Redis server port
//});

//(async () => {
  //await redisClient.connect();
//})();
//redisClient.on("error", (err) => console.log("Redis Client Error", err));

// Your rate-limiting function
//async function checkRateLimit(ip) {
  function checkRateLimit(ip) {
    const windowMs = 10000; // 1 second window
    const maxRequests = 2; // Maximum requests per window
  
    // Initialize ipRateLimits if it's undefined
    ipRateLimits[ip] = ipRateLimits[ip] || { count: 0, timestamp: Date.now() };
  
    const { count, timestamp } = ipRateLimits[ip];
  
    if (Date.now() - timestamp > windowMs) {
      // If window expired, reset count and timestamp
      ipRateLimits[ip] = { count: 1, timestamp: Date.now() };
      return true;
    } else {
      // Increment count if within the window
      ipRateLimits[ip].count++;
      if (count <= maxRequests) {
        return true;
      } else {
        return false;
      }
    }
  }
  
  app.use(rateLimitMiddleware);
  
  function rateLimitMiddleware(req, res, next) {
    const clientIP = req.ip; // Assuming Express's req.ip to get the client's IP
    const result = checkRateLimit(clientIP);
    console.log(result);
    try {
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
  
  // Start the server
  const port = 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  
  // Close the Redis client when the server is closed
  process.on("SIGINT", () => {
    console.log("Server is shutting down");
    process.exit();
  });
  
  console.log("new hits ios new ");