import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';

const proxyMap = require('./proxy');

const config = (env, args) => {
  return {
    mode: "development",
    devtool: 'source-map',
    cache: {
      type: 'filesystem',
    },
    devServer: {
      historyApiFallback: true,
      proxy: proxyMap[env.APP_ENV],
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
      },
      hot: false // 热更新在模块联邦下无效
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({

      }),
    ],
  } as webpack.Configuration;
}

export default config;