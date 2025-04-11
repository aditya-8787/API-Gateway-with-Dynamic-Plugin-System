const axios = require('axios');
const retry = require('async-retry');

class SpringBootPlugin {
  constructor({ name, version, type, baseUrl, endpoints = {}, config = {} }) {
    if (!baseUrl) throw new Error('baseUrl is required for SpringBootPlugin');
    
    this.name = name;
    this.version = version;
    this.type = type;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.endpoints = {
      process: '/process',
      health: '/actuator/health',
      ...endpoints
    };
    this.config = config;
    this.timeout = config.timeout || 5000;
    this.retries = config.retries || 3;
  }

  async init() {
    try {
      await retry(
        async () => {
          const response = await axios.get(`${this.baseUrl}${this.endpoints.health}`, {
            timeout: this.timeout
          });
          if (response.data.status !== 'UP') {
            throw new Error(`Plugin ${this.name} health check failed`);
          }
        },
        {
          retries: this.retries,
          minTimeout: 1000,
          onRetry: (err) => {
            console.warn(`Retrying health check for ${this.name}:`, err.message);
          }
        }
      );
    } catch (err) {
      throw new Error(`Plugin ${this.name} initialization failed: ${err.message}`);
    }
  }

  async process(input) {
    return retry(
      async () => {
        try {
          const response = await axios({
            method: 'post',
            url: `${this.baseUrl}${this.endpoints.process}`,
            headers: input.headers || {},
            data: input.body || {},
            timeout: this.timeout
          });
          return response.data;
        } catch (err) {
          if (err.response) {
            // Forward the error response from the plugin
            return err.response.data;
          }
          throw err;
        }
      },
      {
        retries: this.retries,
        minTimeout: 500,
        onRetry: (err) => {
          console.warn(`Retrying process for ${this.name}:`, err.message);
        }
      }
    );
  }

  async close() {
    // Optional: Send shutdown signal to plugin
    try {
      await axios.post(`${this.baseUrl}/actuator/shutdown`, {}, { timeout: 1000 });
    } catch (err) {
      // Shutdown endpoint might not exist, which is fine
    }
  }
}

module.exports = SpringBootPlugin;