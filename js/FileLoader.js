define(
	["collections/sessions", "collections/results", "models/AccuracyResult", "jquery.csv"],

	function(SessionList, ResultList, AccuracyResult) {

		/**
		 * Singleton module to parse and load data from files.
		 */
		var FileLoader = (function() {

			var FileTypes = Object.freeze({
				ACCURACY: "accuracy",
				AXF: "axf",
			});
			var currentFileType = "";
			// dummy session ID for records from files that don't provide it.
			var SESSION_ID_DEFAULT = 0;

			// reference to the Sessions collection
			var sessionList = null;

			var callbackFct = null;

			// reference to the accuracy result while we parse the records with the location candidates
			var currentAccuracyResult = null;

			function onFileLoaded(evt) {
				// evt: ProgressEvent, target is the FileReader
				var rdr = evt.target;
				var rowData = [];
				var separator = (currentFileType == FileTypes.ACCURACY) ? "\t" : ",";

				if (rdr.readyState == FileReader.DONE) {
					// decompose the blob
					rowData = jQuery.csv(separator)(rdr.result);
					// parse the data
					processCSV(rowData);

					// notify about completion
					if (callbackFct != null)
						callbackFct("ok", currentFileType);
				}
			}

			// this function set all markers  to the map
			function processCSV(rowData) {

				currentAccuracyResult = null;

				var parsingFct;
				// identify file format (rudimentary by no. columns)
				var header = rowData[0];

				if (currentFileType == FileTypes.ACCURACY && header.length == 11) {
					parsingFct = parseAccuracyRecordV3;
				}
				else {
					alert("I do not recognize this file format!");
					return;
				}

				for (var ct = 1; ct < rowData.length; ct++) {
					parsingFct(rowData[ct]);
				}

				currentAccuracyResult = null; // release
				sessionList.trigger('add');
			}

			/* Parses a line from the new (v6.1) file format:
			 * Headers:
			 * FileId | MessNum | DTLatitude | DTLongitude | CTLatitude | CTLongitude | Distance | PositionConfidence | MobilityProb | IndoorProb | SessionId
			 */
			function parseAccuracyRecordV3(record) {

				var IDX = Object.freeze({
					FILEID: 0,
					MSGID: 1,
					REF_LAT: 2,
					REF_LON: 3,
					GEO_LAT: 4,
					GEO_LON: 5,
					DIST: 6,
					CONF: 7,
					PROB_MOB: 8,
					PROB_INDOOR: 9,
					SESSIONID: 10
				});

				var msgId = record[IDX.MSGID];
				var sessId = record[IDX.SESSIONID];

				// when the CT message ID changes, create a new AccuracyResult
				if (currentAccuracyResult == null ||
					currentAccuracyResult.get('msgId') != msgId) {

					// reference marker location
					var refLatLng = new google.maps.LatLng(parseFloat(record[IDX.REF_LAT]),
														   parseFloat(record[IDX.REF_LON]));

					// get the session if existing
					var session = sessionList.get(sessId);
					if (session == null) {
						// create missing session
						sessionList.add({
							id: sessId
						}, { silent: true });

						session = sessionList.at(sessionList.length - 1);
					}
					currentAccuracyResult = new AccuracyResult({
						msgId: msgId,
						sessionId: sessId,
						latLngRef: refLatLng
					});
					session.results.add(currentAccuracyResult, { silent: true });
				}

				var confidence = record[IDX.CONF];
				var probMobile = record[IDX.PROB_MOB];
				var probIndoor = record[IDX.PROB_INDOOR];

				var geoLatLng = new google.maps.LatLng(parseFloat(record[IDX.GEO_LAT]),
													   parseFloat(record[IDX.GEO_LON]));

				var distReported = record[IDX.DIST];

				currentAccuracyResult.locationCandidates.add({
					latLng: geoLatLng,
					distance: distReported,
					confidence: confidence,
					probMobility: probMobile,
					probIndoor: probIndoor
				}, { silent: true });
			}

			// return the external API
			return {

				/**
				 * Load all files in the array. Supported types are .axf and .distances
				 * @param files     Array of File objects (e.g. as retrieved from a input[type="file"]).
				 * @param callback  Callback function to call when done.
				 */
				loadFiles: function(files, sessions, callback) {

					if (sessions)
						sessionList = sessions;

					if (typeof callback === "function")
						callbackFct = callback;

					for (var i = 0, f; f = files[i]; i++) {
						this.loadFile(f);
					}
				},

				/**
				 * Parse and load a file. Supported types are .axf and .distances
				 */
				loadFile: function(file) {

					var start = 0;
					var stop = file.size - 1;
					var blob;

					var reader = new FileReader();
					// If we use onloadend, we need to check the readyState.
					reader.onloadend = onFileLoaded;

					// check which type of file we're dealing with
					var ext = file.name.substr(file.name.lastIndexOf(".") + 1);
					switch (ext)
					{
						case "distances":
							currentFileType = FileTypes.ACCURACY;
							break;
						case "axf":
							currentFileType = FileTypes.AXF;
							break;
						default:
							currentFileType = null;
					}

					reader.readAsBinaryString(file);
				}
			};
		})();

		return FileLoader;
	}
);