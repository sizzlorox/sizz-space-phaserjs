const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: 'production',
  target: 'web',
  entry: path.resolve(__dirname, 'src/game/game.js'),
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/build/',
    filename: 'js/bundle.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      'CANVAS_RENDERER': JSON.stringify(true),
      'WEBGL_RENDERER': JSON.stringify(true)
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        include: path.join(__dirname, 'src')
      },
      {
        test: [/\.vert$/, /\.frag$/],
        use: 'raw-loader'
      }
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          warnings: false,
          output: {
            comments: false,
            beautify: false
          },
          compress: true,
          keep_classnames: false,
          keep_fnames: false
        },
        sourceMap: false
      })
    ]
  }
};