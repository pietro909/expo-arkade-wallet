const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// indexeddbshim's IDBFactory.js does `import path from 'path'` for
// database-name joining.  On React Native there is no Node `path`
// module, but the shim only uses `path.join` to concatenate a base
// path prefix with the database name.  We provide a minimal shim that
// handles that single use-case.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  path: require.resolve('./lib/shims/path.js'),
};

module.exports = config;
