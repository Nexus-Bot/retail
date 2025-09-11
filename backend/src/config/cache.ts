import { createClient } from 'redis';

class CacheService {
  private client: any;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      // Use memory store if Redis URL not provided (development)
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.warn("⚠️  No Redis URL provided, using memory cache fallback");
        this.client = new Map(); // Simple memory fallback
        this.isConnected = true;
        return;
      }

      this.client = createClient({ url: redisUrl });
      
      this.client.on('error', (err: any) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('📦 Redis Connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Error connecting to Redis:', error);
      // Fallback to memory cache
      this.client = new Map();
      this.isConnected = true;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;

    try {
      if (this.client instanceof Map) {
        const data = this.client.get(key);
        return data || null;
      }
      return await this.client.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, expireInSeconds: number = 3600): Promise<void> {
    if (!this.isConnected) return;

    try {
      if (this.client instanceof Map) {
        this.client.set(key, value);
        // Simple memory cache expiry
        setTimeout(() => {
          this.client.delete(key);
        }, expireInSeconds * 1000);
        return;
      }
      await this.client.setEx(key, expireInSeconds, value);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      if (this.client instanceof Map) {
        this.client.delete(key);
        return;
      }
      await this.client.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && !(this.client instanceof Map)) {
      await this.client.disconnect();
    }
    this.isConnected = false;
  }
}

export const cacheService = new CacheService();