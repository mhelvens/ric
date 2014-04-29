'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var mongo = new Mongo();
var db = mongo.getDB("ric");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var c;
var e;
var id;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//// fetch all entities

var entities = {};

c = db.entities.find();
while (c.hasNext()) {
	e = c.next();
	entities[e._id] = e;
}


//// link sub and super

for (id in entities) {
	e = entities[id];

	if (e.sub) {
		for (var i = 0; i < e.sub.length; ++i) {
			e.sub[i].entity = entities[e.sub[i].entity];
		}
	}

}


//// how to traverse the ontology, visiting each entity only once

function traverse(entity, lock, before, after) {
	if (typeof entity['_' + lock + '_'] === 'undefined') {
		entity['_' + lock + '_'] = true;

		if (before) { before(entity); }

		if (typeof entity.sub !== 'undefined') {
			for (var i = 0; i < entity.sub.length; ++i) {
				if (typeof entity.sub[i].entity !== 'undefined') {
					traverse(entity.sub[i].entity, lock, before, after);
				}
			}
		}

		if (after) { after(entity); }
	}
}


//// set descendant counters

traverse(entities['24tile:60000000'], 'out', null, function (entity) {

	entity.descendantCount = 0;

	traverse(entity, entity._id, function () { entity.descendantCount++; });

	db.entities.update({ _id: entity._id }, { $set: { descendantCount: entity.descendantCount - 1} });

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
