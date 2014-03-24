'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['app/module', 'lodash'], function (Ric, _) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var SERVER_REQUEST_SIZE = 500; // entities per request


	function FN(Res, action) {
		return function (options) {
			if (options && _(options.ids).isArray()) {
				options.ids =  options.ids.join(',');
			}
			return Res[action](options || {}).$promise;
		};
	}

	function getField(field) {
		return function (obj) {
			return obj[field];
		}
	}

	Ric.factory('Resources', ['$resource', '$http', '$q', function ($resource, $http, $q) {

		//// create $resource classes

		var Entities = $resource('/resources/entities/:ids?skip=:skip&limit=:limit', undefined, {
			'get':         { method: 'GET', isArray: true },
			'getAll':      { method: 'GET', isArray: true, url: '/resources/entities?skip=:skip&limit=:limit' },
			'getCount':    { method: 'GET', isArray: false, url: '/resources/entities/count' }
		});

		var Units = $resource('/resources/units/:ids?skip=:skip&limit=:limit', undefined, {
			'get':         { method: 'GET', isArray: true },
			'getAll':      { method: 'GET', isArray: true, url: '/resources/units?skip=:skip&limit=:limit' },
			'getCount':    { method: 'GET', isArray: false, url: '/resources/units/count' }
		});

		var Connections = $resource('/resources/connections/:ids?skip=:skip&limit=:limit', undefined, {
			'get':      { method: 'GET', isArray: true },
			'getAll':   { method: 'GET', isArray: true, url: '/resources/connections?skip=:skip&limit=:limit' },
			'getCount': { method: 'GET', isArray: false, url: '/resources/connections/count' }
		});

//		var Externals = $resource('/resources/externals/:ids?skip=:skip&limit=:limit', undefined, {
//			'get':      { method: 'GET', isArray: true },
//			'getAll':   { method: 'GET', isArray: true, url: '/resources/externals?skip=:skip&limit=:limit' },
//			'getCount': { method: 'GET', isArray: false, url: '/resources/externals/count' }
//		});


		//// build interface

		var result = {};

		result.entities       = FN(Entities, 'get');
		result.entities.all   = FN(Entities, 'getAll');
		result.entities.count = function () {
			return FN(Entities, 'getCount')().then(getField('count'));
		};
		result.entities.progressively = function () {
			var entitiesPromise = $q.defer();

			result.entities.count().then(function (totalCount) {
				console.log('Entity count from server:', totalCount);

				var entities = [];

				entitiesPromise.notify({ entities: entities, totalCount: totalCount });

				(function loadEntities(skip) {
					result.entities.all({ skip: skip, limit: SERVER_REQUEST_SIZE }).then(function (newEntities) {
						console.log('Fetching entities from server:', skip, 'to', skip + SERVER_REQUEST_SIZE);
						entities = entities.concat(newEntities);
						entitiesPromise.notify({ entities: entities, totalCount: totalCount });
						if (entities.length < totalCount) {
							loadEntities(skip + SERVER_REQUEST_SIZE);
						} else {
							entitiesPromise.resolve({ entities: entities, totalCount: totalCount });
						}
					}, function (err) {
						entitiesPromise.reject(err);
					});
				})(0);
			}, function (err) {
				entitiesPromise.reject(err);
			});

			return entitiesPromise.promise;
		};

		result.units       = FN(Units, 'get');
		result.units.all   = FN(Units, 'getAll');
		result.units.count = function () {
			return FN(Units, 'getCount')().then(getField('count'));
		};
		result.units.progressively = function () {
			var unitsPromise = $q.defer();

			result.units.count().then(function (totalCount) {
				console.log('Unit count from server:', totalCount);

				var units = [];

				unitsPromise.notify({ units: units, totalCount: totalCount });

				(function loadUnits(skip) {
					result.units.all({ skip: skip, limit: SERVER_REQUEST_SIZE }).then(function (newUnits) {
						console.log('Fetching units from server:', skip, 'to', skip + SERVER_REQUEST_SIZE);
						units = units.concat(newUnits);
						unitsPromise.notify({ units: units, totalCount: totalCount });
						if (units.length < totalCount) {
							loadUnits(skip + SERVER_REQUEST_SIZE);
						} else {
							unitsPromise.resolve({ units: units, totalCount: totalCount });
						}
					}, function (err) {
						unitsPromise.reject(err);
					});
				})(0);
			}, function (err) {
				unitsPromise.reject(err);
			});

			return unitsPromise.promise;
		};


		result.connections       = FN(Connections, 'get');
		result.connections.all   = FN(Connections, 'getAll');
		result.connections.count = function () {
			return FN(Connections, 'getCount')().then(getField('count'));
		};

		result.metadataRelTypes = function () {
			// not sure why, but the $resources way returns the strings as objects...
			return $http.get('/resources/reltypes').then(getField('data'));
		};

		result.addMetadata = function (id, metadata) {
			return $http.post('/resources/entities/' + id + '/externals', metadata).then(getField('data'));
		};

		result.removeMetadata = function (id, type, eid) {
			id = id.replace(/\?/g, '%3F');
			id = id.replace(/\#/g, '%23');
			id = id.replace(/\//g, '%2F');
			type = type.replace(/\?/g, '%3F');
			type = type.replace(/\#/g, '%23');
			type = type.replace(/\//g, '%2F');
			eid = eid.replace(/\?/g, '%3F');
			eid = eid.replace(/\#/g, '%23');
			eid = eid.replace(/\//g, '%2F');

			return $http.delete('/resources/entities/' + id + '/externals/' + type + '/' + eid);
		};

		result.addUnitMetadata = function (id, metadata) {
			return $http.post('/resources/units/' + id + '/externals', metadata).then(getField('data'));
		};

		result.removeUnitMetadata = function (id, type, eid) {
			id = id.replace(/\?/g, '%3F');
			id = id.replace(/\#/g, '%23');
			id = id.replace(/\//g, '%2F');
			type = type.replace(/\?/g, '%3F');
			type = type.replace(/\#/g, '%23');
			type = type.replace(/\//g, '%2F');
			eid = eid.replace(/\?/g, '%3F');
			eid = eid.replace(/\#/g, '%23');
			eid = eid.replace(/\//g, '%2F');

			return $http.delete('/resources/units/' + id + '/externals/' + type + '/' + eid);
		};

		return result;
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
