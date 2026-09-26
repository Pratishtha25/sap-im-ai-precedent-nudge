sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  // Adjust module paths when packaging into FLP component
], function (Controller, JSONModel, Log) {
  "use strict";

  /**
   * My Inbox Information-tab teaser (Strategy C / E).
   * Wire into custom attribute / controller extension after P0 Strategy C spike.
   * Does NOT modify list view or disable Claim/Forward/Suspend/Open Task.
   */
  return Controller.extend("sap.im.precedent.extension.myinbox.InformationTeaser", {
    onInit: function () {
      this._precedentModel = new JSONModel({ visible: false });
      this.getView().setModel(this._precedentModel, "precedent");
    },

    /**
     * Call when Information tab / task detail loads.
     * @param {object} workItem { title, containerIncidentId, customAttributeIncidentId, taskStepId }
     * @param {object} deps injected libs + config (for testability outside FLP)
     */
    loadPrecedentTeaser: async function (workItem, deps) {
      const {
        isTaskAllowedForPrecedent,
        resolveIncidentId,
        fetchPrecedent,
        mapPrecedentToViewModel,
        apiBaseUrl,
        allowTitleFallback = false,
        showPendingHint = false,
      } = deps;

      try {
        if (!isTaskAllowedForPrecedent(workItem.title, workItem.allowedStepIds, workItem.taskStepId)) {
          this._precedentModel.setData({ visible: false });
          return;
        }

        const resolved = resolveIncidentId({
          containerIncidentId: workItem.containerIncidentId,
          customAttributeIncidentId: workItem.customAttributeIncidentId,
          taskTitle: workItem.title,
          allowTitleFallback,
        });

        if (!resolved.incidentId) {
          this._precedentModel.setData({ visible: false });
          return;
        }

        if (resolved.warning) {
          Log.warning(resolved.warning);
        }

        const { payload } = await fetchPrecedent(apiBaseUrl, resolved.incidentId);
        const vm = mapPrecedentToViewModel(payload, "teaser", { showPendingHint });
        this._currentIncidentId = resolved.incidentId;
        this._viewModel = vm;
        this._precedentModel.setData(vm);
      } catch (err) {
        // Fail open — never break inbox actions
        Log.error("Precedent teaser failed soft", err);
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
