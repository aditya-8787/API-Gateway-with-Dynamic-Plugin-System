const { Octokit } = require('@octokit/rest');
const SpringBootPlugin = require('../../../spring-plugins/spring-plugin-adapter');

class GitHubRegistry {
  constructor(token, owner, repo, path = 'plugins') {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.path = path.endsWith('/') ? path.slice(0, -1) : path;
  }

  async listPlugins() {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: this.path
      });

      if (!Array.isArray(data)) {
        throw new Error('Expected directory listing from GitHub');
      }

      const pluginDirs = data.filter(item => item.type === 'dir');
      return Promise.all(pluginDirs.map(dir => this.getPlugin(dir.name)));
    } catch (err) {
      console.error('GitHub registry error:', err);
      return [];
    }
  }

  async getPlugin(name) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: `${this.path}/${name}/plugin.json`
      });

      if (!data.content) {
        throw new Error(`Plugin ${name} configuration not found`);
      }

      const config = JSON.parse(Buffer.from(data.content, 'base64').toString());
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
      console.error(`Failed to load plugin ${name} from GitHub:`, err);
      throw err;
    }
  }

  async getPluginVersion(name, version = 'latest') {
    try {
      // For version-specific loading (GitHub tags/branches)
      const ref = version === 'latest' ? 'heads/main' : `tags/v${version}`;
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: `${this.path}/${name}/plugin.json`,
        ref
      });

      const config = JSON.parse(Buffer.from(data.content, 'base64').toString());
      return new SpringBootPlugin({
        ...config,
        version: version
      });
    } catch (err) {
      console.error(`Failed to load version ${version} of plugin ${name}:`, err);
      throw err;
    }
  }
}

module.exports = GitHubRegistry;