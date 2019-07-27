const path = require('path');

module.exports = {
    mode: 'production',
    target: 'node',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [
            '.ts',
            '.js',
        ],
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    output: {
        filename: 'bundle.js',
        libraryTarget: 'commonjs2',
        path: path.resolve(__dirname, 'dist'),
    }
};
