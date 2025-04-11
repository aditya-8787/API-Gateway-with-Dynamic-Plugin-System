const http = require('http');
const PluginManager = require('./plugin-manager');
const Router = require('./router');

class GatewayServer {
  constructor(port = 8080) {
    this.port = port;
    this.pluginManager = new PluginManager();
    this.router = new Router(this.pluginManager);
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  async start() {
    // Load plugins from all registries
    await this.pluginManager.loadFromRegistries();
    
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`Gateway running on port ${this.port}`);
        resolve();
      });
    });
  }

  async handleRequest(req, res) {
    try {
      const response = await this.router.processRequest(req);
      res.writeHead(response.status || 200, response.headers || {});
      res.end(JSON.stringify(response.body));
    } catch (error) {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  async stop() {
    await this.pluginManager.unloadAll();
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }
}

module.exports = GatewayServer;

// Start the server if run directly
if (require.main === module) {
  const server = new GatewayServer();
  server.start().catch(console.error);
  
  process.on('SIGTERM', () => server.stop().then(() => process.exit(0)));
  process.on('SIGINT', () => server.stop().then(() => process.exit(0)));
}