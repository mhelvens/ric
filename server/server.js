'use strict';


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var vars = require('./vars');
var db = require('./db');
var express = require('express');

var app = express();


////////////////////////////////////////////////////////////////////////////////
///////////////////////// HTTP Status Codes ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var HTTP_OK = 200;
var HTTP_CREATED = 201;
var HTTP_NO_CONTENT = 204;
var HTTP_BAD_REQUEST = 400;
var HTTP_NOT_FOUND = 404;
var HTTP_INTERNAL_SERVER_ERROR = 500;


////////////////////////////////////////////////////////////////////////////////
///////////////////////// General Middleware ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.use(express.logger());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Downloading metadata text-file ///////////////////////
////////////////////////////////////////////////////////////////////////////////


app.get('/metadata.txt', function (req, res) {
	db.Metadata.find()
			.populate('entity', '_id name')
			.exec(function (err, metas) {
				if (err) {
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}

				var result = "";

				_.forEach(metas, function (meta) {
					result += meta.eid +
					          "\t" +
					          meta.type +
					          "\t" +
					          meta.entity._id +
					          "\t(" +
					          meta.entity.name +
					          ")\r\n";
				});

				res.status(HTTP_OK).send(result);
			});
});


////////////////////////////////////////////////////////////////////////////////
///////////////////////// API //////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


////////////////////  //  //  /  /  /
///// Entities ////  //  //  /  /  /
//////////////////  //  //  /  /  /


//// GET count of entities

app.get('/resources/entities/count', function (req, res) {
	db.Entity.count({ meta: { $exists: false } }, function (err, count) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_OK).json({ count: count });
	});
});


//// GET specific set of entities

app.get('/resources/entities/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Entity.find()
			.where('_id').in(ids)
			.sort({ '_id': 1 })
			.skip(skip)
			.limit(limit)
			.populate('sub.entity', '_id')
			.exec(function (err, ents) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(ents);
			});
});


//// GET all entities

app.get('/resources/entities', function (req, res) {
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Entity.find()
			.where({ meta: { $exists: false } })
			.sort({ '_id': 1 })
			.skip(skip)
			.limit(limit)
//			.populate('sub.entity', '_id') // not yet necessary at this stage
			.exec(function (err, ents) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
				}
				res.status(HTTP_OK).json(ents);
			});
});


//// POST new entity

app.post('/resources/entities', function (req, res) {
	if (_(req.body._id).isUndefined()) {
		res.status(HTTP_BAD_REQUEST).send(null);
		return;
	}

	var newEntity = new db.Entity(_.pick(req.body, ['name', 'description']));

	newEntity.save(function (err, entity) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_CREATED).json(entity);
	});
});


//// PUT edit of existing entity

app.put('/resources/entities/:id', function (req, res) {
	db.Entity.findById(req.params.id, function (err, entity) {
		if (err) {
			res.status(HTTP_NOT_FOUND).json(err);
			return;
		}

		_.assign(entity, _.pick(req.body, ['name', 'description']));

		entity.save(function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}
			res.status(HTTP_OK).json(entity);
		});

	});
});


//// POST new meta-data onto existing entity

app.post('/resources/entities/:id/externals', function (req, res) {

	//// add the new metadata to the entity itself first

	db.Entity.update({ _id: req.params.id }, { $push: { externals: req.body } }, function (err) {
		if (err) {
			res.status(HTTP_NOT_FOUND).json(err);
			return;
		}

		//// add it to the metadata collection too, to get quick access when needed

		var newMeta = new db.Metadata({
			entity: req.params.id,
			type:   req.body.type,
			eid:    req.body.external._id,
			name:   req.body.external.name
		});

		newMeta.save(function (err, meta) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}

			//// and send the response

			res.status(HTTP_CREATED).json(req.body);
		});
	});
});


//// DELETE existing entity

app.delete('/resources/entities/:id', function (req, res) {

	// TODO: use dedicated method 'findByIdAndRemove'

	db.Entity.findById(req.params.id, function (err, entity) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}

		entity.remove(function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}
			res.status(HTTP_NO_CONTENT).send(null);
		});
	});
});


