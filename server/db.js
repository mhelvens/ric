'use strict';

///////////////////////// Includes /////////////////////////

var mongoose = require('mongoose');
var _ = require('lodash');
var vars = require('./vars');

///////////////////////// Connect with Mongo /////////////////////////

mongoose.connect(vars.dbServer, vars.dbCollection);

///////////////////////// Schemas /////////////////////////

var SCHEMA_OPTIONS = {
	_id: false,
	strict: false
};

function StringType(other) {
	return _.assign({
		type: String,
		default: '',
		trim: true
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

var subEntitySchema = new mongoose.Schema({
	entity: EntityReference(),
	type: StringEnum('regional part', 'constitutional part', 'subclass', 'seed')
}, SCHEMA_OPTIONS);

var entitySchema = new mongoose.Schema({
	_id: StringType({ unique: true }),
	name: StringType(),
	description: StringType(),
	sub: [subEntitySchema]
}, SCHEMA_OPTIONS);

var connectionSchema = new mongoose.Schema({
	from: EntityReference(),
	to: EntityReference(),
	type: StringType()
}, SCHEMA_OPTIONS);
connectionSchema.index({ from: 1, to: 1 }, { unique: true });

var metadataSchema = new mongoose.Schema({
	entity: EntityReference(),
	resource: StringType(),
	type: StringType()
}, SCHEMA_OPTIONS);
connectionSchema.index({ resource: 1, entity: 1 }, { unique: true });

///////////////////////// Models /////////////////////////

exports.Entity = mongoose.model('Entity', entitySchema);
exports.Connection = mongoose.model('Connection', connectionSchema);
exports.Metadata = mongoose.model('Metadata', metadataSchema);
