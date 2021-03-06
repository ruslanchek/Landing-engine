var express = require('express'),
	config = require('./config.json'),
	sites = require('./sites.json'),
	SitesController = require('./sites-controller'),
	app = express(),
	port = process.env.PORT || config.port,
	isDev = process.env.DEV == 1 || false;

var sitesController = new SitesController(app, sites, express, isDev);
sitesController.run();

app.set('view engine', 'jade');
app.use(function(req, res, next) {
	res
		.status(404)
		.send('404');
});

var server = app.listen(port, function() {
	var host = server.address().address,
		port = server.address().port,
		family = server.address().family;

	console.log('App listening at http://%s:%s (%s)', host, port, family);
});
