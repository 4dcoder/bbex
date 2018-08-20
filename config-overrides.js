const { injectBabelPlugin } = require('react-app-rewired');
const rewireLess = require('react-app-rewire-less');

module.exports = function override(config, env) {
  if (env === 'production') {
    config.devtool = false
  }
  config = injectBabelPlugin(
    ['import', { libraryName: 'antd', libraryDirectory: 'es', style: 'css' }],
    config
  );
  config = injectBabelPlugin(['import', { libraryName: 'antd', style: true }], config);
  config = rewireLess.withLoaderOptions({
    modifyVars: {
      '@primary-color': '#d4a668',
      '@processing-color': '#d4a668',
      '@background-color-base': '#292f3d',
      '@border-radius-base': '0',
      '@border-radius-sm': '0',
    }
  })(config, env);

  return config;
};
