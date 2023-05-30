
import { merge } from 'webpack-merge';
import commonConfig from './config/webpack.common';
import devConfig from './config/webpack.dev';
import prodConfig from './config/webpack.prod';

const config = (env, args) => {
	let options = commonConfig(env, args);

	if (env.prod) {
		options = merge(options, prodConfig(env, args));
	} else {
		options = merge(options, devConfig(env, args));
	}

	return options;
};

export default config;