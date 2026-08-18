const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Monorepo Watch Folders
config.watchFolders = [workspaceRoot];

// 2. Node Modules Paths
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

// 3. Extra Node Modules Mapping for Shared Workspace Packages
config.resolver.extraNodeModules = {
  '@bakery/core': path.resolve(workspaceRoot, 'packages/core/src')
};

module.exports = config;
