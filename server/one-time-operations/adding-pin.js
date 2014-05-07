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

function infoUrl(swissprot) {
	return {
		host: "beta.openphacts.org",
		path: "/1.3/target?uri=http%3A%2F%2Fwww.uniprot.org%2Funiprot%2F" + swissprot + "&app_id=5f4d394c&app_key=a98850ca38cc64794db78b3beb240f35&_format=json"
	};
}

function countUrl(swissprot) {
	return {
		host: "beta.openphacts.org",
		path: "/1.3/target/pharmacology/count?uri=http%3A%2F%2Fwww.uniprot.org%2Funiprot%2F" + swissprot + "&app_id=5f4d394c&app_key=a98850ca38cc64794db78b3beb240f35&_format=json"
	};
}

function listUrl(swissprot, page, pageSize) {
	var path = "/1.3/target/pharmacology/pages" +
	           "?uri=http%3A%2F%2Fwww.uniprot.org%2Funiprot%2F" + swissprot +
	           "&app_id=5f4d394c" +
	           "&app_key=a98850ca38cc64794db78b3beb240f35" +
	           "&_page=" + page +
	           "&_pageSize=" + pageSize +
	           "&_format=json";

	return {
		host: "beta.openphacts.org",
		path: path
	};
}

function openPHACTSGet(protein, url, fn) {
	var req = https.get(url, function (res, err) {
		if (res.statusCode === 200) {

			var endData = "";

			res.on('data', function (data) {

				endData += data.toString();

			}).on('end', function () {

				endData = JSON.parse(endData);

				fn(endData);

			});

		} else {

			console.error('OpenPHACTS (ERR): ' + protein._id + ' (status code: ' + res.statusCode + ')');
			console.error(url);
			console.error(err);

		}
	});

	req.on('socket', function (socket) {
		socket.setTimeout(60000); // 1 minute
		socket.on('timeout', function () {
			req.abort();
			console.log('Timeout for: ' + protein._id + ' (trying again)');
			openPHACTSGet(protein, url, fn);
		});
	});
}

var PAGE_SIZE = 100;

var proteinMap = {};
var storedSmallMolecules = {};

var requestCounter = 0;
var responseCounter = 0;

function overview() {
	return '  (' + responseCounter + ' / ' + requestCounter + ')';
}


csv()
		.from.path('ensembl-swissprot.csv', { columns: ['ensembl', 'swissprot'], trim: true })
		.to.array(function (data/*, count*/) {

			_(data).forEach(function (csvProtein) {
				if (csvProtein.swissprot) {


					csvProtein._id = 'protein:' + csvProtein.ensembl;
					db.Protein.find({ _id: csvProtein._id }, function (err, proteins) {

						//// finding the protein or making a new one
						//
						var protein;
						if (proteins.length === 1) {
							protein = proteins[0];
//						} else if (proteins.length === 0) {
//							protein = new db.Protein(csvProtein);
						} else {
							console.log('Info (ERR): ' + 'protein:' + csvProtein.ensembl + ' (huh?)');
						}

						//// add swissprot ID and ensembl ID if not already there
						//
//						protein.swissprot = csvProtein.swissprot;
//						protein.ensembl = csvProtein.ensembl;


						//// storing protein info
						//
//						openPHACTSGet(protein, infoUrl(protein.swissprot), function (endData) {
//
//							if (_(endData.result.primaryTopic).isUndefined()) {
//								console.log('Info (ERR): ' + protein._id + ' (no primaryTopic)');
//								return;
//							}
//
//							protein.info = endData.result.primaryTopic;
//
//							protein.save(function (err, prot) {
//								if (err) {
//									console.log('Info (ERR): ' + protein._id);
//									return;
//								}
//								console.log('Info (OK): ' + prot._id);
//							});
//
//						});


//						//// Initialize to empty set of small molecules (otherwise... duplicates)
//						//
//						protein.smallMoleculeInteractions = [];
//
//						//// storing small molecule details
//						//
//						function recursiveOpenPHACTSGet(prot, page, pageSize) {
//							++requestCounter;
//							if (page === 1) {
//								console.log('> Getting first page for: ' + protein._id + overview());
//							} else {
//								console.log('> Getting next page for: ' + protein._id + overview());
//							}
//							openPHACTSGet(prot, listUrl(prot.swissprot, page, pageSize), function (endData) {
//								++responseCounter;
//								console.log('< Got page for:          ' + prot._id + overview());
//
//								_(endData.result.items).forEach(function (item) {
//
//									var smallMoleculeData = item.hasMolecule;
//									var smID = 'smol:' + smallMoleculeData._about.replace(/^.*\/(\w+)$/, '$1');
//
//									prot.smallMoleculeInteractions.push(smID);
//
//									if (_(storedSmallMolecules[smID]).isUndefined()) {
//										storedSmallMolecules[smID] = true;
//
//										var smallMolecule = new db.SmallMolecule({
//											_id: smID,
//											info: smallMoleculeData
//										});
//
//										smallMolecule.save(function (err, smMol) {
//											if (err) {
//												console.error('SmMol Save (ERR): ' + smID);
//												console.error(err);
//												return;
//											}
//											console.log('SmMol Save (OK): ' + smMol._id);
//										});
//
//									}
//
//								});
//
//								//// next page
//								if (page * pageSize < prot.smallMoleculeCount) {
//									recursiveOpenPHACTSGet(protein, page + 1, PAGE_SIZE);
//								} else {
//									prot.save(function (err, pprot) {
//										if (err) {
//											console.log(' - List (ERR): ' + prot.swissprot + overview());
//											console.log(err);
//											return;
//										}
//										console.log(' - List (OK): ' + pprot._id + overview());
//									});
//								}
//
//							});
//						}
//
//
//						//// storing small molecule count
//						//
//						if (_(protein.smallMoleculeCount).isUndefined()) {
//							openPHACTSGet(protein, countUrl(protein.swissprot), function (endData) {
//
//								console.log('Getting Counter for: ' + protein._id);
//
//								protein.smallMoleculeCount = endData.result.primaryTopic.targetPharmacologyTotalResults;
//
//								protein.save(function (err, prot) {
//									if (err) {
//										console.log(' - Count (ERR): ' + protein._id);
//										return;
//									}
//									console.log(' - Count (OK): ' + prot._id);
//
//									if (protein.smallMoleculeCount !== 0) {
//										recursiveOpenPHACTSGet(protein, 1, PAGE_SIZE);
//									}
//
//								});
//
//							});
//						} else if (protein.smallMoleculeCount !== 0) {
//
//							console.log('Already Have Counter for: ' + protein._id + ' = ' + protein.smallMoleculeCount);
//
//							recursiveOpenPHACTSGet(protein, 1, PAGE_SIZE);
//						}


					});
				}
			});

		});




