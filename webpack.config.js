const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: './js/main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            { from: 'html', to: '' },
            { from: 'lib', to: 'lib' },
            { from: 'css', to: 'css' },
            { from: 'assets', to: 'assets' }
        ])
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [{
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }],
                exclude: /node_modules/
            },
            {
                test: /\.-worker.js$/,
                use: [{ loader: 'worker-loader' }]
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                    'postcss-loader'
                ]
            },
        ]
    },
    mode: 'production',
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000
    }
}
