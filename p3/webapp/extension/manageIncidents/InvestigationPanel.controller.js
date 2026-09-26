sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
], function (Controller, JSONModel, Log) {
  "use strict";

  /**
   * Manage Incidents — Investigation facet full panel (Strategy D / E).
   * Place near Major Root Cause. Same GET /precedents API as My Inbox.
   */
  return Controller.extend("sap.im.precedent.extension.manageIncidents.InvestigationPanel", {
    onInit: function () {
      this._precedentModel = new JSONModel({ visible: false });
      this.getView().setModel(this._precedentModel, "precedent");
    },

    /**
     * @param {string} incidentId current Manage Incidents object key
     * @param {object} deps
     */
    loadPrecedentPanel: async function (incidentId, deps) {
      const {
        fetchPrecedent,
        mapPrecedentToViewModel,
        apiBaseUrl,
        showPendingHint = false,
      } = deps;

      try {
        if (!incidentId) {
          this._precedentModel.setData({ visible: false });
          return;
        }

        this._currentIncidentId = String(incidentId);
        const { payload } = await fetchPrecedent(apiBaseUrl, this._currentIncidentId);
        const vm = mapPrecedentToViewModel(payload, "full", { showPendingHint });
        this._viewModel = vm;
        this._precedentModel.setData(vm);
      } catch (err) {
        Log.error("Precedent Investigation panel failed soft", err);
        this._precedentModel.setData({ visible: false });
      }
    },

    formatFalseDup: function (pattern, count) {
      if (!pattern) return "";
      return pattern.replace("{0}", String(count ?? 0));
    },

    onOpenMatchedIncident: async function (deps) {
      const vm = this._viewModel || this._precedentModel.getData();
      if (!vm?.matchedIncidentId || !deps?.navigateToIncident) return;
      // Must open matched id — never self
      await deps.navigateToIncident(
        {
          ...deps.deepLinkConfig,
          currentIncidentId: this._currentIncidentId,
        },
        vm.matchedIncidentId,
        { onNavigate: deps.onNavigate }
      );
    },
  });
});
