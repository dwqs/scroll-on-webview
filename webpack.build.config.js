const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve(__dirname, './src/index')
  },

  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].js',
    library: 'ScrollOnWebview',
    libraryTarget: 'umd'
  },

  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  },

  resolve: {
    extensions: ['.js'],
    modules: [path.join(__dirname, './node_modules')]
  }
}
