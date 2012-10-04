define(

	["jquery", "underscore", "backbone",
	 "views/mapview", "views/settingsview", "views/legendview", "views/sessioninfoview",
	 "collections/sessions", "models/settings", "models/appstate", "models/statistics", "FileLoader"],

	function($, _, Backbone,
			 MapView, SettingsView, LegendView, SessionInfoView,
			 SessionList, Settings, AppState, Statistics, FileLoader) {

		var AppView = Backbone.View.extend({
			el: $("#playground-app"),

			events: {
				"change #fileInput": "loadFile",
				"change #searchSessionInput": "searchSessionInputChanged"
			},

			model: null,

			sessions: null,

			settings: null,

			initialize: function() {

				// init model
				this.model = new AppState();
				this.sessions = new SessionList();
				// listen to changes
				this.sessions.on("all", this.render, this);

				// setup settings
				this.settings = new Settings();
				this.settingsview = new SettingsView({ model: this.settings });

				// setup map
				this.mapview = new MapView({
					collection: this.sessions,
					settings: this.settings
				});

				this.legendview = new LegendView({ colors: this.mapview.colors() });
				this.sessioninfoview = new SessionInfoView({ model: this.model });

				this.mapview.on("session:selected", this.sessionSelected, this);
				this.mapview.on("result:selected", this.resultSelected, this);
				this.sessioninfoview.on("session:focussed", this.sessionFocussed, this);
				this.sessioninfoview.on("session:unfocussed", this.sessionUnfocussed, this);
			},

			render: function() {

				if (this.sessions.length)
					this.legendview.$el.show();
				else
					this.legendview.$el.hide();
			},

			clearData: function() {
				this.sessions.reset();
				// revert all attributes to defaults
				this.model.set(this.model.defaults);
			},

			loadFile: function(evt) {

				this.clearData();

				var files = evt.target.files;
				if (!files.length) {
					return;
				}

				FileLoader.loadFiles(files, this.sessions, this.fileLoaded.bind(this));
			},

			// Callback for FileLoader
			fileLoaded: function(resultCode, filestats) {

				if (!this.model.has("statistics"))
					this.model.set("statistics", new Statistics());

				var stats = this.model.get("statistics");
				stats.addFileStats(filestats);
				stats.set("numSessions", this.sessions.length);
				this.model.trigger("change:statistics");
			},

			// Handler for "change" event from the session search field.
			searchSessionInputChanged: function(evt) {

				var searchText = evt.target.value;
				var session = this.sessions.get(searchText);
				if (session) {
					this.sessionSelected(session);
					this.sessionFocussed(session);
				}
				else {
					this.sessionSelected(null);
					this.sessionUnfocussed();
				}
				this.resultSelected(null);
			},

			// Handler for "session:selected" event. Update the info display.
			sessionSelected: function(session) {

				this.model.set("selectedSession", session);
			},

			// Handler for "result:selected" event. Update the info display.
			resultSelected: function(result) {

				this.model.set("selectedResult", result);
				this.mapview.highlightResult(result);
			},

			// Handler for "session:focussed" event. Zoom the map view.
			sessionFocussed: function(session) {

				this.model.set("focussedSessionId", session.id);
				this.mapview.focusSession(session);
			},

			// Handler for "session:unfocussed" event. Zoom the map view.
			sessionUnfocussed: function() {

				this.model.set("focussedSessionId", -1);
				this.mapview.zoomToBounds();
			}
		});

		return AppView;
	}
);
