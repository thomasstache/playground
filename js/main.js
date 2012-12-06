requirejs.config({
	shim: {
/*		'handlebars': {
			exports: 'Handlebars'
		},
*/
		'underscore': {
			exports: '_'
		},
		'backbone': {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},
	},
	paths: {
/*		json2: 'lib/hbs/json2',
		i18nprecompile: 'lib/hbs/i18nprecompile',
		hbs: 'lib/hbs/hbs',
		handlebars: 'lib/handlebars',
*/		underscore: 'lib/underscore',
		backbone: 'lib/backbone',
	},
});

require([],
	function() {
		//alert("Started!");
	}
);
