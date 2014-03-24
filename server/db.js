'use strict';


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var mongoose = require('mongoose');
var _ = require('lodash');
var vars = require('./vars');


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Connect with Mongo ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

mongoose.connect(vars.dbServer, vars.dbName);


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Convenience Definitions //////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function StringType(other) {
	return _.assign({
		type:    String,
		default: '',
		trim:    true
	}, other);
}

function StringEnum() {
	return {
		type: String,
		trim: true,
		enum: _.toArray(arguments)
	};
}

function EntityReference(other) {
	return StringType(_.assign({ ref: 'Entity' }, other));
}

//function ExternalReference(other) {
//	return StringType(_.assign({ ref: 'External' }, other));
//}


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Schemas //////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//// sub-schemas

var subEntitySchema = new mongoose.Schema({
	entity: EntityReference(),
	type:   StringEnum('regional part', 'constitutional part', 'subclass', 'seed')
});

var subExternalSchema = new mongoose.Schema({
	external: {
		_id:  StringType(),
		name: StringType()
	},
	type:     StringType()
});

//// main schemas

var entitySchema = new mongoose.Schema({
	_id:         StringType({ unique: true }),
	name:        StringType(),
	description: StringType(),
	sub:         [subEntitySchema],
	externals:   [subExternalSchema]
}, { _id: false });
entitySchema.index({ externals: 1 });

var unitSchema = new mongoose.Schema({
	_id:         StringType({ unique: true }),
	name:        StringType(),
	description: StringType(),
	externals:   [subExternalSchema]
}, { _id: false });

var connectionSchema = new mongoose.Schema({
	from: EntityReference(),
	to:   EntityReference(),
	type: StringType()
});
connectionSchema.index({ from: 1, to: 1 }, { unique: true });
connectionSchema.index({ type: 1 });

var metadataSchema = new mongoose.Schema({
	entity: StringType(),
	type:   StringType(),
	eid:    StringType(),
	name:   StringType()
}, { collection: 'metadata' });
metadataSchema.index({ entity: 1 });
metadataSchema.index({ type: 1 });
metadataSchema.index({ entity: 1, type: 1, eid: 1 }, { unique: true });

//var externalSchema = new mongoose.Schema({
//	_id: StringType({ unique: true }),
//	name: StringType()
//}, SCHEMA_OPTIONS);


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Models ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

exports.Entity = mongoose.model('Entity', entitySchema);
exports.Unit = mongoose.model('Unit', unitSchema);
exports.Connection = mongoose.model('Connection', connectionSchema);
exports.Metadata = mongoose.model('Metadata', metadataSchema);
