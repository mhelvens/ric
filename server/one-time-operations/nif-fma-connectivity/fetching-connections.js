'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var fs = require('fs');
var db = require('../../db');
var vars = require('../../vars');
//var readLine = require('readline');
var csv = require('csv');
var http = require('http');

////////////////////////////////////////////////////////////////////////////////

//               http://neuinfo.org/services  /v1/federation/data/nlx_154697-8.csv?count=1000&offset=0&exportType=all&q=*

// 303 redirect: http://neuinfo.org/servicesv1/v1/federation/data/nlx_154697-8.csv?count=1000&offset=0&exportType=all&q=*


function url(page, pageSize) {
	return {
		host: "neuinfo.org",
		path: "/servicesv1/v1/federation/data/nlx_154697-8.csv" +
		      "?count=" + pageSize +
		      "&offset=" + (page*pageSize) +
		      "&exportType=all" +
		      "&q=*"
	};
}

////////////////////////////////////////////////////////////////////////////////

function getData(url, fn) {

	var req = http.get(url, function (res, err) {

		if (res.statusCode === 200) {

			console.log('(statuscode 200)');

		} else {

			console.error('getData (ERR) (status code: ' + res.statusCode + ')');
			console.error(url);
			res.on('data', function (data) {
				console.error('Message: ' + data);
			});

		}
	});

	req.on('response', fn);

	req.on('socket', function (socket) {
		socket.setTimeout(5*60000); // 5 minutes
		socket.on('timeout', function () {
			req.abort();
			console.log('Timeout (trying again)');
			getData(url, fn);
		});
	});
}

////////////////////////////////////////////////////////////////////////////////

var COLUMNS = ['species', 'species_id', 'con_from', 'con_from_id', 'con_from_abb', 'con_to', 'con_to_id', 'con_to_abb'];

var resultData = [];

(function getPage(page) {
	if (page < 51) {

		console.log('(getting page '+page+')');

		getData(url(page, 1000), function (inStream) {

			csv().from.stream(inStream, { columns: true, trim: true })
					.to.array(function (data/*, count*/) {

						_(data).forEach(function (record) {

							resultData.push(_.pick(record, COLUMNS));

						});

						getPage(page + 1);

					});
		});
	} else {
		console.log('-----DONE; now writing to file-----');

		csv().from.array(resultData).to.path('./new-records.csv', {columns: COLUMNS, header: true}).on('close', function () {
			console.log('-----WRITTEN-----');
		});
	}
}(0));








