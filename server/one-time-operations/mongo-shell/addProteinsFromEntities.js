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

	if (e.proteins) {
		for (var i = 0; i < e.proteins.length; ++i) {

			print(e.proteins[i]);

			db.proteins.update({ _id: e.proteins[i] }, { ensembl: e.proteins[i] }, { upsert: true });

		}
	}


}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////