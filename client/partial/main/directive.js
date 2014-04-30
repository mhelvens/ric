'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery',
	'app/module',
	'resource/service',
	'bg-splitter',
	'$bind/service',
	'css!lib/bg-splitter/css/style'], function ($, app) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var GRID_ROW_HEIGHT = 30; // px

	var DEFAULT_INITIAL_GRID_OPTIONS = {
		headerRowHeight: GRID_ROW_HEIGHT,
		rowHeight      : GRID_ROW_HEIGHT,
		multiSelect    : false,
		enablePaging   : false,
		showColumnMenu : true,
		showFooter     : false,
		selectedItems  : []
	};

	app.directive('ricInterface', ['Resources', '$timeout', '$bind', function (Resources, $timeout, $bind) {
		return {
			restrict   : 'E',
			templateUrl: 'partial/main/view.html',
			replace    : false,

			controller: ['$scope', function ($scope) {
				$scope.mainScope = $scope;

				$scope._ = _;

				//// metadata relation types

				$scope.relTypes = [];
				$scope.currentRelType = '';

				Resources.metadataRelTypes().then(function (relTypes) {
					$scope.relTypes = relTypes;
					$scope.currentRelType = relTypes[0];
				});

				//// external types

				$scope.extTypes = [];
				$scope.currentExtType = '';

				Resources.metadataExtTypes().then(function (extTypes) {
					$scope.extTypes = extTypes;
					$scope.currentExtType = extTypes[0];
				});


				//// DB Elements

				$scope.entities = [];
				$scope.units = [];
				$scope.connections = [];
				$scope.externals = [];

				$scope.totalEntityCount = 0;
				$scope.totalUnitCount = 0;

				$scope.entitiesDoneLoading = false;
				$scope.unitsDoneLoading = false;
				$scope.connectionsDoneLoading = false;
				$scope.externalsDoneLoading = false;


				//// Panels

				$scope.panels = {
					anatomical: {
						name: "Anatomical Entities"
					},
					units     : {
						name: "Units"
					}
				};

				$scope.activePanels = {
					main: $scope.panels.anatomical
				};


				//// Grid row dragging options

				$scope.entityJqyouiDraggable =
				$scope.unitJqyouiDraggable =
				$scope.connectionJqyouiDraggable =
				$scope.externalJqyouiDraggable = {
					placeholder: true,
					animate    : true
				};


				$scope.entityJqyouiOptions =
				$scope.unitJqyouiOptions =
				$scope.connectionJqyouiOptions = {
					helper  : function (event) {
						var gridID = $(event.currentTarget)
								.parent().parent().parent().parent()
								.attr('class').match(/ng\d+/)[0];
						return $('<div class="drag-helper"></div>')
								.append($(event.currentTarget)
										.parent().clone().css({top: 0}))
								.addClass(gridID);
					},
					appendTo: 'body',
					revert  : 'invalid',
					handle  : '.drag-handle',
					cursor  : 'move',
					scroll  : false
				};

				$scope.externalJqyouiOptions =
				_.assign($scope.entityJqyouiOptions, {
							helper: function (event) {
								var gridID = $(event.currentTarget)
										.parent().parent().parent().parent()
										.attr('class').match(/ng\d+/)[0];

								var helper = $('<div class="drag-helper"></div>')
										.append($(event.currentTarget)
												.parent().clone().css({top: 0}))
										.addClass(gridID);

								// The fact that the hack below is needed to fetch the URI from
								// the HTML content of a specific column... is an indication of
								// how messy the ngGrid library is.
								// TODO: we need a cleaner solution altogether

								helper.data('draggedItem', {
									type    : $scope.currentRelType,
									external: {
										_id : $(event.currentTarget).find('.col1 > span').text().trim(),
										name: $(event.currentTarget).find('.col2 > span').text().trim(),
										type: $scope.currentExtType
									}
								});

								return helper;
							}
						}
				);


				//// Grid options

				$scope.entityGrid = _.defaults({
					data          : 'entities',
					rowTemplate   : 'partial/main/entityRow.html',
					columnDefs    : [
//						{ width: 30, cellHeaderTemplate: "", cellTemplate: 'partial/main/drag-handle-cell.html' },
						{ field: '_id', displayName: 'URI', width: 160 },
						{ field: 'name', displayName: 'Name', enableCellEdit: true },
						{ field: 'description', displayName: 'Description', enableCellEdit: false, visible: false },
						{
							field         : 'reachable',
							displayName   : 'Reachable',
							width         : 30,
							enableCellEdit: false,
							visible       : true,
							cellTemplate  : 'partial/main/reachable-glyph-cell.html',
							headerClass   : 'hidden'
						}
					],
					showFilter    : true,
					showColumnMenu: true,
					enableSorting : true,
					enableCellEdit: true
				}, _.cloneDeep(DEFAULT_INITIAL_GRID_OPTIONS));

				$scope.unitGrid = _.defaults({
					data          : 'units',
					rowTemplate   : 'partial/main/unitRow.html',
					columnDefs    : [
//						{ width: 30, cellHeaderTemplate: "", cellTemplate: 'partial/main/drag-handle-cell.html' },
						{ field: '_id', displayName: 'URI', width: 160 },
						{ field: 'name', displayName: 'Name', enableCellEdit: true },
						{ field: 'description', displayName: 'Description', enableCellEdit: false, visible: false }
					],
					showFilter    : true,
					showColumnMenu: true,
					enableSorting : true,
					enableCellEdit: true
				}, _.cloneDeep(DEFAULT_INITIAL_GRID_OPTIONS));

				$scope.connectionGrid = _.defaults({
					data       : 'connections',
					rowTemplate: 'partial/main/connectionRow.html',
					columnDefs : [
//						{ width: 30, cellHeaderTemplate: "", cellTemplate: 'partial/main/drag-handle-cell.html' },
						{ field: 'type', displayName: 'Type' },
						{ field: 'from', displayName: 'From' },
						{ field: 'to', displayName: 'To' }
					]
				}, _.cloneDeep(DEFAULT_INITIAL_GRID_OPTIONS));

				$scope.externalGrid = _.defaults({
					data          : 'externals',
					rowTemplate   : 'partial/main/externalRow.html',
					columnDefs    : [
						{ width: 30, cellHeaderTemplate: "", cellTemplate: 'partial/main/drag-handle-cell.html' },
						{ field: '_id', displayName: 'URI' },
						{ field: 'name', displayName: 'Name' }
					],
					showColumnMenu: false,
					enableCellEdit: true
				}, _.cloneDeep(DEFAULT_INITIAL_GRID_OPTIONS));


				//// Fetch initial entities, units and connections

				Resources.entities.progressively().then(function (data) {
					$scope.entities = data.entities;
					$scope.totalEntityCount = data.totalCount;
				}, function (err) {
					console.error(err);
				}, function (data) {
					$scope.entities = data.entities;
					$scope.totalEntityCount = data.totalCount;
				});

				Resources.units.progressively().then(function (data) {
					$scope.units = data.units;
					$scope.totalUnitCount = data.totalCount;
				}, function (err) {
					console.error(err);
				}, function (data) {
					$scope.units = data.units;
					$scope.totalUnitCount = data.totalCount;
				});


				console.log('Fetching all connections from server...');
				Resources.connections.all().then(function (connections) {
					$scope.connections = connections;
				});

			}],

			link: function ($scope, iElement) {

				//// trigger proper resize events when panes resize or toggle

				$scope.onResizeAll = function onResizeAll() {
					$scope.onResizeTop();
					$scope.onResizeBottom();
				};

				$scope.onResizeTop = function onResizeTop() {
					iElement.find('.ric-entities-grid').trigger('resize');
					iElement.find('.ric-units-grid').trigger('resize');
					iElement.find('.ric-connections-grid').trigger('resize');
				};

				$scope.onResizeBottom = function onResizeBottom() {
					iElement.find('.ric-externals-grid').trigger('resize');
				};

				$scope.$watch('activePanels.main', function (mainPanel) {
					if (mainPanel === $scope.panels.anatomical) {
						iElement.find('.ric-entities-grid').trigger('resize');
					} else if (mainPanel === $scope.panels.units) {
						iElement.find('.ric-units-grid').trigger('resize');
					}
				});


				//// block controls while loading

				$scope.$watch('0 < entities.length && entities.length === totalEntityCount', function () {
					iElement.find('.ric-entities-grid').trigger('resize');
					iElement.find('.ric-units-grid').trigger('resize');
				});


				//// Switching between entity/unit view and connection view

				$scope.selectedType = '';
				$scope.selected = null;

				$scope.$watchCollection('entityGrid.selectedItems', function (items) {
					if (items.length > 0) {
						$scope.selectedType = 'entity';
						$scope.selected = items[0];
						$scope.connectionGrid.selectedItems.pop();
						$scope.unitGrid.selectedItems.pop();

						//// Dropping meta-data

						// This timeout is another ugly hack. The proper redesign
						// of this code will NOT use ngGrid and will use directives.
						$timeout(function () {
							$('.ric-metadata-drop-area').droppable({
								accept     : '.ric-externals-grid .draggable',
								activeClass: 'activeDroppable',
								hoverClass : 'hoveredDroppable',
								drop       : $bind(function (event, ui) {
									var newExternal = ui.helper.data('draggedItem');
									$scope.addMetadata($scope.selected, newExternal);
								})
							});
						}, 100);
					}
				});

				$scope.$watchCollection('unitGrid.selectedItems', function (items) {
					if (items.length > 0) {
						$scope.selectedType = 'unit';
						$scope.selected = items[0];
						$scope.connectionGrid.selectedItems.pop();
						$scope.entityGrid.selectedItems.pop();

						//// Dropping meta-data

						// This timeout is another ugly hack. The proper redesign
						// of this code will NOT use ngGrid and will use directives.
						$timeout(function () {
							$('.ric-metadata-drop-area').droppable({
								accept     : '.ric-externals-grid .draggable',
								activeClass: 'activeDroppable',
								hoverClass : 'hoveredDroppable',
								drop       : $bind(function (event, ui) {
									var newExternal = ui.helper.data('draggedItem');
									$scope.addMetadata($scope.selected, newExternal);
								})
							});
						}, 100);
					}
				});

				$scope.$watchCollection('connectionGrid.selectedItems', function (items) {
					if (items.length > 0) {
						$scope.selectedType = 'connection';
						$scope.selected = items[0];
						$scope.entityGrid.selectedItems.pop();
						$scope.unitGrid.selectedItems.pop();
					}
				});


				//// adding metadata

				$scope.addMetadata = function (item, metadata) {
					if (_(metadata.type).isUndefined() || _(metadata.type).isEmpty()) {
						return;
					}

					var isRedundant;
					if ($scope.selectedType === 'entity') {

						isRedundant = _(item.externals).some(function (external) {
							return external.type === metadata.type &&
							       external.external._id === metadata.external._id;
						});

						if (isRedundant) {
							return;
						}

						//// Send the new metadata to the server first.
						//// When the response comes back, add it to the GUI.

						Resources.addMetadata(item._id, metadata).then(function (metadata) {
							//// add the metadata
							item.externals.push(metadata);

							//// record the relationship type
							$scope.relTypes.push(metadata.type);
							$scope.relTypes = _.uniq($scope.relTypes);
							$scope.currentCustomRelType = "";

							//// record the external type
							$scope.extTypes.push(metadata.external.type);
							$scope.extTypes = _.uniq($scope.extTypes);
							$scope.currentCustomExtType = "";
						});

					} else if ($scope.selectedType === 'unit') {

						isRedundant = _(item.externals).some(function (external) {
							return external.type === metadata.type &&
							       external.external._id === metadata.external._id;
						});

						if (isRedundant) {
							return;
						}

						//// Send the new metadata to the server first.
						//// When the response comes back, add it to the GUI.

						Resources.addUnitMetadata(item._id, metadata).then(function (metadata) {
							//// add the metadata
							item.externals.push(metadata);

							//// record the relationship type
							$scope.relTypes.push(metadata.type);
							$scope.relTypes = _.uniq($scope.relTypes);
							$scope.currentCustomRelType = "";

							//// record the external type
							$scope.extTypes.push(metadata.external.type);
							$scope.extTypes = _.uniq($scope.extTypes);
							$scope.currentCustomExtType = "";
						});

					}
				};


				//// removing metadata

				$scope.removeMetadata = function (entity, metadata) {

					//// Send the request to the server first.
					//// When the response comes back, remove the meta-data from the GUI.

					if ($scope.selectedType === 'entity') {
						Resources.removeMetadata(entity._id, metadata.type, metadata.external._id).then(function () {
							_(entity.externals).remove(metadata);
						});
					} else if ($scope.selectedType === 'unit') {
						Resources.removeUnitMetadata(entity._id, metadata.type, metadata.external._id).then(function () {
							_(entity.externals).remove(metadata);
						});
					}

				};


				//// importing external resources from a file

				$scope.importExternals = function () {
					$('.file-import').click();
				};

				$('.file-import').on('change', function () {
					if (_(this.value).isNull()) {
						return;
					}

					var extension = this.value.replace(/^.*\.(\w+)$/, '$1');

					var fileReader = new FileReader();
					fileReader.onload = $bind(function (/*event*/) {

						function getValue(node, name) {
							var n = node.attributes[name];
							return (n == null) ? null : n.value
						}

						if (extension === 'cellml') { // variables from a cellml file

							// The following code was provided by Tommy Yu
							var raw = $.parseXML(fileReader.result);
							var xpath_result = raw.evaluate(
									'.//cellml:variable',
									raw.documentElement,
									raw.createNSResolver(raw.documentElement),
									0, null
							);
							var res;
							while (res = xpath_result.iterateNext()) {
								$scope.externals.push({ _id: getValue(res, 'name'), name: getValue(res, 'name') });
							}

							$scope.currentExtType = 'variable'; // convenient
							if (!_($scope.extTypes).contains('variable')) {
								$scope.currentCustomExtType = 'variable';
							}

						} else { // assume tab delimited file

							//// uri <whitespace with tab inside> name <whitespace with newline inside>

							_(fileReader.result.split(/\s*[\f\n\r]\s*/)).each(function (line) {
								var match = line.match(/([^\t]+)\s*\t\s*([^\t]+)/);
								if (match && match[1] && match[2]) {
									var uri = match[1];
									var name = match[2];

									var isRedundant = _($scope.externals).some(function (external) {
										return external._id === uri;
									});

									if (!isRedundant) {
										$scope.externals.push({ _id: uri, name: name });
									}
								}
							});
						}


					});
					fileReader.readAsText(this.files[0]);
					this.value = null;
				});


				//// clearing the external resources grid

				$scope.clearExternals = function () {
					$scope.externals = [];
				};

				// exporting metadata is done from the server side
			}

		};
	}]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
