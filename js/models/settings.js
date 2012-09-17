define(
	["underscore", "backbone"],

	function(_, Backbone) {

		var Settings = Backbone.Model.extend({

			defaults: {
				// connect geolocated and reference markers with lines
				drawReferenceLines: false,
				// connect markers in a session with lines
				drawSessionLines: false,
			}
		});

		return Settings;
	}
);