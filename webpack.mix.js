let mix = require("laravel-mix");

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for your application, as well as bundling up your JS files.
 |
 */

//.options({ imgLoaderOptions: { enabled: false } })

mix.setPublicPath("./dist");

mix
    .js("src/app.js", "dist/")
    .sass("resources/sass/app.scss", "dist/");

//This Solves the emitting Stuck at 95% mix.setPublicPath("./dist");

let path = require("path");

let webpack = require("webpack");

// new webpack.ProvidePlugin({ $: "jQuery", jQuery: "jQuery" }); let
// ExtractTextPlugin = require("extract-text-webpack-plugin"); External let
// nodeExternals = require("webpack-node-externals"); externals: ["ws",
// "electron"],

mix.webpackConfig((module.exports = {
    target: "node",
    watch: true,
    externals: [(function() {
        var IGNORES = ["ws", "electron"];
        return function(context, request, callback) {
            if (IGNORES.indexOf(request) >= 0) {
                return callback(null, "require('" + request + "')");
            }
            return callback();
        };
    })()],
    module: {
        loaders: [{
                test: /.jsx?$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: [
                        "es2015", "react"
                    ],
                    plugins: ["transform-class-properties"]
                }
            }, {
                test: /\.css$/,
                use: [{
                    loader: "style-loader"
                }, {
                    loader: "css-loader"
                }, {
                    loader: "resolve-url-loader"
                }]
            }, {
                test: /\.(scss|sass)$/,
                loaders: ["style-loader", "css-loader", "resolve-url-loader", "sass-loader"]
            }, {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                //loader: 'file?name=/dist/fonts/[name].[ext]'
                loader: "resolve-url-loader"
            }
            /*{
                                                                                  test: /\.(woff|woff2)$/,
                                                                                  use: {
                                                                                      loader: "file-loader",
                                                                                      options: {
                                                                                          name: "./dist/fonts/[hash].[ext]",
                                                                                          limit: 5000,
                                                                                          mimetype: "application/font-woff"
                                                                                      }
                                                                                  }
                                                                              },
                                                                              {
                                                                                  test: /\.(ttf|eot|svg)$/,
                                                                                  use: {
                                                                                      loader: "file-loader",
                                                                                      options: {
                                                                                          name: "fonts/[hash].[ext]"
                                                                                      }
                                                                                  }
                                                                              }*/
        ]
    }
}));

// Full API mix.js(src, output); mix.react(src, output); <-- Identical to
// mix.js(), but registers React Babel compilation. mix.ts(src, output); <--
// Requires tsconfig.json to exist in the same folder as webpack.mix.js
// mix.extract(vendorLibs); mix.sass(src, output); mix.standaloneSass('src',
// output); <-- Faster, but isolated from Webpack. mix.fastSass('src', output);
// <-- Alias for mix.standaloneSass(). mix.less(src, output); mix.stylus(src,
// output); mix.postCss(src, output, [require('postcss-some-plugin')()]);
// mix.browserSync('my-site.dev'); mix.combine(files, destination);
// mix.babel(files, destination); <-- Identical to mix.combine(), but also
// includes Babel compilation. mix.copy(from, to); mix.copyDirectory(fromDir,
// toDir); mix.minify(file); mix.sourceMaps(); // Enable sourcemaps
// mix.version(); // Enable versioning. mix.disableNotifications();
// mix.setPublicPath('path/to/public');
// mix.setResourceRoot('prefix/for/resource/locators'); mix.autoload({}); <--
// Will be passed to Webpack's ProvidePlugin. mix.webpackConfig({}); <--
// Override webpack.config.js, without editing the file directly.
// mix.then(function () {}) <-- Will be triggered each time Webpack finishes
// building. mix.options({   extractVueStyles: false, // Extract .vue component
// styling to file, rather than inline.   globalVueStyles: file, // Variables
// file to be imported in every component.   processCssUrls: true, //
// Process/optimize relative stylesheet url()'s. Set to false, if you don't want
// them touched.   purifyCss: false, // Remove unused CSS selectors.   uglify:
// {}, // Uglify-specific options.
// https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin   postCss:
// [] // Post-CSS options:
// https://github.com/postcss/postcss/blob/master/docs/plugins.md });