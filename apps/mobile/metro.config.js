const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// 1. Find the project and workspace root paths
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 2. Let Metro watch all files within the monorepo workspace
config.watchFolders = [workspaceRoot];

// 3. Let Metro resolve modules from both app and monorepo node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

module.exports = config;
