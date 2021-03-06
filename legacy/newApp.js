/**
 * Module dependencies.
 */

var program = require('commander'),
	prompt = require('prompt');

// Configure logger
//
var log = require('./logger');

/**
 * Extend the specified object with CLI utility methods
 *
 * @param victim - the object to monkeypatch
 */
module.exports = function (victim) {

	/**
	 * Require the user to make a choice from a set of options.
	 */
	victim.createNewApp = function ( defaultName, createAppFn, cb ) {

		// Display the menu prompt msg, plus hr(s)
		//
		log ();
		// log (hr);
    var msg =  ("==").yellow + " Enter a name for your new Treeline project";
    if (defaultName) {
      msg += ", or <enter> for the default ("+(defaultName).yellow+") ";
    }
    msg += ("==").yellow;
		log (msg);

		// Customize the prompt.
		//
		prompt.message = '>'.yellow;
		prompt.delimiter = '';

		function promptLoop () {

			// Start the prompt
			//
			log ();
			prompt.start();
			prompt.get({
				properties: {
					choice: {
						description: ' '
					}
				}
			}, function(err, result) {
				if (err) return exits.err(err);

				choice = result.choice;
				if (!choice) {
          if (defaultName) {
					 choice = defaultName;
          } else {
            return promptLoop();
          }
				}

				// Attempt to create a new project
				createAppFn(choice, function(err, body) {
					if (err) {
						if (err.errors && err.errors[0] && err.errors[0].details == '409') {
							return cb('A project with that name already exists.');
						} else {
							return cb('An error occurred creating the new project.');
						}
					} else {
						cb(null, {name: choice, fullName: choice, id: body.id});
					}
				});


			});
		}
		promptLoop();
	};


	// Return modified victim
	return victim;

};
