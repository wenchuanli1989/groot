import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import path from 'path';
import webpack from 'webpack';

const config = (env, args) => {
	const plugins = [];

	if (env.analyzer) {
		plugins.push(new BundleAnalyzerPlugin());
	}

	return {
		mode: 'production',
		output: {
			filename: '[name].[contenthash].bundle.js',
			path: path.resolve(__dirname, '../dist'),
			clean: true,
		},
		bail: true,
		devtool: 'hidden-source-map',
		optimization: {
			minimizer: [
				new CssMinimizerPlugin()
			],
		},
		plugins
	} as webpack.Configuration;
}

export default config;