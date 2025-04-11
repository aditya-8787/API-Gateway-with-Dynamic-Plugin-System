const DBRegistry = require('./registry/db-registry');
const ConsulRegistry = require('./registry/consul-registry');
const GitHubRegistry = require('./registry/github-registry');

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.registries = [
      new DBRegistry(process.env.DB_REGISTRY_DSN),
      new ConsulRegistry(process.env.CONSUL_ADDR),
      new GitHubRegistry(
        process.env.GITHUB_TOKEN,
        process.env.GITHUB_OWNER,
        process.env.GITHUB_REPO,
        'plugins'
      )
    ];
  }

  async loadFromRegistries() {
    const errors = [];
    
    for (const registry of this.registries) {
      try {
        const plugins = await registry.listPlugins();
        for (const plugin of plugins) {
          try {
            await this.loadPlugin(plugin);
          } catch (err) {
            errors.push(`Failed to load ${plugin.name}: ${err.message}`);
          }
        }
      } catch (err) {
        errors.push(`Registry ${registry.constructor.name} failed: ${err.message}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('Plugin loading completed with errors:', errors);
    }
  }

  async loadPlugin(plugin) {
    try {
      await plugin.init();
      this.plugins.set(plugin.name, plugin);
      console.log(`Loaded plugin: ${plugin.name}@${plugin.version}`);
    } catch (err) {
      throw new Error(`Initialization failed: ${err.message}`);
    }
  }

  getPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);
    return plugin;
  }

  async unloadAll() {
    const unloads = Array.from(this.plugins.values()).map(async plugin => {
      try {
        await plugin.close();
        this.plugins.delete(plugin.name);
      } catch (err) {
        console.error(`Failed to unload ${plugin.name}:`, err);
      }
    });
    
    await Promise.all(unloads);
  }
}

module.exports = PluginManager;