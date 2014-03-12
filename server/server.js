'use strict';

///////////////////////// Includes /////////////////////////

var vars = require('./vars');

var mongoose = require('mongoose');

var _ = require('lodash');


////////// Experimentation with Mongoose //////////

var db = mongoose.connect('localhost', 'ric');

var SCHEMA_OPTIONS = {
	id:     false,
	_id:    false,
	strict: false
};


function StringType(other) {
	return _.assign({
		type:    String,
		default: '',
		trim:    true
	}, other);
}

function StructureReference(other) {
	return StringType(_.assign({ ref: 'Structure' }, other));
}

function StringEnum() {
	return {
		type: String,
		trim: true,
		enum: _.toArray(arguments)
	};
}


var substructureSchema = new mongoose.Schema({
	structure: StructureReference(),
	type:      StringEnum('regional part', 'constitutional part', 'subclass', 'seed')
}, SCHEMA_OPTIONS);

var structureSchema = new mongoose.Schema({
	_id:         StringType({ unique: true }),
	name:        StringType(),
	description: StringType(),
	sub:         [substructureSchema]
}, SCHEMA_OPTIONS);

var connectionSchema = new mongoose.Schema({
	from: StructureReference(),
	to:   StructureReference(),
	type: StringType()
}, SCHEMA_OPTIONS);
connectionSchema.index({ from: 1, to: 1 }, { unique: true });

var metadataSchema = new mongoose.Schema({
	resource:  StructureReference(),
	structure: StructureReference(),
	type:      StringType()
}, SCHEMA_OPTIONS);
connectionSchema.index({ resource: 1, structure: 1 }, { unique: true });


var Structure = mongoose.model('Structure', structureSchema);
var Connection = mongoose.model('Connection', connectionSchema);
var Metadata = mongoose.model('Metadata', metadataSchema);


//_([
//	{_id: 'tile:60000001', name: "A"},
//	{_id: 'tile:60000002', name: "B"},
//	{_id: 'tile:60000003', name: "C"},
//	{_id: 'tile:60000004', name: "D", sub: [
//		{structure: 'tile:60000001', type: 'regional part'},
//		{structure: 'tile:60000005', type: 'constitutional part'}
//	]},
//	{_id: 'tile:60000005', name: "E", sub: [
//		{structure: 'tile:60000001', type: 'regional part'},
//		{structure: 'tile:60000002', type: 'constitutional part'},
//		{structure: 'tile:60000003', type: 'subclass'}
//	]}
//]).each
//(function (fields) {
//	Structure.create(fields, function (err, structure) {
//		if (err) { console.log(err); }
//	});
//});


Structure.findOne({ _id: 'tile:60000004' }).populate('sub.structure').exec
(function (err, structure) {
	if (err) {
		console.log(err);
	} else {
		console.log(JSON.stringify(structure, undefined, '    '));
	}
});
