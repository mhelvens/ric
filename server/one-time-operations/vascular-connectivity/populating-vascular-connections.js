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
var segmentMap = {};
var segmentIdMap = {};
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


	//// now populating segmentMap and segmentIdMap
	//
	_(segments).forEach(function (segment) {
		segmentMap[segment.node1 + '-' + segment.node2] = segment;
		segmentIdMap[segment.segmentId] = segment;
	});

	////////// At this point, 8882 segments are left, all of them pointing FROM the heart TO the organs


//	console.log("putting the segments in the database"); // DONE
//	var segmentCounter = 0;
//	_(segments).forEach(function (segment) {
//
//		var connection = new db.Connection({
//			segmentId: segment.segmentId,
//			from: segment.node1,
//			to: segment.node2,
//			type: 'vascular',
//			subtype: (segment.type === 1 ? 'arterial' : 'venous'),
//			entity: segment.fma,
//			name: segment.name
//		});
//
//		connection.save(function (err, c) {
//			if (err) {
//				console.log(err);
//				console.log(from, to);
//				debugger;
//			}
//			++segmentCounter;
//			console.log('s: ' + segmentCounter);
//		});
//	});


	//// now making an in-memory graph of connected nodes
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

	//// Defining a depth first traversal function for the graph
	//
	var stack = [];
	var pathsDone = {};
	function depthFirst(nodeId, fn, stopOnlyAtFMA) {

		if (_(stack).contains(nodeId)) { return; } // Break cycles

		stack.push(nodeId); // Push onto the stack

		if (!stopOnlyAtFMA || (_(nodes[nodeId].predecessors).isEmpty() && (nodeId === 'fma:7165' || nodeId === 'fma:7166'))) {
			fn(_.clone(stack));
		}
		if (!(_(nodes[nodeId].predecessors).isEmpty() && (nodeId === 'fma:7165' || nodeId === 'fma:7166'))) { // ending at a heart chamber
			_(nodes[nodeId].predecessors).forEach(function (succ) {
				depthFirst(succ, fn);
			});
		}

		stack.pop(); // Pop from the stack
	}

//	var pathCounter = 0;
//	console.log("Adding the paths to the database"); // DONE
//	_(organs).keys().forEach(function (organ) {
//		depthFirst(organ, function (stack) {
//
//			//// register path subtype (arterial / venous) by checking the first connection
//			var type = segmentMap[stack[1] + '-' + stack[0]].type;
//
//			//// double checking other connections for inconsistencies (none found, yay!)
//			for (var i = stack.length-1; 1 < i; --i) {
//				if (type !== segmentMap[stack[i] + '-' + stack[i-1]].type) {
//					console.error('oh oh...');
//					debugger;
//				}
//			}
//
//			var path = new db.Path({
//				from: _.first(stack),
//				to: _.last(stack),
//				path: stack,
//				type: 'vascular',
//				subtype: (type === 1 ? 'arterial' : 'venous')
//			});
//
//			path.save(function (err, c) {
//				if (err) {
//					console.log(err);
//					console.log(from, to);
//					debugger;
//				}
//				++pathCounter;
//				console.log('p:      ' + pathCounter);
//			});
//		}, true);
//	});


	function forAllPairs(A, fn) {
		var firstNode = A[0];
		for (var i = 1; i < A.length; ++i) {
			fn(firstNode, A[i]);
			firstNode = A[i];
		}
	}


//	//// Finding the shortest paths between these pairs of segments, as requested by Bernard (DONE)
//	_([['2400','2401'], ['2567','2651'], ['3774','3774'], ['4282','4282'], ['4701','4703'], ['4705','4709'],
//	   ['3179','4764'], ['4813','5573'], ['5612','5866'], ['6030','6036'], ['6042','6310'], ['6329','6888'] ]).forEach(function (segmentPair) {
//
//		var startNode = segmentIdMap[segmentPair[1]].node2;
//		var endNode   = segmentIdMap[segmentPair[0]].node1;
//
//		console.log('==================== ', startNode, endNode);
//
//		pathsDone = {};
//		depthFirst(startNode, function (stack) {
//			if (_(stack).last() === endNode) {
//
//				stack.reverse();
//
//				var result = [];
//				forAllPairs(stack, function (a, b) {
//					result.push(segmentMap[a + '-' + b].segmentId);
//				});
//
//				console.log(result.join(' - '));
//
//			}
//		}, false);
//
//	});








});
