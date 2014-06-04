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

var domains = {};

var counter1 = 0;
var counter2 = 0;
var counter3 = 0;

////////////////////////////////////////////////////////////////////////////////

csv()
		.from.path('transcripts.csv', { columns: true, trim: true })
		.to.array(function (data/*, count*/) {

			var geneToProteins = {};

			_(data).forEach(function (item) {
				if (_(geneToProteins['protein:' + item.gene_ID]).isUndefined()) {
					geneToProteins['protein:' + item.gene_ID] = [];
				}
				geneToProteins['protein:' + item.gene_ID].push('protein:' + item.translation_ID);
			});


			db.Protein.find({}, function (err, genes) {
				if (err) {
					console.error(err);
					debugger;
				}
				_(genes).forEach(function (gene) {
					if (_(geneToProteins[gene._id]).isUndefined()) {
//						console.log('not found: ' + gene._id);
//						console.log('other: ' + 'protein:ENSG00000184281');
//						debugger;
					} else {
						console.log(gene._id);
						db.Protein.update({ _id: gene._id }, { translations: geneToProteins[gene._id] }, {}, function (err, numberAffected, raw) {
							if (err) {
								console.error(err);
								debugger;
							} else {
								console.log(numberAffected);
							}
						});
					}
				});
			});




		});





//{ $push: { translations: 'protein:' + record.translation_ID } }







//var rd = readLine.createInterface({
//	input   : fs.createReadStream('ensembl_domains.txt'),
//	output  : process.stdout,
//	terminal: false
//});
//
//rd.on('line', function (line) {
//	//                        111111     222     333     444     555555        666666     777777
//	var match = line.match(/^([^\s]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([^\s]+)(?:\s+([^\s]+)\s+([^\s]+))?\s*$/);
//
//	if (!match) {
//		console.error(line);
//		debugger;
//	}
//
//	if (_.isUndefined(domains[match[1]])) {
//		domains[match[1]] = [];
//	}
//	domains[match[1]].push({
//		start:     match[3],
//		end:       match[4],
//		type:      match[5],
//		pfam_id:   match[6],
//		pfam_name: match[7]
//	});
//}).on('close', function () {
//	csv()
//			.from.path('transcripts.csv', { columns: true, trim: true })
//			.to.array(function (data/*, count*/) {
//
//				console.log('expecting: ' + data.length);
//
//				_(data).forEach(function (record) {
//
//					if (counter1 % 1000 === 0) {
//						console.log(counter1);
//					} ++counter1;
//
//
//					var geneTranslation = new db.GeneTranslation({
//						_id: 'protein:' + record.translation_ID,
//						ensemble: record.translation_ID,
//						length: _.parseInt(record.translation_length),
//						domains: domains[record.translation_ID]
//					});
//
//					geneTranslation.save(function (err, gt) {
//						if (err) {
//							console.error(err);
//							debugger;
//						} else {
//							if (counter2 % 1000 === 0) {
//								console.log('- ' + counter2);
//							} ++counter2;
//
//
//						}
//					});
//
//
//				});
//
//				console.log(counter1);
//
//			});
//});