//// DELETE meta-data from existing entity

app.delete('/resources/entities/:id/externals/:type/:eid', function (req, res) {

	//// remove it from the entity itself first

	db.Entity.update({ _id: req.params.id }, { $pull: { externals: { type: req.params.type, external: req.params.eid } } }, function (err) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}

		//// then remove it in the metadata collection

		db.Metadata.findOneAndRemove({ entity: req.params.id, type: req.params.type, eid: req.params.eid }, function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}

			//// then send the response

			res.status(HTTP_NO_CONTENT).send(null);
		});
	});
});




/////////////////  //  //  /  /  /
///// Units ////  //  //  /  /  /
///////////////  //  //  /  /  /


//// GET count of units

app.get('/resources/units/count', function (req, res) {
	db.Unit.count({}, function (err, count) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_OK).json({ count: count });
	});
});


//// GET specific set of units

app.get('/resources/units/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Unit.find()
			.where('_id').in(ids)
			.sort({ '_id': 1 })
			.skip(skip)
			.limit(limit)
			.exec(function (err, ents) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(ents);
			});
});


//// GET all units

app.get('/resources/units', function (req, res) {
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Unit.find()
			.sort({ '_id': 1 })
			.skip(skip)
			.limit(limit)
			.exec(function (err, ents) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
				}
				res.status(HTTP_OK).json(ents);
			});
});


//// POST new unit

app.post('/resources/units', function (req, res) {
	if (_(req.body._id).isUndefined()) {
		res.status(HTTP_BAD_REQUEST).send(null);
		return;
	}

	var newUnit = new db.Unit(_.pick(req.body, ['name', 'description']));

	newUnit.save(function (err, unit) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_CREATED).json(unit);
	});
});


//// PUT edit of existing unit

app.put('/resources/units/:id', function (req, res) {
	db.Unit.findById(req.params.id, function (err, unit) {
		if (err) {
			res.status(HTTP_NOT_FOUND).json(err);
			return;
		}

		_.assign(unit, _.pick(req.body, ['name', 'description']));

		unit.save(function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}
			res.status(HTTP_OK).json(unit);
		});

	});
});


//// POST new meta-data onto existing unit

app.post('/resources/units/:id/externals', function (req, res) {

	//// add the new metadata to the unit itself first

	db.Unit.update({ _id: req.params.id }, { $push: { externals: req.body } }, function (err) {
		if (err) {
			res.status(HTTP_NOT_FOUND).json(err);
			return;
		}

		//// add it to the metadata collection too, to get quick access when needed

		var newMeta = new db.Metadata({
			entity: req.params.id, // this key is still called 'entity'
			type:   req.body.type,
			eid:    req.body.external._id,
			name:   req.body.external.name
		});

		newMeta.save(function (err, meta) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}

			//// and send the response

			res.status(HTTP_CREATED).json(req.body);
		});
	});
});


//// DELETE existing unit

app.delete('/resources/units/:id', function (req, res) {

	// TODO: use dedicated method 'findByIdAndRemove'

	db.Unit.findById(req.params.id, function (err, unit) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}

		unit.remove(function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}
			res.status(HTTP_NO_CONTENT).send(null);
		});
	});
});


//// DELETE meta-data from existing unit

app.delete('/resources/units/:id/externals/:type/:eid', function (req, res) {

	//// remove it from the unit itself first

	db.Unit.update({ _id: req.params.id }, { $pull: { externals: { type: req.params.type, external: req.params.eid } } }, function (err) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}

		//// then remove it in the metadata collection

		// the key below is still called 'entity'
		db.Metadata.findOneAndRemove({ entity: req.params.id, type: req.params.type, eid: req.params.eid }, function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}

			//// then send the response

			res.status(HTTP_NO_CONTENT).send(null);
		});
	});
});






///////////////////////  //  //  /  /  /
///// Connections ////  //  //  /  /  /
/////////////////////  //  //  /  /  /


//// GET count of connections

app.get('/resources/connections/count', function (req, res) {
	db.Connection.count({}, function (err, count) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_OK).send(count);
	});
});


