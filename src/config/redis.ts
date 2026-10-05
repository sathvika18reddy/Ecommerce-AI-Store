import { createClient } from "redis";

const redis = createClient({
  url: "redis://localhost:6379",
});

redis.on("error", (err: Error) => {
  console.error("Redis Error:", err);
});

export const connectRedis = async (): Promise<void> => {
  if (!redis.isOpen) { 
    await redis.connect();
    console.log("✅ Redis connected");
  }
};

export default redis;