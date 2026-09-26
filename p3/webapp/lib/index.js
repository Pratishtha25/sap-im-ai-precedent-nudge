/**
 * Browser/Node entry — loads mapper + helpers.
 * UI5 controllers can require individual modules; demo uses bundle via demo/render.js
 */
module.exports = {
  ...require("./StateMapper"),
  ...require("./IncidentIdResolver"),
  ...require("./TaskAllowList"),
  ...require("./DeepLink"),
  ...require("./PrecedentClient"),
};
