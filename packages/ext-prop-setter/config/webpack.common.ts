import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';

const { ModuleFederationPlugin } = webpack.container;

const config = (env, args) => {

	return {
		output: {
			publicPath: 'auto'
		},
		resolve: {
			// 顺序很重要，惨痛教训！！！！！！！！！！
			extensions: ['.js', '.ts', '.d.ts', '.tsx', '.json'],
			plugins: [
				new TsconfigPathsPlugin({

				})
			]
		},
		optimization: {
			// splitChunks: {
			// 	chunks: 'all',
			// 	cacheGroups: {
			// 		vendor: {
			// 			name: 'vendor',
			// 			test: 排出共享模块之外的npm包,
			// 			priority: -10,
			// 		},
			// 		common: {
			// 			name: 'common',
			// 			test: 排出共享模块之外的npm包,
			// 			minChunks: 2,
			// 			priority: -20,
			// 		},
			// 	},
			// }
		},
		module: {
			rules: [
				{
					test: /\.(tsx|ts)$/i,
					loader: 'ts-loader',
					exclude: env.prod ? /node_modules/ : undefined,
					options: {
						transpileOnly: !env.prod,
						allowTsInNodeModules: !env.prod,
						compilerOptions: {
							declaration: !env.prod
						}
					}
				},
				{
					test: /\.less$/i,
					use: [
						{
							loader: 'style-loader',
							options: {
								attributes: {
									id: 'groot-studio'
								}
							}
						},
						{
							loader: 'css-loader',
							options: {
								modules: {
									auto: /\.module\.less$/i,
									localIdentName: '[name]__[local]--[hash:base64:5]'
								}
							}
						},
						{
							loader: 'less-loader',
							options: {
								lessOptions: { javascriptEnabled: true },
							},
						}
					],
				}
			],
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.APP_ENV': JSON.stringify(env.APP_ENV),
			}),

			new CopyPlugin({
				patterns: [
					{ context: 'public/', from: '**/*.*' }
				],
			}),

			new ModuleFederationPlugin({
				name: '_groot_core_extension',
				filename: 'groot-core-extension/index.js',
				exposes: {
					Main: './src',
				},
				shared: {
					react: {
						singleton: true,
						requiredVersion: '^18.2.0'
					},
					'react/jsx-runtime': {
						singleton: true,
						requiredVersion: '^18.2.0'
					},
					'react-dom': {
						singleton: true,
						requiredVersion: '^18.2.0'
					},
					antd: {
						singleton: true,
						requiredVersion: '^5.1.7',
					},
					'@ant-design/icons': {
						singleton: true,
						requiredVersion: '^5.0.1'
					},
					axios: {
						singleton: true,
						requiredVersion: '^1.3.0'
					},
					dayjs: {
						singleton: true,
						requiredVersion: '^1.11.7'
					},
					'react-router-dom': {
						singleton: true,
						requiredVersion: '^6.8.0'
					},
					'@grootio/common': {
						singleton: true,
						requiredVersion: '^0.0.1'
					}
				},
			})
		]
	} as webpack.Configuration;
}

export default config;