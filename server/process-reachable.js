'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var vars = require('./vars');
var db = require('./db');

////////////////////////////////////////////////////////////////////////////////

var count = 0;
var visited = {};

function annotateChildrenOf(entityId) {
	if (visited[entityId]) {
		return;
	}
	visited[entityId] = true;
	++count;
	if (count % 100 === 0) {
		console.log('visited ' + count + ' elements');
	}
	db.Entity.findById(entityId, function (err, ents) {

		if (ents) {
			db.Entity.update({_id: {$in: _.pluck(ents.sub, 'entity')}}, {
				$addToSet: { 'super': entityId },
				$set     : { 'reachable': true }
			}, { multi: true }, function (err, nrAffected) {});
			_(ents.sub).pluck('entity').forEach(annotateChildrenOf);
		}

	});
}

annotateChildrenOf('24tile:60000000');
