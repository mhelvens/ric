'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var mongo = new Mongo();
var db = mongo.getDB("ric");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

db.entities.insert({
	_id: '24tile:60000000',
	sub: [
		{ entity: '24tile:0000001', type: 'seed' },
		{ entity: '24tile:0000002', type: 'seed' },
		{ entity: '24tile:0000003', type: 'seed' },
		{ entity: '24tile:0000004', type: 'seed' },
		{ entity: '24tile:0000005', type: 'seed' },
		{ entity: '24tile:0000006', type: 'seed' },
		{ entity: '24tile:0000007', type: 'seed' },
		{ entity: '24tile:0000008', type: 'seed' },
		{ entity: '24tile:0000009', type: 'seed' },
		{ entity: '24tile:0000010', type: 'seed' },
		{ entity: '24tile:0000011', type: 'seed' },
		{ entity: '24tile:0000012', type: 'seed' },
		{ entity: '24tile:0000013', type: 'seed' },
		{ entity: '24tile:0000014', type: 'seed' },
		{ entity: '24tile:0000015', type: 'seed' },
		{ entity: '24tile:0000016', type: 'seed' },
		{ entity: '24tile:0000017', type: 'seed' },
		{ entity: '24tile:0000018', type: 'seed' },
		{ entity: '24tile:0000019', type: 'seed' },
		{ entity: '24tile:0000020', type: 'seed' },
		{ entity: '24tile:0000021', type: 'seed' },
		{ entity: '24tile:0000022', type: 'seed' },
		{ entity: '24tile:0000023', type: 'seed' },
		{ entity: '24tile:0000024', type: 'seed' }
	]
}, { upsert: true });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
