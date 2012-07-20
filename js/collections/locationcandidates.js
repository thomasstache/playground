define(
	["underscore", "backbone",
	"models/LocationCandidate"],

	function(_, Backbone, LocationCandidate) {

		var LocationCandidateList = Backbone.Collection.extend({
			model: LocationCandidate,
		});

		return LocationCandidateList;
	}
);