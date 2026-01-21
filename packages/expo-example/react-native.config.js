const path = require('path');
const pkg = require('../native-date/package.json');

module.exports = {
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '../native-date'),
      platforms: {
        ios: {},
        android: {},
      },
    },
  },
};