//// GET specific set of connections

// TODO: inner vs outer set
app.get('/resources/connections/:ids', function (req, res) {
	var ids = req.params.ids.split(',');
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Connection.find()
			.where('from').in(ids)
			.where('to').in(ids)
			.skip(skip)
			.limit(limit)
			.exec(function (err, conns) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(conns);
			});
});


//// GET all connections

app.get('/resources/connections', function (req, res) {
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.Connection.find()
			.skip(skip)
			.limit(limit)
			.exec(function (err, conns) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(conns);
			});
});


/////////////////////  //  //  /  /  /
///// Externals ////  //  //  /  /  /
///////////////////  //  //  /  /  /

//// GET count of externals

app.get('/resources/externals/count', function (req, res) {
	db.External.count({}, function (err, count) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_OK).send(count);
	});
});


//// GET specific set of externals

app.get('/resources/externals/:ids', function (req, res) {
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	var ids = req.params.ids.split(',');
	db.External.find()
			.where('_id').in(ids)
			.skip(skip)
			.limit(limit)
			.exec(function (err, ents) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
					return;
				}
				res.status(HTTP_OK).json(ents);
			});
});


//// GET all externals

app.get('/resources/externals', function (req, res) {
	var skip = req.query.skip || 0;
	var limit = req.query.limit || Infinity;
	db.External.find()
			.skip(skip)
			.limit(limit)
			.exec(function (err, ents) {
				if (err) {
					console.log(err);
					res.status(HTTP_INTERNAL_SERVER_ERROR).send(null);
				}
				res.status(HTTP_OK).json(ents);
			});
});


//// POST new external

app.post('/resources/externals', function (req, res) {
	if (_(req.body._id).isUndefined()) {
		res.status(HTTP_BAD_REQUEST).send(null);
		return;
	}

	var newExternal = new db.External(_.pick(req.body, ['name']));

	newExternal.save(function (err, external) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}
		res.status(HTTP_CREATED).json(external);
	});
});


//// PUT edit of existing external

app.put('/resources/externals/:id', function (req, res) {
	db.External.findById(req.params.id, function (err, external) {
		if (err) {
			res.status(HTTP_NOT_FOUND).json(err);
			return;
		}

		_.assign(external, _.pick(req.body, ['name']));

		external.save(function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}
			res.status(HTTP_OK).json(external);
		});

	});
});


//// DELETE existing external

app.delete('/resources/externals/:id', function (req, res) {
	db.External.findById(req.params.id, function (err, external) {
		if (err) {
			console.log(err);
			res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
			return;
		}

		external.remove(function (err) {
			if (err) {
				console.log(err);
				res.status(HTTP_INTERNAL_SERVER_ERROR).json(err);
				return;
			}
			res.status(HTTP_NO_CONTENT).send(null);
		});
	});
});


///////////////////////////////////////  //  //  /  /  /
///// Metadata relationship types ////  //  //  /  /  /
/////////////////////////////////////  //  //  /  /  /

app.get('/resources/reltypes', function (req, res) {
	db.Metadata.distinct('type').exec(function (err, relTypes) {
		if (err) {
			res.status(HTTP_NOT_FOUND).json(err);
			return;
		}
		res.status(HTTP_OK).json(relTypes);
	});
});


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Special Exceptions ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//// The bootstrap glyphicons need special treatment:

app.get('/bootstrap/glyphicons-halflings-regular.*', function (req, res) {
	res.redirect('/lib/bootstrap-sass-official/vendor/assets/fonts' + req.path);
});

app.get('/require.js', function (req, res) {
	res.redirect('/lib/requirejs/require.js');
});


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Client-side Routes ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// TODO: Specify 'get' directives to route each to index.html

//function serveIndex(req, res, next) {
//	req.url = '/';
//	next();
//}


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Client-side Static Files /////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.use(express.static(vars.clientDir));


////////////////////////////////////////////////////////////////////////////////
///////////////////////// Listen on the port ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

app.listen(process.argv[2] || vars.port);
