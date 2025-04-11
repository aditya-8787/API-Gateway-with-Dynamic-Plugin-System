const { Consul } = require('consul');
const SpringBootPlugin = require('../../../spring-plugins/spring-plugin-adapter');

class ConsulRegistry {
  constructor(consulAddress = 'localhost:8500') {
    this.consul = new Consul({
      host: consulAddress.split(':')[0],
      port: consulAddress.split(':')[1] || 8500,
      promisify: true
    });
    this.baseKey = 'api-gateway/plugins/';
  }

  async listPlugins() {
    try {
      const keys = await this.consul.kv.keys(this.baseKey);
      const plugins = [];

      for (const key of keys) {
        const pluginName = key.replace(this.baseKey, '').split('/')[0];
        if (!plugins.includes(pluginName)) {
          plugins.push(pluginName);
        }
      }

      return Promise.all(plugins.map(name => this.getPlugin(name)));
    } catch (err) {
      console.error('Consul registry error:', err);
      return [];
    }
  }

  async getPlugin(name) {
    try {
      const data = await this.consul.kv.get(`${this.baseKey}${name}/config`);
      if (!data || !data.Value) {
        throw new Error(`Plugin ${name} not found in Consul`);
      }

      const config = JSON.parse(data.Value);
      return new SpringBootPlugin({
        name: config.name || name,
        version: config.version || '1.0.0',
        type: config.type || 'generic',
        baseUrl: config.baseUrl,
        endpoints: config.endpoints || {
          process: '/process'
        },
        config: config.config || {}
      });
    } catch (err) {
      console.error(`Failed to load plugin ${name} from Consul:`, err);
      throw err;
    }
  }
}

module.exports = ConsulRegistry;