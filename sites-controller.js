var _ = require('lodash'),
    I18n = require('i18n-2'),
    stylus = require('stylus'),
    less = require('less'),
    nib = require('nib'),
    jeet = require('jeet'),
    rupture = require('rupture'),
    autoprefixer = require('autoprefixer-stylus'),
    fs = require('fs');

var SitesController = function(app, sites, express){
    function getRoutesForSite(siteData){
        var routes = [],
            root = '/' + siteData.root,
            defaultLocale = siteData.defaultLocale;

        routes.push({
            path: root,
            locale: defaultLocale,
            detectLocale: siteData.detectLocale
        });

        _.each(siteData.locales, function(locale){
            routes.push({
                path: root + '/' + locale,
                locale: locale,
                detectLocale: false
            });
        });

        return routes;
    }

    function getLocaleJsPath(root, locale){
        return '/' + root + '/' + locale + '/locale.js';
    }

    function getLocalesWithAttributes(siteData){
        var localesWithAttributes = [];

        _.each(siteData.locales, function(locale){
            var localeObject = {
                path: '/' + siteData.root + '/' + locale,
                name: locale
            };

            localesWithAttributes.push(localeObject);
        });

        return localesWithAttributes;
    }

    function detectLocale(raw, locales){
        var parsed = raw.substring(6, 8);

        if(_.indexOf(locales, parsed) >= 0){
            return parsed;
        }
    }

    function throwError(res, title, text, status){
        var content = '';

        content += '<h1>' + title + '</h1>';
        content += '<pre>' + text + '</pre>';

        return res.send(content, status);
    }

    function compileStylus(res, str, path, fn) {
        fs.readFile(str, 'utf8', function (err, data) {
            if (err) {
                return throwError(res, 'Stylus parse error: readFile', err, 500);
            }

            return stylus(data)
                .set('compress', true)
                .use(nib())
                .use(jeet())
                .use(rupture())
                .use(autoprefixer())
                .render(function(err, css){
                    if(err){
                        return throwError(res, 'Stylus parse error: render', err, 500);
                    }

                    fs.writeFile(path, css, function(err) {
                        if(err) {
                            return throwError(res, 'Stylus parse error: writeFile', err, 500);
                        }

                        fn();
                    });
                });
        });
    }

    function compileLess(res, str, path, fn){
        fs.readFile(str, 'utf8', function (err, data) {
            if (err) {
                return throwError(res, 'Stylus parse error: readFile', err, 500);
            }

            return less.render(data, {

            }, function(err, output) {
                if(err){
                    return throwError(res, 'Stylus parse error: render', err, 500);
                }

                fs.writeFile(path, output.css, function(err) {
                    if(err) {
                        return throwError(res, 'Stylus parse error: writeFile', err, 500);
                    }

                    fn();
                });
            });
        });
    }

    function loadSite(siteData){
        var routes = getRoutesForSite(siteData),
            dir = __dirname + '/sites/' + siteData.dir,
            siteRootPath = '/' + siteData.root,
            i18nConfig = {
                locales: siteData.locales,
                directory: dir + '/locales',
                extension: '.json'
            };

        app.use(siteRootPath, express.static(dir + '/public'));
        app.use(siteRootPath, function(req, res, next){
            switch (siteData.engines.css) {
                case 'styl' : {
                    compileStylus(res, dir + '/styles/main.styl', dir + '/public/styles/main.css', function(){
                        next();
                    });
                } break;

                case 'less' : {
                    compileLess(res, dir + '/styles/main.less', dir + '/public/styles/main.css', function(){
                        next();
                    });
                } break;
            }
        });

        _.each(routes, function(route){
            app.get(route.path, function (req, res) {
                var i18n = new I18n(i18nConfig),
                    locale = route.locale;

                if(route.detectLocale === true) {
                    var localeDetected = detectLocale(req.headers['accept-language'], siteData.locales);

                    if (localeDetected) {
                        locale = localeDetected;
                    }
                }

                i18n.setLocale(locale);

                i18n._jsSrc = getLocaleJsPath(siteData.root, locale);
                i18n._locale = locale;
                i18n._locales = getLocalesWithAttributes(siteData);

                res.render(dir + '/templates/index.jade', {
                    i18n: i18n
                });
            });
        });

        _.each(siteData.locales, function(locale){
            var path = getLocaleJsPath(siteData.root, locale);

            app.get(path, function (req, res) {
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

    function setRoutes(){
        _.each(sites, function(siteData){
            loadSite(siteData);
        });
    }

    function run(){
        setRoutes();
    }

    this.run = run;
};

module.exports = SitesController;
