'use strict';

////////////////////////////////////////////////////////////////////////////////
///////////////////////// Includes /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var _ = require('lodash');
var fs = require('fs');
var db = require('../../db');
var vars = require('../../vars');
var readLine = require('readline');
var Q = require('q');

////////////////////////////////////////////////////////////////////////////////

var segments = [];
var toFMA = {};

////////////////////////////////////////////////////////////////////////////////

var rd = readLine.createInterface({
	input:    fs.createReadStream('vascular-graph.txt'),
	output:   process.stdout,
	terminal: false
});

rd.on('line', function (line) {

	var match = line.match(/^([^\t]+)\t(\d)\t(\d+)\t(\w+)\t(\w+)\t(.+)$/);

	var segment = {
		segmentId: match[1],
		type:      _.parseInt(match[2]),
		fma:       'fma:' + match[3],
		node1:     'vas:' + match[4],
		node2:     'vas:' + match[5],
		name:      match[6]
	};

	segments.push(segment);

	if (segment.type === 2) { // micro-circulation
		toFMA[segment.node1] = segment.fma;
		toFMA[segment.node2] = segment.fma;
	} else if (segment.type === 4) { // cardiac chamber
		toFMA[segment.node1] = segment.fma;
		toFMA[segment.node2] = segment.fma;
	}

}).on('close', function () {

	//// replace all occurrences of micro-circulations and heart chambers with their FMA id
	//
	_(segments).forEach(function (segment) {
		if (toFMA[segment.node1]) { segment.node1 = toFMA[segment.node1]; }
		if (toFMA[segment.node2]) { segment.node2 = toFMA[segment.node2]; }
	});


	////////// At this points, there are 11259 segments, which includes heart chambers and micro-circulations


	//// then remove all 'internal' segments
	//
	_(segments).remove(function (segment) { return segment.type === 2 || segment.type === 4; });


	////////// At this point, 8944 segments are left


	//// now removing 'node-pair duplicates', of which there are 62
	//
	var duplicates = {};
	_.remove(segments, function (segment) {
		if (!duplicates[segment.node1 + '-' + segment.node2]) {
			duplicates[segment.node1 + '-' + segment.node2] = true;
			return false;
		}
		return true;
	});


	////////// At this point, 8882 segments are left, all of them pointing FROM the heart TO the organs


	//// now putting them in the database; NOTE: IS ALREADY DONE
	//
	var counter = 0;
	_(segments).forEach(function (segment) {

		var from, to;
		if (segment.type === 1) {//// type 1, arterial: heart --> organ (so, keep the order)
			from = segment.node1;
			to = segment.node2;
		} else {///////////////////// type 3, venous:   organ --> heart (so, flip the order)
			from = segment.node2;
			to = segment.node1;
		}

		var connection = new db.Connection({
			from: from,
			to: to,
			type: 'vascular',
			subtype: (segment.type === 1 ? 'arterial' : 'venous'),
			entity: segment.fma,
			name: segment.name
		});

		connection.save(function (err, c) {
			if (err) {
				console.log(err);
				console.log(from, to);
				debugger;
			}
			++counter;
			console.log(counter);
		});

	});


	//// now putting the full PATHS in the database
	//

	var heartChambers = {};
	var organs = {};
	var nodes = {};
	_(segments).forEach(function (segment) {
		if (!nodes[segment.node1]) { nodes[segment.node1] = { successors: [], predecessors: [] }; }
		if (!nodes[segment.node2]) { nodes[segment.node2] = { successors: [], predecessors: [] }; }
		if (segment.node2 !== 'fma:7165' && segment.node2 !== 'fma:7166') {
			nodes[segment.node1].successors.push(segment.node2);
			nodes[segment.node2].predecessors.push(segment.node1);
		}
		if (segment.node1.substring(0, 4) === 'fma:') {
			heartChambers[segment.node1] = true;
		}
		if (segment.node2.substring(0, 4) === 'fma:' && segment.node2 !== 'fma:7165' && segment.node2 !== 'fma:7166') {
			organs[segment.node2] = true;
		}
	});

	console.log('STARTING');

	// TODO: recursively follow all paths, build up a stack, and put the path in the database (remove existing ones from the db first)
	var pathCounter = 0;
	var stack = [];

	var pathsDone = {};

	function depthFirst(nodeId) {

		if (_(stack).contains(nodeId)) { return; }

		stack.push(nodeId);

		if (_(nodes[nodeId].predecessors).isEmpty() && (nodeId === 'fma:7165' || nodeId === 'fma:7166')) { // ending at a heart chamber
//			console.log(stack);
//			debugger;
//			++pathCounter;
//			console.log(pathCounter);

			(function (stackCopy) {
				if (!pathsDone[_.first(stackCopy) + '-' + _.last(stackCopy)]) {
					pathsDone[_.first(stackCopy) + '-' + _.last(stackCopy)] = true;

					var path = new db.Path({ // TODO: make path direction depend on arterial- or venous-ness
						from: _.first(stackCopy),
						to: _.last(stackCopy),
						path: stackCopy,
						type: 'vascular'
					});

					path.save(function (err, c) {
						if (err) {
							console.log(err);
							console.log(from, to);
							debugger;
						}
						++pathCounter;
						console.log(pathCounter);
					});


				}
			}(_.clone(stack)));
		} else {
			_(nodes[nodeId].predecessors).forEach(function (succ) {
				depthFirst(succ);
			});
		}

		stack.pop();
	}

	_(organs).keys().forEach(depthFirst);


//	_(organs).keys().forEach(function (organ) {
//		db.Entity.findById(organ).exec(function (err, entity) {
//			if (!entity) {
//				console.log(organ);
//			} else {
//				console.log(entity._id + "  -  " + entity.name);
//			}
//		});
//	});


});
