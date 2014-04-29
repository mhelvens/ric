'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var vars = require('./../../../apinatomy/server/vars');
var db = require('./../../../apinatomy/server/db');
var csv = require('csv');


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Processing proteins //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var FMA = [
	61825,
	61835,
	77791,
	67944,
	61833,
	50801,
	61826,
	62004,
	61841,
	224850,
	67325,
	62008,
	62007,
	62035,
	62434,
	67943
];

var fmaToProteins = {};
//var proteinsToFMA = {}; // Not needed right now
var fmaToProteinInteractions = {};

csv()
		.from.path('server/adding-proteins/proteins-reduced.csv', { columns: true, trim: true })
		.to.array(function (data, count) {

			//////////////////////////////////////// gather the data ////////////////////////////////////////

			_(FMA).forEach(function (fmaNr) {
				var fmaID = 'fma:' + fmaNr;
				fmaToProteins[fmaID] = [];
				fmaToProteinInteractions[fmaID] = [];
			});

			_(data).forEach(function (obj) {

//				if (_(proteinsToFMA[obj['Gene1']]).isUndefined()) { proteinsToFMA[obj['Gene1']] = []; } // Not needed right now
//				if (_(proteinsToFMA[obj['Gene2']]).isUndefined()) { proteinsToFMA[obj['Gene2']] = []; }

				_(FMA).forEach(function (fmaNr) {
					if (obj[fmaNr] === '1') {
						var fmaID = 'fma:' + fmaNr;

//						proteinsToFMA[obj['Gene1']].push(fmaID); // Not needed right now
//						proteinsToFMA[obj['Gene2']].push(fmaID);

						fmaToProteins[fmaID].push('protein:' + obj['Gene1']);
						fmaToProteins[fmaID].push('protein:' + obj['Gene2']);

						fmaToProteinInteractions[fmaID].push({
							interaction: ['protein:' + obj['Gene1'], 'protein:' + obj['Gene2']]
						});
					}

				});

			});


			//////////////////////////////////////// remove duplicates ////////////////////////////////////////

			_(FMA).forEach(function (fmaNr) {
				var fmaID = 'fma:' + fmaNr;
				fmaToProteins[fmaID] = _.uniq(fmaToProteins[fmaID]);
			});


			//////////////////////////////////////// display statistics ////////////////////////////////////////

			console.log('read:         ', count + ' rows');

			var expressionCount = 0;
			var perFMACount = {};
			var interactionCount = 0;
			_(FMA).forEach(function (fmaNr) {
				var fmaID = 'fma:' + fmaNr;
				expressionCount += fmaToProteins[fmaID].length;
				perFMACount[fmaID] = fmaToProteins[fmaID].length;
				interactionCount += fmaToProteinInteractions[fmaID].length;
			});
			console.log('expressions:  ', expressionCount);
			console.log('interactions: ', interactionCount);
			console.log('per FMA entity: ', JSON.stringify(perFMACount, null, '  '));


			//////////////////////////////////////// populate the database ////////////////////////////////////////

//			_(FMA).forEach(function (fmaNr) {
//				var fmaID = 'fma:' + fmaNr;
//
//				db.Entity.update({ _id: fmaID }, {
//					$set: {
//						proteins           : fmaToProteins[fmaID],
//						proteinInteractions: fmaToProteinInteractions[fmaID]
//					}
//				}, { multi: true }, function () {
//					console.log('stored: ' + fmaID);
//				});
//
//			});


		});


