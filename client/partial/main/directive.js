'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['jquery',
        'app/module',
        'resource/service',
        'bg-splitter',
        'jquery-spin',
        '$bind/service',
        'css!lib/bg-splitter/css/style'], function ($, Ric) {
//  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var SERVER_REQUEST_SIZE = 500; // entities per request

	var GRID_ROW_HEIGHT = 30; // px

	var DEFAULT_INITIAL_GRID_OPTIONS = {
		headerRowHeight:   GRID_ROW_HEIGHT,
		rowHeight:         GRID_ROW_HEIGHT,
		multiSelect:       false,
		enablePaging:      false,
		showColumnMenu:    true,
		showFooter:        false,
		jqueryUIDraggable: true,
		selectedItems: []
	};

	Ric.directive('ricInterface', ['Resources', '$timeout', '$bind', function (Resources, $timeout, $bind) {
		return {
			restrict:    'E',
			templateUrl: 'partial/main/view.html',
			replace:     false,

			controller: ['$scope', function ($scope) {
				$scope.mainScope = $scope;

				$scope._ = _;

				$scope.nocacheTimestamp = _.now();

				//// metadata relation types

				$scope.relTypes = [];
				$scope.currentRelType = '';

				Resources.metadataRelTypes().then(function (relTypes) {
					$scope.relTypes = relTypes;
					$scope.currentRelType = relTypes[0];
				});


				//// DB Elements

				$scope.entities = [];
				$scope.connections = [];
				$scope.externals = [];

				$scope.entitiesDoneLoading = false;
				$scope.connectionsDoneLoading = false;
				$scope.externalsDoneLoading = false;


				//// Grid row dragging options

				$scope.entityJqyouiDraggable =
				$scope.connectionJqyouiDraggable =
				$scope.externalJqyouiDraggable = {
					placeholder: true,
					animate:     true
				};


				$scope.entityJqyouiOptions =
				$scope.connectionJqyouiOptions = {
					helper:   function (event) {
						var gridID = $(event.currentTarget)
								.parent().parent().parent().parent()
								.attr('class').match(/ng\d+/)[0];
						return $('<div class="drag-helper"></div>')
								.append($(event.currentTarget)
										.parent().clone().css({top: 0}))
								.addClass(gridID);
					},
					appendTo: 'body',
					revert:   'invalid',
					handle:   '.drag-handle',
					cursor:   'move',
					scroll:   false
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
									type:     $scope.currentRelType,
									external: {
										_id:  $(event.currentTarget).find('.col1 > span').text().trim(),
										name: $(event.currentTarget).find('.col2 > span').text().trim()
									}
								});

								return helper;
							}
						}
				);


				//// Grid options

				$scope.entityGrid = _.defaults({
					data:          'entities',
					rowTemplate:   'partial/main/entityRow.html',
					columnDefs:    [
//						{ width: 30, cellHeaderTemplate: "", cellTemplate: 'partial/main/drag-handle-cell.html' },
						{ field: '_id', displayName: 'URI', width: 160 },
						{ field: 'name', displayName: 'Name', enableCellEdit: true },
						{ field: 'description', displayName: 'Description', enableCellEdit: true, visible: false }
					],
					showFilter:    true
				}, _.cloneDeep(DEFAULT_INITIAL_GRID_OPTIONS));

				$scope.connectionGrid = _.defaults({
					data:          'connections',
					rowTemplate:   'partial/main/connectionRow.html',
					columnDefs:    [
//						{ width: 30, cellHeaderTemplate: "", cellTemplate: 'partial/main/drag-handle-cell.html' },
						{ field: 'type', displayName: 'Type' },
						{ field: 'from', displayName: 'From' },
						{ field: 'to', displayName: 'To' }
					]
				}, _.cloneDeep(DEFAULT_INITIAL_GRID_OPTIONS));

				$scope.externalGrid = _.defaults({
					data:           'externals',
					rowTemplate:    'partial/main/externalRow.html',
					columnDefs:     [
						{ width: 30, cellHeaderTemplate: "", cellTemplate: 'partial/main/drag-handle-cell.html' },
						{ field: '_id', displayName: 'URI' },
						{ field: 'name', displayName: 'Name' }
					],
					showColumnMenu: false
				}, _.cloneDeep(DEFAULT_INITIAL_GRID_OPTIONS));


				//// Fetch initial entities and connections

				$scope.entitiesBusy = true;
				$scope.connectionsBusy = true;
				$scope.externalsBusy = true;

				(function loadEntities(skip) {
					Resources.entities.all({ skip: skip, limit: SERVER_REQUEST_SIZE }).then(function (entities) {
						console.log('Fetching entities from server:', skip, 'to', skip + SERVER_REQUEST_SIZE);
						$scope.entitiesBusy = false;
						$scope.entities = $scope.entities.concat(entities);
						if (entities.length === SERVER_REQUEST_SIZE) {
							loadEntities(skip + SERVER_REQUEST_SIZE);
						} else {
							// TODO: remove remaining loading indicators
						}
					});
				})(0);

				(function loadConnections(skip) {
					Resources.connections.all({ skip: 0, limit: SERVER_REQUEST_SIZE }).then(function (connections) {
						console.log('Fetching connections from server:', skip, 'to', skip + SERVER_REQUEST_SIZE);
						$scope.connectionsBusy = false;
						$scope.connections = $scope.connections.concat(connections);
						if (connections.length === SERVER_REQUEST_SIZE) {
							loadConnections(skip + SERVER_REQUEST_SIZE);
						} else {
							// TODO: remove remaining loading indicators
						}
					});
				})(0);

//				(function loadExternals(skip) {
//					Resources.externals.all({ skip: 0, limit: SERVER_REQUEST_SIZE }).then(function (externals) {
//						console.log('Fetching externals from server:', skip, 'to', skip + SERVER_REQUEST_SIZE);
//						$scope.externalsBusy = false;
//						$scope.externals = $scope.externals.concat(externals);
//						if (externals.length === SERVER_REQUEST_SIZE) {
//							loadExternals(skip + SERVER_REQUEST_SIZE);
//						} else {
//							// TODO: remove remaining loading indicators
//						}
//					});
//				})(0);

			}],

			link: function ($scope, iElement) {


//				jqyoui-droppable="entityMetadataJqyouiDroppable"
//				jqyoui-options="entityMetadataJqyouiOptions"


				//// Busy & progress indicators

				$scope.$watch('entitiesBusy', function (busy) {
					if (busy) {
						iElement.find('.ric-entities-grid + .spinner').spin();
					} else {
						iElement.find('.ric-entities-grid + .spinner').data('spinner').stop();
						iElement.find('.ric-entities-grid').trigger('resize');
					}
				});

				$scope.$watch('connectionsBusy', function (busy) {
					if (busy) {
						iElement.find('.ric-connections-grid + .spinner').spin();
					} else {
						iElement.find('.ric-connections-grid + .spinner').data('spinner').stop();
						iElement.find('.ric-connections-grid').trigger('resize');
					}
				});

				$scope.$watch('externalsBusy', function (busy) {
					if (busy) {
						iElement.find('.ric-externals-grid + .spinner').spin();
					} else {
						iElement.find('.ric-externals-grid + .spinner').data('spinner').stop();
						iElement.find('.ric-externals-grid').trigger('resize');
					}
				});


				//// trigger proper resize events when panes resize

				$scope.onResizeAll = function onResizeAll() {
					$scope.onResizeTop();
					$scope.onResizeBottom();
				};

				$scope.onResizeTop = function onResizeTop() {
					iElement.find('.ric-entities-grid').trigger('resize');
					iElement.find('.ric-connections-grid').trigger('resize');
				};

				$scope.onResizeBottom = function onResizeBottom() {
					iElement.find('.ric-externals-grid').trigger('resize');
				};


				//// Switching between entity view and connection view

				$scope.selectedType = '';
				$scope.selected = null;

				$scope.$watchCollection('entityGrid.selectedItems', function (items) {
					if (items.length > 0) {
						$scope.selectedType = 'entity';
						$scope.selected = items[0];
						$scope.connectionGrid.selectedItems = [];

						//// Dropping meta-data

						// This timeout is another ugly hack. The proper redesign
						// of this code will NOT use ngGrid and will use directives.
						$timeout(function () {
							$('.ric-metadata-drop-area').droppable({
								accept:      '.ric-externals-grid .draggable',
								activeClass: 'activeDroppable',
								hoverClass:  'hoveredDroppable',
								drop:        $bind(function (event, ui) {
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
						$scope.entityGrid.selectedItems = [];
					}
				});


				//// adding metadata

				$scope.addMetadata = function (entity, metadata) {
					if (_(metadata.type).isUndefined() || _(metadata.type).isEmpty()) { return; }

					var isRedundant = _(entity.externals).some(function (external) {
						return external.type === metadata.type &&
						       external.external._id === metadata.external._id;
					});

					if (isRedundant) { return; }

					//// Send the new metadata to the server first.
					//// When the response comes back, add it to the GUI.

					Resources.addMetadata(entity._id, metadata).then(function (metadata) {
						//// add the metadata
						entity.externals.push(metadata);

						//// record the relationship type
						$scope.relTypes.push(metadata.type);
						$scope.relTypes = _.uniq($scope.relTypes);
						$scope.currentCustomRelType = "";
					});
				};


				//// removing metadata

				$scope.removeMetadata = function (entity, metadata) {

					//// Send the request to the server first.
					//// When the response comes back, remove the meta-data from the GUI.

					Resources.removeMetadata(entity._id, metadata.type, metadata.external._id).then(function () {
						_(entity.externals).remove(metadata);
					});

				};


				//// importing external resources from a file

				$scope.importExternals = function () {
					$('.file-import').click();
				};

				$('.file-import').on('change', function () {
					if (_(this.value).isNull()) { return; }

					var fileReader = new FileReader();
					fileReader.onload = $bind(function (/*event*/) {
						//// parse file as follows:
						//// uri <whitespace with tab inside> name <whitespace with newline inside>
						//// ...

						_(fileReader.result.split(/\s*[\f\n\r]\s*/)).each(function (line) {
							var match = line.match(/([^\t]+)\s*\t\s*([^\t]+)/);
							if (match && match[1] && match[2]) {
								var uri = match[1];
								var name = match[2];

								var isRedundant = _($scope.externals).some(function (external) {
									return external._id === uri;
								});

								if (!isRedundant) { $scope.externals.push({ _id: uri, name: name }); }
							}
						});

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
