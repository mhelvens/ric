'use strict';

///////////////////////// Includes /////////////////////////

var _ = require('lodash');
var vars = require('./vars');
var db = require('./db');
var express = require('express');

var app = express();

///////////////////////// HTTP Status Codes /////////////////////////

var HTTP_OK = 200;
var HTTP_CREATED = 201;
var HTTP_NOT_FOUND = 404;

///////////////////////// General Middleware /////////////////////////

//app.use(express.logger());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

///////////////////////// API /////////////////////////

// get entities with passed ids
app.get('/resources/entities/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	db.Entity.find()
			.where('_id').in(ids)
			.populate('sub.entity', '_id')
			.exec(function (err, ents) {
				if (err) {
					console.error(err); // TODO: proper error handling
					res.status(HTTP_NOT_FOUND).send(null);
				} else {
					res.status(HTTP_OK).json(ents);
				}
			});
});

// get connections between the entities with passed ids
app.get('/resources/connections/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	db.Connection.find()
			.where('from').in(ids)
			.where('to').in(ids)
			.exec(function (err, ents) {
				if (err) {
					console.error(err); // TODO: proper error handling
					res.status(HTTP_NOT_FOUND).send(null);
				} else {
					res.status(HTTP_OK).json(ents);
				}
			});
});

// get metadata belonging to entities with passed ids
app.get('/resources/metadata/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	db.Metadata.find()
			.where('entity').in(ids)
			.exec(function (err, ents) {
				if (err) {
					console.error(err); // TODO: proper error handling
					res.status(HTTP_NOT_FOUND).send(null);
				} else {
					res.status(HTTP_OK).json(ents);
				}
			});
});

// TODO: API

///////////////////////// Special Exceptions /////////////////////////

//// The bootstrap glyphicons need special treatment:

app.get('/bootstrap/glyphicons-halflings-regular.*', function (req, res) {
	res.redirect('/lib/bootstrap-sass-official/vendor/assets/fonts/' + req.path);
});

app.get('/require.js', function (req, res) {
	res.redirect('/lib/requirejs/require.js');
});

///////////////////////// Client-side Routes /////////////////////////

// TODO: Specify 'get' directives to route each to index.html

//function serveIndex(req, res, next) {
//	req.url = '/';
//	next();
//}

///////////////////////// Client-side Static Files /////////////////////////

app.use(express.static(vars.clientDir));

///////////////////////// Listen on the port /////////////////////////

app.listen(process.argv[2] || vars.port);
