var _ = require('lodash'),
    I18n = require('i18n-2');

var SitesController = function(app, sites){
    function detectUserLocale(){
        
    }

    function getRoutesForSite(siteData){
        var routes = [],
            root = '/' + siteData.root,
            defaultLocale = siteData.defaultLocale;



        routes.push({
            path: root,
            locale: defaultLocale
        });

        _.each(siteData.locales, function(locale){
            routes.push({
                path: root + '/' + locale,
                locale: locale
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

    function loadSite(siteData){
        var routes = getRoutesForSite(siteData),
            i18nConfig = {
                locales: siteData.locales,
                directory: __dirname + '/sites/' + siteData.dir + '/locales',
                extension: '.json'
            };

        _.each(routes, function(route){
            app.get(route.path, function (req, res) {
                var i18n = new I18n(i18nConfig);

                i18n.setLocale(route.locale);

                i18n._jsSrc = getLocaleJsPath(siteData.root, route.locale);
                i18n._locale = route.locale;
                i18n._locales = getLocalesWithAttributes(siteData);

                res.render(__dirname + '/sites/' + siteData.dir + '/templates/index.jade', {
                    i18n: i18n
                });
            });
        });

        _.each(siteData.locales, function(locale){
            var path = getLocaleJsPath(siteData.root, locale);

            app.get(path, function (req, res) {
                var source = '',
                    langData = require(__dirname + '/sites/' + siteData.dir + '/locales/' + locale);

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