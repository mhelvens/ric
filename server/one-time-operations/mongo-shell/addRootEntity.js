'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var mongo = new Mongo();
var db = mongo.getDB("ric");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

db.entities.remove({ _id: '24tile:60000000' });

db.entities.insert({
	_id: '24tile:60000000',
	meta: true,
	tileMap: {
		spacing: 1,
		layout: 'rowsOfTiles'
	},
	sub: [
		{ entity: '24tile:60000001', type: 'seed' },
		{ entity: '24tile:60000002', type: 'seed' },
		{ entity: '24tile:60000003', type: 'seed' },
		{ entity: '24tile:60000004', type: 'seed' },
		{ entity: '24tile:60000005', type: 'seed' },
		{ entity: '24tile:60000006', type: 'seed' },
		{ entity: '24tile:60000007', type: 'seed' },
		{ entity: '24tile:60000008', type: 'seed' },
		{ entity: '24tile:60000009', type: 'seed' },
		{ entity: '24tile:60000010', type: 'seed' },
		{ entity: '24tile:60000011', type: 'seed' },
		{ entity: '24tile:60000012', type: 'seed' },
		{ entity: '24tile:60000013', type: 'seed' },
		{ entity: '24tile:60000014', type: 'seed' },
		{ entity: '24tile:60000015', type: 'seed' },
		{ entity: '24tile:60000016', type: 'seed' },
		{ entity: '24tile:60000017', type: 'seed' },
		{ entity: '24tile:60000018', type: 'seed' },
		{ entity: '24tile:60000019', type: 'seed' },
		{ entity: '24tile:60000020', type: 'seed' },
		{ entity: '24tile:60000021', type: 'seed' },
		{ entity: '24tile:60000022', type: 'seed' },
		{ entity: '24tile:60000023', type: 'seed' },
		{ entity: '24tile:60000024', type: 'seed' }
	]
}, { upsert: true });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
