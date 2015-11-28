var _ = require('lodash'),
    I18n = require('i18n-2'),
    stylus = require('stylus'),
    less = require('less'),
    nib = require('nib'),
    jeet = require('jeet'),
    rupture = require('rupture'),
    autoprefixer = require('autoprefixer-stylus'),
    livereload = require('livereload'),
    minify = require('express-minify'),
    uglifyJs = require('uglify-js'),
    chokidar = require('chokidar'),
    fs = require('fs-extra');

var SitesController = function(app, sites, express, isDev) {
    var isProduction = !isDev;

    if (isDev === true) {
        var lrServer = livereload.createServer({
            exts: [
                'less',
                'sass',
                'styl',
                'jade',
                'json',
                'png',
                'svg',
                'jpg',
                'jpeg',
                'gif',
                'ttf',
                'ico',
                'woff',
                'webm',
                'mp4',
                'mov',
                'mp3',
                'wav',
                'eot'
            ]
        });
    }

    function getRoutesForSite(siteData) {
        var routes = [],
            root = '/' + siteData.root,
            defaultLocale = siteData.defaultLocale;

        routes.push({
            path: root,
            locale: defaultLocale,
            detectLocale: siteData.detectLocale
        });

        _.each(siteData.locales, function(locale) {
            routes.push({
                path: root + '/' + locale,
                locale: locale,
                detectLocale: false
            });
        });

        return routes;
    }

    function getLocaleJsPath(root, locale) {
        return '/' + root + '/' + locale + '/locale.js';
    }

    function getLocalesWithAttributes(siteData, currentLocale) {
        var localesWithAttributes = [];

        _.each(siteData.locales, function(locale) {
            var localeObject = {
                path: '/' + siteData.root + '/' + locale,
                name: locale,
                current: currentLocale == locale
            };

            localesWithAttributes.push(localeObject);
        });

        return localesWithAttributes;
    }

    function detectLocale(raw, locales) {
        var parsed = raw.substring(6, 8);

        if (_.indexOf(locales, parsed) >= 0) {
            return parsed;
        }
    }

    function throwError(res, title, text, status) {
        var content = '';

        content += '<h1>' + title + '</h1>';
        content += '<pre>' + text + '</pre>';

        return res.status(status).send(content);
    }

    function cimpileJs(res, source, destination, fn) {
        var result = uglifyJs.minify(source, {
            mangle: false,
            compress: {
                sequences: false,
                dead_code: false,
                conditionals: false,
                booleans: false,
                unused: false,
                if_return: false,
                join_vars: false,
                drop_console: false
            }
        });

        fs.writeFile(destination, result.code, function(err) {
            if (err) {
                return throwError(res, 'JS parse error: writeFile', err, 500);
            }

            fn();
        });
    }

    function compileStylus(res, source, destination, fn) {
        fs.readFile(source, 'utf8', function(err, data) {
            if (err) {
                return throwError(res, 'Stylus parse error: readFile', err, 500);
            }

            return stylus(data)
                .use(nib())
                .use(jeet())
                .use(rupture())
                .use(autoprefixer())
                .render(function(err, css) {
                    if (err) {
                        return throwError(res, 'Stylus parse error: render', err, 500);
                    }

                    fs.writeFile(destination, css, function(err) {
                        if (err) {
                            return throwError(res, 'Stylus parse error: writeFile', err, 500);
                        }

                        fn();
                    });
                });
        });
    }

    function compileLess(res, source, destination, fn) {
        fs.readFile(source, 'utf8', function(err, data) {
            if (err) {
                return throwError(res, 'Less parse error: readFile', err, 500);
            }

            var renderOptions = {

            };

            return less.render(data, renderOptions, function(err, output) {
                if (err) {
                    return throwError(res, 'Less parse error: render', err, 500);
                }

                fs.writeFile(destination, output.css, function(err) {
                    if (err) {
                        return throwError(res, 'Less parse error: writeFile', err, 500);
                    }

                    fn();
                });
            });
        });
    }

    function getMinifyCacheDir(dir) {
        if (isProduction === true) {
            return dir + '/_cache';
        } else {
            return false;
        }
    }

    function watcherProcess(dir){
        var options = {};

        fs.copy(dir + '/assets/fonts', dir + '/_public/fonts', options);
        fs.copy(dir + '/assets/img', dir + '/_public/img', options);
        fs.copy(dir + '/assets/JSON', dir + '/_public/JSON', options);
        fs.copy(dir + '/assets/video', dir + '/_public/video', options);
    }

    function loadSite(siteData) {
        var routes = getRoutesForSite(siteData),
            dir = __dirname + '/sites/' + siteData.dir,
            siteRootPath = '/' + siteData.root,
            i18nConfig = {
                locales: siteData.locales,
                directory: dir + '/locales',
                extension: '.json'
            };

        if (isDev === true) {
            lrServer.watch([
                dir + '/assets',
                dir + '/js',
                dir + '/locales',
                dir + '/styles',
                dir + '/templates'
            ]);

            var watcher = chokidar.watch(dir + '/assets', {
                ignored: /[\/\\]\./, persistent: true
            });

            watcher
                .on('add', function(path) {
                    watcherProcess(dir);
                })
                .on('addDir', function(path) {
                    watcherProcess(dir);
                })
                .on('change', function(path) {
                    watcherProcess(dir);
                })
                .on('unlink', function(path) {
                    watcherProcess(dir);
                })
                .on('unlinkDir', function(path) {
                    watcherProcess(dir);
                });
        }

        app.use(minify({
            js_match: /javascript/,
            css_match: /css/,
            sass_match: /scss/,
            less_match: /less/,
            stylus_match: /stylus/,
            cache: getMinifyCacheDir(dir),
            blacklist: [/\.min\.(css|js)$/],
            whitelist: null
        }));

        app.use(siteRootPath, express.static(dir + '/_public'));
        app.use(siteRootPath, function(req, res, next) {
            if (isDev === true) {
                cimpileJs(res, dir + '/js/app.js', dir + '/_public/js/app.js', function() {
                    switch (siteData.engines.css) {
                        case 'styl':
                            {
                                compileStylus(res, dir + '/styles/main.styl', dir + '/_public/styles/main.css', function() {
                                    next();
                                });
                            }
                            break;

                        case 'less':
                            {
                                compileLess(res, dir + '/styles/main.less', dir + '/_public/styles/main.css', function() {
                                    next();
                                });
                            }
                            break;
                    }
                })
            } else {
                next();
            }
        });

        _.each(routes, function(route) {
            app.get(route.path, function(req, res) {
                var i18n = new I18n(i18nConfig),
                    locale = route.locale;

                if (route.detectLocale === true) {
                    var localeDetected = detectLocale(req.headers['accept-language'], siteData.locales);

                    if (localeDetected) {
                        locale = localeDetected;
                    }
                }

                i18n.setLocale(locale);

                i18n._jsDictSrc = getLocaleJsPath(siteData.root, locale);
                i18n._locale = locale;
                i18n._locales = getLocalesWithAttributes(siteData, locale);

                res.render(dir + '/templates/index.jade', {
                    i18n: i18n,
                    rootDir: '/' + siteData.root
                });
            });
        });

        _.each(siteData.locales, function(locale) {
            var path = getLocaleJsPath(siteData.root, locale);

            app.get(path, function(req, res) {
                var source = '',
                    langData = require(dir + '/locales/' + locale);

                res.setHeader('content-type', 'text/javascript');

                source += 'window.i18n = ';
                source += JSON.stringify(langData);
                source += ';';

                res.end(source);
            });
        });
    }

    function setRoutes() {
        _.each(sites, function(siteData) {
            loadSite(siteData);
        });
    }

    function run() {
        setRoutes();
    }

    this.run = run;
};

module.exports = SitesController;
