class Router {
    constructor(pluginManager) {
      this.pluginManager = pluginManager;
    }
  
    async processRequest(req) {
      // Collect request data
      const request = await this.collectRequestData(req);
      
      // Apply authentication plugins
      const authResult = await this.applyPlugins('authentication', request);
      if (authResult.authenticated !== true) {
        return { status: 401, body: { error: 'Unauthorized' } };
      }
      
      // Apply transformation plugins
      let transformed = await this.applyPlugins('transformation', request);
      
      // Apply routing plugins
      const routeResult = await this.applyPlugins('routing', transformed);
      
      return {
        status: routeResult.status || 200,
        headers: routeResult.headers || {},
        body: routeResult.body || {}
      };
    }
  
    async collectRequestData(req) {
      return new Promise((resolve) => {
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
          try {
            resolve({
              method: req.method,
              url: req.url,
              headers: req.headers,
              body: body.length ? JSON.parse(Buffer.concat(body).toString()) : {}
            });
          } catch (e) {
            resolve({
              method: req.method,
              url: req.url,
              headers: req.headers,
              body: {}
            });
          }
        });
      });
    }
  
    async applyPlugins(type, data) {
      const plugins = Array.from(this.pluginManager.plugins.values())
        .filter(p => p.type === type);
      
      let result = data;
      for (const plugin of plugins) {
        try {
          result = await plugin.process(result);
        } catch (err) {
          console.error(`Plugin ${plugin.name} failed:`, err);
          throw err;
        }
      }
      return result;
    }
  }
  
  module.exports = Router;