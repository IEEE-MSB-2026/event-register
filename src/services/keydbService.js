const redis = require('redis');

let redisClient;

const openConnection = async () => {
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    password: process.env.REDIS_PASSWORD,
  });

  try {
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
    throw new Error('Redis connection failed');
  }
};

const checkHealth = async () => {
  try {
    const ping = await redisClient.ping();
    return { healthy: true, ping };
  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    return { healthy: false, error: error.message };
  }
};

const setKey = async (key, value, expirationInSeconds) => {
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: expirationInSeconds,
    });
  } catch (error) {
    console.error(`❌ Failed to set key ${key}:`, error);
    throw new Error('Failed to set key');
  }
};

const getKey = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`❌ Failed to get key ${key}:`, error);
    throw new Error('Failed to get key');
  }
};

const deleteKey = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`❌ Failed to delete key ${key}:`, error);
    throw new Error('Failed to delete key');
  }
};

const keyExists = async (key) => {
  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`❌ Failed to check key existence: ${key}`, error);
    throw new Error('Failed to check key existence');
  }
};

const flushAllKeys = async () => {
  try {
    await redisClient.flushAll();
  } catch (error) {
    console.error('❌ Failed to flush keys:', error);
    throw new Error('Failed to flush keys');
  }
};

// Publish a message to a Redis Stream (XADD)
const publishToStream = async (stream, payloadObject) => {
  try {
    if (!redisClient) throw new Error('Redis not connected');
    const payload = JSON.stringify(payloadObject);
    // Use raw command for compatibility
    await redisClient.sendCommand(['XADD', stream, '*', 'payload', payload]);
  } catch (error) {
    console.error(`❌ Failed to publish to stream ${stream}:`, error);
    throw new Error('Failed to publish to stream');
  }
};

const closeConnection = async () => {
  try {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  } catch (error) {
    console.error('❌ Failed to close Redis connection:', error);
  }
};

module.exports = {
  openConnection,
  closeConnection,
  setKey,
  getKey,
  deleteKey,
  keyExists,
  flushAllKeys,
  checkHealth,
  publishToStream,
};
