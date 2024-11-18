import Redis from "ioredis";

export const subscribe_channels = [
  "conversations",
  "distribution:outgoing",
  "support-conversations",
];

export async function initSubscriber(redisClient: Redis) {
  redisClient.subscribe(...subscribe_channels, (err, count) => {
    if (err) {
      console.error("Failed to subscribe:", err);
      return;
    }
    console.log(`Subscribed to ${count} channel(s).`);
  });
}
