const path = require('path');
const glob = require('glob');
const argv = require('yargs').argv;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const isDevelopment = argv.mode === 'development';
const isProduction = !isDevelopment;
const distPath = path.join(__dirname, '/public');

const config = {
    entry: {
        main: './src/index.js'
    },
    output: {
        filename: 'bundle.js',
        path: distPath
    },
    module: {
        rules: [{
            test: /\.html$/,
            use: 'html-loader'
        }, {
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader'
            }]
        }, {
            test: /\.scss$/,
            exclude: /node_modules/,
            use: [
                isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options: {
                        plugins: [
                            isProduction ? require('cssnano') : () => {
                            },
                            require('autoprefixer')({
                                browsers: ['last 2 versions']
                            })
                        ]
                    }
                },
                'sass-loader'
            ]
        }, {
            test: /images[\\\/].+\.(gif|png|jpe?g|svg)$/i,
            use: [{
                loader: 'file-loader',
                options: {
                    name: 'images/[name][hash].[ext]'
                }
            }, {
                loader: 'image-webpack-loader',
                options: {
                    mozjpeg: {
                        progressive: true,
                        quality: 70
                    }
                }
            },
            ],
        }, {
            test: /fonts[\\\/].+\.(eot|svg|ttf|woff|woff2)$/,
            use: {
                loader: 'file-loader',
                options: {
                    name: 'fonts/[name][hash].[ext]'
                }
            },
        }]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css'
        }),
        ...glob.sync('./src/*.html')
            .map(htmlFile => {
                return new HtmlWebpackPlugin({
                    filename: path.basename(htmlFile),
                    template: htmlFile
                });
            }),
        new FaviconsWebpackPlugin({
            logo: './src/images/icon.png',
        })
    ],
    optimization: isProduction ? {
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: true,
                uglifyOptions: {
                    compress: {
                        inline: false,
                        drop_console: true
                    },
                },
            }),
        ],
    } : {},
    devServer: {
        contentBase: distPath,
        port: 9001,
        compress: true,
        open: true,
        after(app, server) {
            const chokidar = require('chokidar');
            const files = ['src/**/*.html'];

            chokidar
                .watch(files, {
                    alwaysStat: true,
                    followSymlinks: false,
                    ignoreInitial: true,
                })
                .on('all', () => {
                    server.sockWrite(server.sockets, 'content-changed');
                });
        }
    }
};

module.exports = config;
