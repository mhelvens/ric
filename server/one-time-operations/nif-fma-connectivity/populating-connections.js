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
var Q = require('q');

////////////////////////////////////////////////////////////////////////////////

var nifToFma = {};

var nameToFma = { // provided by Bernard
	'lateral paragigantocellular nucleus': '72577',
	'visual area 1'                      : '236871',
	'visual area 2'                      : '68615',
	'intermediate reticular zone'        : '84336',
	'dorsal medullary raphe'             : '68462'
};

var failedRegions = {};

var allRegions = {};

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
			.from.path('new-records.csv', { columns: true, trim: true })
			.to.array(function (data/*, count*/) {
				_(data).forEach(function (record) {

					if (record.species === 'Birds') { return; } // Bernard asked for all non-bird records

					var fromNIF = record.con_from_id;
					var toNIF = record.con_to_id;

					var fromFMA = nifToFma[fromNIF];
					var toFMA = nifToFma[toNIF];

					if (_(fromFMA).isUndefined() && !_(nameToFma[record.con_from]).isUndefined()) {
						fromFMA = nameToFma[record.con_from];
					}
					if (_(toFMA).isUndefined() && !_(nameToFma[record.con_to]).isUndefined()) {
						toFMA = nameToFma[record.con_to];
					}

					if (_(fromFMA).isUndefined() || _(toFMA).isUndefined()) {

						if (_(fromFMA).isUndefined()) {
							failedRegions[record.con_from] = '(' + (fromNIF || '-') + ' ↦ ' + (fromFMA || '-') + ')';
						}
						if (_(toFMA).isUndefined()) {
							failedRegions[record.con_to] = '(' + (toNIF || '-') + ' ↦ ' + (toFMA || '-') + ')';
						}

					} else {

						db.Path.find({ type: 'neural', from: 'fma:'+fromFMA, to: 'fma:'+toFMA }, function (err, connections) {

							if (err) {
								console.error(err);
							} else {
								var path;
								if (connections.length === 1) {
									path = connections[0];
									console.log('already have: ' + path.from + ' -> ' + path.to);
								} else if (connections.length === 0) {
									path = new db.Path({
										from:   'fma:' + fromFMA,
										to  :   'fma:' + toFMA,
										path: [ 'fma:' + fromFMA, 'fma:' + toFMA ],
										type: 'neural',
										species: record.species
									});
									path.save(function (err, c) {
										if (err) {
											console.error(err);
										} else {
											allRegions['fma:' + fromFMA] = true;
											allRegions['fma:' + toFMA] = true;
										}

										var segment = new db.Connection({
											from:   'fma:' + fromFMA,
											to  :   'fma:' + toFMA,
											type: 'neural',
											species: record.species
										});
										segment.save(function (err, s) {
											if (err) {
												console.error(err);
											}
										});
									});
								} else {
									console.log('Info (ERR): huh?');
								}

//								console.log(record.con_from + ' (' + fromFMA + ')' + '  →  ' +
//								            record.con_to + ' (' + toFMA + ')');
							}

						});

					}

				});

				setTimeout(function () {
					console.log('==========================================');

					_(failedRegions).forEach(function (ids, name) {
						console.log(name + ' ' + ids);
					});

					console.log('==========================================');

					Q.all(_(allRegions).map(function (x, fma) {
						return Q.ninvoke(db.Entity.findById(fma), 'exec').then(function (ent) {
							if (ent) {
								if (ent.descendantCount >= 0) {
									console.log(ent._id + ' - ' + ent.name);
								} else {
//									console.log('meh...');
								}
							} else {
//								console.log('HUH?');
							}
						});
					})).then(function () {
						console.log('==========================================');
					});
				}, 40000);



			});
});
