'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var vars = require('../vars');
var db = require('../db');
var csv = require('csv');
var https = require('https');

////////////////////////////////////////////////////////////////////////////////

function countUrl(swissprot) {
	return {
		host: "beta.openphacts.org",
		path: "/1.3/target/pharmacology/count?uri=http%3A%2F%2Fwww.uniprot.org%2Funiprot%2F" + swissprot + "&app_id=5f4d394c&app_key=a98850ca38cc64794db78b3beb240f35&_format=json"
	};
}

function listUrl(swissprot) {
	return {
		host: "beta.openphacts.org",
		path: "/1.3/target/pharmacology/pages?uri=http%3A%2F%2Fwww.uniprot.org%2Funiprot%2F" + swissprot + "&app_id=5f4d394c&app_key=a98850ca38cc64794db78b3beb240f35&_pageSize=10&_format=json"
	};
}


var proteinMap = {};


csv()
		.from.path('ensembl-swissprot.csv', { columns: ['ensembl', 'swissprot'], trim: true })
		.to.array(function (data, count) {

			var counter = 0;

			_(data).forEach(function (protein) {
				if (protein.swissprot) {
					++counter;
					protein._id = protein.ensembl;
					proteinMap[protein.ensembl] = new db.Protein(protein);
				}
			});

			_(proteinMap).forEach(function (protein) {

				https.get(listUrl(protein.swissprot), function (res) {

					if (_(protein.smallMolecules).isUndefined()) {
						protein.smallMolecules = [];
					}

					if (res.statusCode === 200) {

						var endData = "";

						res.on('data', function (data) {

							endData += data.toString();

						}).on('end', function () {

							endData = JSON.parse(endData);

							_(endData.result.items).forEach(function (item) {
								protein.smallMolecules.push(item.hasMolecule);
							});

							protein.save(function (err, prot) {
								if (err) {
									console.log('error: ' + protein.swissprot);
									return;
								}
								console.log('OK: ' + prot._id);
							});

						});
					} else if (res.statusCode === 404) {

						protein.save(function (err, prot) {
							if (err) {
								console.log('error: ' + protein.swissprot);
								return;
							}
							console.log('--: ' + prot._id);
						});

					} else {

						console.error('ERROR: ' + res.statusCode);

					}

				}).on('error', function (err) {
					console.error(err);
				});

			});

		});




