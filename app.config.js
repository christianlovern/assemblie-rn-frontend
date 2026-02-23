const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      // EAS Build: use path from file secret GOOGLE_SERVICES_JSON when set
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ||
        appJson.expo.android?.googleServicesFile ||
        './google-services.json',
    },
  },
};
