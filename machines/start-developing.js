module.exports = {


  friendlyName: 'Start developing',


  description: 'Start a local/development preview session with an app or machinepack.',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project this is (app or machinepack)',
      example: 'machinepack',
      defaultsTo: 'app'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    unknownType: {
      description: 'Unknown project type.  You can link an "app" or a "machinepack".'
    },

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    },

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Unrecognized username/password combination.',
      extendedDescription: 'Please try again or visit http://treeline.io to reset your password or locate your username.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      variableName: 'result',
      description: 'Done.',
      example: '==='
    },

  },


  fn: function (inputs,exits) {

    var Machine = require('machine');

    // Link either an app or a machinepack
    switch (inputs.type) {
      case 'machinepack':
      case 'mp':
      case 'pack':
      case 'p':
        return Machine.build(require('./preview-pack'))(inputs).exec(exits);

      case 'a':
      case 'ap':
      case 'app':
        return Machine.build(require('./preview-app'))(inputs).exec(exits);

      default:
        return exits.unknownType();
    }

  },



};
