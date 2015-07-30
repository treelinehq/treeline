module.exports = {


  friendlyName: 'Lift preview server',


  description: 'Lift the preview server on a local port (either the scribe utility or the in-development backend app.)',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project this is ("app" or "machinepack")',
      extendedDescription: 'If left unspecified, we\'ll sniff around in the directory and guess what kind of thing this is based on its package.json file.',
      example: 'machinepack'
    },

    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    localPort: {
      description: 'The local port to run the preview server on.  Defaults to 1337.',
      example: 1337,
      defaultsTo: 1337
    },

  },


  exits: {

  },


  fn: function (inputs,exits) {

    var path = require('path');
    var _ = require('lodash');

    // The path to the project is generally the current working directory
    // Here, we ensure is is absolute, and if it was not specified, default
    // it to process.cwd(). If it is relative, we resolve it from the current
    // working directory.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // This might be an app...
    if (inputs.type === 'app') {

      var Sails = require('sails').Sails;

      var sailsConfig = _.merge({
        log: { level: 'error' },
        port: inputs.localPort
      }, {});
      sailsConfig = _.merge(sailsConfig,{
        globals: false,
        hooks: {
          grunt: false,
          maintenance: function(sails) {

            return {
              initialize: function(cb) {

                sails.on('router:before', function () {

                  sails.router.bind('trace /_prepare', function(req, res) {
                    req._sails.config.maintenance = true;
                    return res.ok();
                  });

                  sails.router.bind('trace /_reload', function(req, res) {
                    var dirRegex = new RegExp("^" + inputs.dir);

                    // Clear all machines out of the require cache
                    _.each(_.keys(require.cache), function(key) {
                      if (key.match(dirRegex)) {
                        delete require.cache[key];
                      }
                    });

                    // Reload the config/routes.js file
                    req._sails.config.routes = require(path.resolve(inputs.dir, "config", "routes.js"));

                    // Reload controller middleware
                    req._sails.hooks.controllers.loadAndRegisterControllers(function() {

                      req._sails.once('hook:orm:reloaded', function() {
                        // Merge with original explicit routes
                        req._sails.config.routes = _.extend({}, req._sails.router.explicitRoutes, req._sails.config.routes);

                        // Flush router
                        req._sails.router.flush(req._sails.config.routes);

                        // Reload blueprints
                        req._sails.hooks.blueprints.bindShadowRoutes();

                        // Turn off maintenance mode
                        req._sails.config.maintenance = false;

                        res.ok();

                      });

                      // Reload ORM
                      req._sails.emit('hook:orm:reload');

                    });
                  });

                  sails.router.bind('all /*', function (req, res, next) {
                    if (sails.config.maintenance) {
                      return res.send('<html><head><meta http-equiv="refresh" content="2"></head><body>Please wait while Treeline updates your project (page will automatically reload)...</body></html>');
                    }
                    return next();
                  });

                });

                cb();

              }

            };
          }
        }
      });

      var app = Sails();
      app.lift(sailsConfig, function (err) {
        if (err) {
          return exits.error(err);
        }
        return exits.success(app);
      });
      return;
    }


    // ...or a pack.
    var Scribe = require('test-scribe');
    Scribe(_.extend({
      pathToPack: inputs.dir,
      port: inputs.localPort
    }, {}), function (err, localScribeApp) {
      if (err) {
        return exits.error(err);
      }
      return exits.success(localScribeApp);
    });


  },



};
