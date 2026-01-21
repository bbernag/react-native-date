const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');
const pkg = require('../native-date/package.json');

const root = path.resolve(__dirname, '../native-date');

module.exports = getConfig(
  {
    presets: ['module:@react-native/babel-preset'],
  },
  { root, pkg }
);
