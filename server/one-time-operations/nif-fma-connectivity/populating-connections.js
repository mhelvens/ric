'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var fs = require('fs');
var db = require('../../db');
var vars = require('../../vars');
var readLine = require('readline');
var csv = require('csv');

////////////////////////////////////////////////////////////////////////////////

var nifToFma = {};

var failedRegions = {};

////////////////////////////////////////////////////////////////////////////////

var rd = readLine.createInterface({
	input   : fs.createReadStream('fma-nifstd-uberon.txt'),
	output  : process.stdout,
	terminal: false
});

rd.on('line', function (line) {
	var match = line.match(/^FMA\:(\d+).*NIF\_GrossAnatomy\:([\w\_\d]+)\s*.*$/);
	nifToFma[match[2]] = match[1];
}).on('close', function () {
	csv()
			.from.path('nlx_154697-8.csv', { columns: true, trim: true })
			.to.array(function (data/*, count*/) {
				_(data).forEach(function (record) {

					var fromNIF = record.con_from_id;
					var toNIF = record.con_to_id;

					var fromFMA = nifToFma[fromNIF];
					var toFMA = nifToFma[toNIF];

					if (_(fromFMA).isUndefined() || _(toFMA).isUndefined()) {
						if (_(fromFMA).isUndefined()) {
							failedRegions[record.con_from] = '(' + (fromNIF || '-') + ' ↦ ' + (fromFMA || '-') + ')';
						}
						if (_(toFMA).isUndefined()) {
							failedRegions[record.con_to] = '(' + (toNIF || '-') + ' ↦ ' + (toFMA || '-') + ')';
						}
					} else { // already added; uncomment to add again
//						var conn = new db.Path({
//							from:   'fma:' + fromFMA,
//							to  :   'fma:' + toFMA,
//							path: [ 'fma:' + fromFMA, 'fma:' + toFMA ],
//							type: 'neural'
//						});
//						conn.save(function (err/*, c*/) {
//							if (err) { console.error(err); }
//						});

						console.log(record.con_from + ' (' + fromFMA + ')' + '  →  ' +
						            record.con_to   + ' (' + toFMA   + ')');

					}

				});

				console.log('==========================================');

				_(failedRegions).forEach(function (ids, name) {
					console.log(name + ' ' + ids);
				});

			});
});
