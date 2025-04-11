const { Pool } = require('pg');
const SpringBootPlugin = require('../../spring-plugins/spring-plugin-adapter');

class DBRegistry {
  constructor(dsn) {
    this.pool = new Pool({ connectionString: dsn });
  }

  async listPlugins() {
    const client = await this.pool.connect();
    try {
      const res = await client.query(`
        SELECT name, type, version, config 
        FROM plugins 
        WHERE active = true
      `);
      
      return res.rows.map(row => this.createPluginAdapter(row));
    } finally {
      client.release();
    }
  }

  createPluginAdapter(row) {
    switch (row.type) {
      case 'authentication':
        return new SpringBootPlugin({
          name: row.name,
          version: row.version,
          type: row.type,
          baseUrl: row.config.baseUrl,
          endpoints: {
            process: '/authenticate'
          }
        });
      // Add other plugin types...
      default:
        throw new Error(`Unsupported plugin type: ${row.type}`);
    }
  }
}

module.exports = DBRegistry;