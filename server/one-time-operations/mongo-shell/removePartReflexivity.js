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


	//// Code to find entities with a direct self-reference:
//	var ci = db.entities.find({ _id: e._id, 'super': e._id });
//	if (ci.hasNext()) {
//		var cin = ci.next();
//		print(cin._id + '  -  ' + cin.super);
//	}

	////////// RESULT
	//	fma:12237  -  fma:12237,fma:67552
	//	fma:19892  -  fma:19892,fma:61645
	//	fma:242000  -  fma:242000,fma:42603
	//	fma:242791  -  fma:242768,fma:242791,fma:69064
	//	fma:242980  -  fma:24137,fma:242980
	//	fma:242999  -  fma:242999,fma:9657
	//	fma:256161  -  fma:256161,fma:69075
	//	fma:256237  -  fma:256237,fma:86140
	//	fma:264888  -  fma:264888,fma:264884
	//	fma:272177  -  fma:272177,fma:78049
	//	fma:50276  -  fma:50262,fma:50276
	//	fma:50735  -  fma:45847,fma:50735,fma:73748,fma:66645,24tile:60000009
	//	fma:52012  -  fma:30315,fma:52012
	//	fma:52417  -  fma:14144,fma:52417
	//	fma:52418  -  fma:14144,fma:52418
	//	fma:52464  -  fma:52463,fma:52464,fma:49914
	//	fma:55675  -  fma:20394,fma:55672,fma:67811,fma:67812,fma:7157,fma:55675
	//	fma:59548  -  fma:59548,fma:86157
	//	fma:61284  -  fma:55665,fma:61284
	//	fma:61823  -  fma:61823,fma:61820
	//	fma:61874  -  fma:24034,fma:61874,fma:61844
	//	fma:61891  -  fma:61831,fma:75429,fma:61891
	//	fma:63123  -  fma:63123,fma:67175
	//	fma:66464  -  fma:50720,fma:66464
	//	fma:66825  -  fma:66825,fma:86226,fma:66823
	//	fma:67175  -  fma:67175,fma:85800
	//	fma:68646  -  fma:67135,fma:68646
	//	fma:7157  -  fma:7149,fma:7157
	//	fma:74628  -  fma:45728,fma:74628,fma:13889
	//	fma:77868  -  fma:67242,fma:77868
	//	fma:85800  -  fma:85800
	//	fma:86246  -  fma:86103,fma:86246
	//	fma:86538  -  fma:86538,fma:15088
	//	fma:86806  -  fma:86806,fma:86805,fma:9663
	//	fma:9592  -  fma:231572,fma:7145,fma:9592
	//	fma:9600  -  fma:259282,fma:55662,fma:45664,fma:9600,fma:7160


	//// Code to remove self-references
	//
//	if (['fma:12237', 'fma:19892', 'fma:242000', 'fma:242791', 'fma:242980', 'fma:242999', 'fma:256161', 'fma:256237', 'fma:264888', 'fma:272177', 'fma:50276', 'fma:50735', 'fma:52012', 'fma:52417', 'fma:52418', 'fma:52464', 'fma:55675', 'fma:59548', 'fma:61284', 'fma:61823', 'fma:61874', 'fma:61891', 'fma:63123', 'fma:66464', 'fma:66825', 'fma:67175', 'fma:68646', 'fma:7157', 'fma:74628', 'fma:77868', 'fma:85800', 'fma:86246', 'fma:86538', 'fma:86806', 'fma:9592', 'fma:9600'].indexOf(e._id) !== -1) {
//		db.entities.update({ _id: e._id }, { $pull: { sub: { entity: e._id } } });
//
//		db.entities.update({ _id: e._id }, { $pull: { super: e._id } });
//	}


}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
