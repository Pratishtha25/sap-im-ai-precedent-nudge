/* global PrecedentUI */
(function () {
  const I18N = {
    title: "AI suggestion — historical precedent",
    disclosure:
      "AI-generated advisory content. Not a system-verified fact. Investigate independently.",
    intro: "This kind of incident has happened before. For reference, you may check",
    openLink: "Open in Manage Incidents",
    linkOnly: "Open the record for investigation details (no summary available).",
    stateBTitle: "Possible false or duplicate report",
    stateBBody:
      "This report resembles {0} past incident(s) at this location that were later closed as not valid or duplicate. Please verify the details before proceeding with investigation.",
    stateC: "No similar past incidents found — this may be a new pattern.",
    pending: "Checking similar incidents…",
    noAutoFill: "This suggestion does not fill category, root cause, or closure fields.",
    dismiss: "Not relevant",
    helpful: "Helpful",
    notHelpful: "Not helpful",
    dismissed: "Suggestion hidden. Thank you for the feedback.",
  };

  const TASKS = [
    {
      id: "t1",
      title: "Review and Complete Incident for Incident ID 388",
      containerIncidentId: "388",
      priority: "Medium",
      status: "Ready",
      due: "May 14, 2026",
      allowed: true,
    },
    {
      id: "t2",
      title: "Review and complete investigation of Incident ID 390",
      containerIncidentId: "390",
      priority: "Medium",
      status: "Ready",
      due: "May 15, 2026",
      allowed: true,
    },
    {
      id: "t3",
      title: "Perform investigation step 'Root Causes Hierarchy' for Incident ID 391",
      containerIncidentId: "391",
      priority: "Low",
      status: "Ready",
      due: "May 16, 2026",
      allowed: true,
    },
    {
      id: "t4",
      title: "Approve purchase order 9001",
      containerIncidentId: null,
      priority: "Low",
      status: "Ready",
      due: "—",
      allowed: false,
    },
  ];

  const deepLinkConfig = {
    semanticObject: "Incident",
    action: "display",
    incidentParamName: "IncidentID",
    extraParams: { section: "Investigation" },
  };

  /** Historical incidents — Fiori Investigation facet; RCA shown for precedent value. */
  const HISTORICAL = {
    347: {
      incidentNumber: "INC-2024-00347",
      title: "Conveyor guard rail missing — Line B",
      majorRootCause: "Guard rail missing on conveyor",
      comment: "",
      investigationStatus: "Closed",
      startDate: "",
      endDate: "",
      investigationLead: "A. Manager",
      status: "Closed",
      priority: "Medium",
      due: "—",
    },
  };

  let host = "inbox"; // inbox | manage
  let selected = TASKS[0];
  let lastVm = null;
  let lastIncidentId = null;
  let viewingHistorical = false;
  let returnTask = TASKS[0];

  const els = {
    layoutRoot: document.getElementById("layoutRoot"),
    taskList: document.getElementById("taskList"),
    detailTitle: document.getElementById("detailTitle"),
    assignment: document.getElementById("assignment"),
    meta: document.getElementById("meta"),
    host: document.getElementById("precedentHost"),
    navLog: document.getElementById("navLog"),
    apiStatus: document.getElementById("apiStatus"),
    appTitle: document.getElementById("appTitle"),
    investigationBlock: document.getElementById("investigationBlock"),
    tabs: document.getElementById("tabs"),
    btnInbox: document.getElementById("btnInbox"),
    btnManage: document.getElementById("btnManage"),
    footer: document.getElementById("footerActions"),
    objectPage: document.getElementById("objectPage"),
    objectTitle: document.getElementById("objectTitle"),
    objectNavLog: document.getElementById("objectNavLog"),
    invStatus: document.getElementById("invStatus"),
    invStartDate: document.getElementById("invStartDate"),
    invEndDate: document.getElementById("invEndDate"),
    invLead: document.getElementById("invLead"),
    objectRcaField: document.getElementById("objectRcaField"),
    objectComment: document.getElementById("objectComment"),
    btnBackToInbox: document.getElementById("btnBackToInbox"),
    btnOpenInvDetails: document.getElementById("btnOpenInvDetails"),
  };

  function setDisplayValue(el, value) {
    const text = value == null ? "" : String(value);
    el.textContent = text;
    el.classList.toggle("is-empty", !text.trim());
  }

  function showObjectPage(hist, matchedId, intent) {
    viewingHistorical = true;
    host = "manage";
    document.body.classList.add("fiori-object");
    els.layoutRoot.classList.add("layout--object");
    els.objectPage.hidden = false;
    els.footer.hidden = true;
    els.appTitle.textContent = "Manage Incidents";
    els.btnInbox.setAttribute("aria-pressed", "false");
    els.btnManage.setAttribute("aria-pressed", "true");

    els.objectTitle.textContent = hist.title || hist.incidentNumber || "Incident";
    setDisplayValue(els.invStatus, hist.investigationStatus || "New");
    setDisplayValue(els.invStartDate, hist.startDate || "");
    setDisplayValue(els.invEndDate, hist.endDate || "");
    setDisplayValue(els.invLead, hist.investigationLead || "");
    setDisplayValue(els.objectRcaField, hist.majorRootCause || "");
    setDisplayValue(els.objectComment, hist.comment || "");
    els.objectNavLog.textContent = "";
    els.host.innerHTML = "";
  }

  function hideObjectPage() {
    viewingHistorical = false;
    document.body.classList.remove("fiori-object");
    els.layoutRoot.classList.remove("layout--object");
    els.objectPage.hidden = true;
    els.objectNavLog.textContent = "";
  }

  function renderTaskList() {
    els.taskList.innerHTML = TASKS.map(
      (t) => `<div class="task" role="option" data-id="${t.id}" aria-selected="${
        selected && selected.id === t.id
      }"><div>${escapeHtml(t.title)}</div><small>${t.priority} · ${t.status} · Due ${t.due}</small></div>`
    ).join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderPanel(vm, mode) {
    if (!vm || !vm.visible) {
      els.host.innerHTML = "";
      return;
    }

    const classes = ["precedentPanel"];
    if (mode === "teaser") classes.push("precedentPanel--teaser");
    if (vm.showFalseDup && !vm.showPrecedent) classes.push("precedentPanel--warning");
    if (vm.showNoMatchNote && !vm.showPrecedent && !vm.showFalseDup) classes.push("precedentPanel--note");

    let html = `<section class="${classes.join(" ")}" role="region" aria-label="${escapeHtml(I18N.title)}">`;
    html += `<div class="precedentPanel__badge">${escapeHtml(I18N.title)}</div>`;
    html += `<p class="precedentPanel__disclosure" id="precedentDisclosure">${escapeHtml(I18N.disclosure)}</p>`;

    if (vm.pendingHint) {
      html += `<p class="precedentPanel__hint">${escapeHtml(I18N.pending)}</p>`;
    }

    if (vm.showFalseDup) {
      html += `<h3 class="precedentPanel__title">${escapeHtml(I18N.stateBTitle)}</h3>`;
      html += `<p class="precedentPanel__body">${escapeHtml(
        I18N.stateBBody.replace("{0}", String(vm.falseDupCount))
      )}</p>`;
      html += `<div class="precedentPanel__actions">
        <button type="button" class="precedentPanel__link" id="btnHelpful">${escapeHtml(I18N.helpful)}</button>
        <button type="button" class="precedentPanel__link" id="btnNotHelpful">${escapeHtml(I18N.notHelpful)}</button>
      </div>`;
    }

    if (vm.showPrecedent) {
      const matchLabel = escapeHtml(vm.matchedIncidentNumber || vm.matchedIncidentId);
      html += `<p class="precedentPanel__body">${escapeHtml(I18N.intro)} <a href="#" class="precedentPanel__link" id="btnOpenMatchInline" role="link">${matchLabel}</a>.</p>`;
      if (vm.summaryText) {
        html += `<p class="precedentPanel__summary">${escapeHtml(vm.summaryText)}</p>`;
      } else if (vm.linkOnly) {
        html += `<p class="precedentPanel__hint">${escapeHtml(I18N.linkOnly)}</p>`;
      }
      html += `<p class="precedentPanel__hint">${escapeHtml(I18N.noAutoFill)}</p>`;
    }

    if (vm.showNoMatchNote) {
      html += `<p class="precedentPanel__body">${escapeHtml(I18N.stateC)}</p>`;
    }

    html += `</section>`;
    els.host.innerHTML = html;

    const openInline = document.getElementById("btnOpenMatchInline");
    if (openInline) {
      openInline.addEventListener("click", (e) => {
        e.preventDefault();
        onOpenMatch();
      });
    }
    const helpful = document.getElementById("btnHelpful");
    if (helpful) helpful.addEventListener("click", () => onFalseDupRate(true));
    const notHelpful = document.getElementById("btnNotHelpful");
    if (notHelpful) notHelpful.addEventListener("click", () => onFalseDupRate(false));
  }

  async function postApi(path, body) {
    try {
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": "demo-manager" },
        body: JSON.stringify(body),
      });
    } catch {
      /* fail soft */
    }
  }

  function onOpenMatch() {
    try {
      PrecedentUI.assertNoAutoFillActions([]);
      const matchedId = lastVm.matchedIncidentId;
      if (!matchedId) return;

      const intent = PrecedentUI.buildNavigationIntent(
        { ...deepLinkConfig, currentIncidentId: lastIncidentId },
        matchedId
      );

      postApi("/api/events", {
        type: "deep_link_clicked",
        incidentId: lastIncidentId,
        matchedIncidentId: matchedId,
        panelState: lastVm.showFalseDup ? "AB" : "A",
        surface: host === "inbox" ? "myinbox" : "manageIncidents",
      });

      const hist = HISTORICAL[matchedId] || {
        incidentNumber: lastVm.matchedIncidentNumber || matchedId,
        title: lastVm.matchedIncidentNumber || "Historical incident",
        majorRootCause: "",
        correctiveAction: "",
        comment: "",
        investigationStatus: "New",
        startDate: "",
        endDate: "",
        investigationLead: "—",
        status: "Closed",
        priority: "—",
        due: "—",
      };

      returnTask = TASKS.find((t) => t.containerIncidentId === lastIncidentId) || TASKS[0];
      selected = {
        id: "hist-" + matchedId,
        title: hist.title,
        containerIncidentId: String(matchedId),
        incidentNumber: hist.incidentNumber,
        majorRootCause: hist.majorRootCause,
        correctiveAction: hist.correctiveAction,
        priority: hist.priority,
        status: hist.status,
        due: hist.due,
        allowed: true,
      };

      showObjectPage(hist, matchedId, intent);
    } catch (err) {
      els.navLog.textContent = "Deep link error: " + err.message;
    }
  }

  async function onDismiss() {
    await postApi("/api/precedents/" + encodeURIComponent(lastIncidentId) + "/feedback", {
      verdict: "NOT_RELEVANT",
      matchedIncidentId: lastVm.matchedIncidentId,
      surface: host === "inbox" ? "myinbox" : "manageIncidents",
    });
    lastVm = { visible: false };
    els.host.innerHTML = `<p class="precedentPanel__hint">${escapeHtml(I18N.dismissed)}</p>`;
    els.navLog.textContent = "FR9 feedback logged (NOT_RELEVANT) — log-only in v1 (AD-8).";
  }

  async function onFalseDupRate(helpful) {
    await postApi("/api/precedents/" + encodeURIComponent(lastIncidentId) + "/feedback", {
      verdict: helpful ? "HELPFUL" : "NOT_HELPFUL",
      surface: host === "inbox" ? "myinbox" : "manageIncidents",
    });
    els.navLog.textContent =
      "False/dup rating logged: " + (helpful ? "HELPFUL" : "NOT_HELPFUL");
  }

  function renderApiOfflineHint() {
    els.host.innerHTML =
      `<p class="precedentPanel__hint">AI suggestion unavailable (Precedent API offline). ` +
      `Start <code>p1</code> on port 4001, then refresh.</p>`;
  }

  async function loadPrecedent() {
    if (viewingHistorical) {
      els.host.innerHTML = "";
      return;
    }

    els.navLog.textContent = "";
    const mode = host === "inbox" ? "teaser" : "full";

    try {
      if (typeof PrecedentUI === "undefined") {
        els.host.innerHTML =
          `<p class="precedentPanel__hint">UI bundle failed to load — refresh the page.</p>`;
        return;
      }

      if (host === "inbox") {
        if (!PrecedentUI.isTaskAllowedForPrecedent(selected.title)) {
          lastVm = { visible: false };
          renderPanel(lastVm, mode);
          return;
        }
        const resolved = PrecedentUI.resolveIncidentId({
          containerIncidentId: selected.containerIncidentId,
          taskTitle: selected.title,
          allowTitleFallback: true,
        });
        if (!resolved.incidentId) {
          lastVm = { visible: false };
          renderPanel(lastVm, mode);
          return;
        }
        lastIncidentId = resolved.incidentId;
      } else {
        lastIncidentId = selected.containerIncidentId;
        if (!lastIncidentId) {
          lastVm = { visible: false };
          renderPanel(lastVm, mode);
          return;
        }
      }

      const res = await fetch("/api/precedents/" + encodeURIComponent(lastIncidentId));
      if (!res.ok) {
        renderApiOfflineHint();
        return;
      }
      const payload = await res.json();
      lastVm = PrecedentUI.mapPrecedentToViewModel(payload, mode, { showPendingHint: false });
      renderPanel(lastVm, mode);
      if (lastVm.visible && (lastVm.showPrecedent || lastVm.showFalseDup)) {
        postApi("/api/events", {
          type: "panel_shown",
          incidentId: lastIncidentId,
          matchedIncidentId: lastVm.matchedIncidentId,
          panelState: lastVm.showPrecedent && lastVm.showFalseDup ? "AB" : lastVm.showPrecedent ? "A" : "B",
          surface: host === "inbox" ? "myinbox" : "manageIncidents",
        });
      }
    } catch {
      lastVm = { visible: false };
      renderApiOfflineHint();
    }
  }

  function renderDetail() {
    if (viewingHistorical) return;

    hideObjectPage();

    const displayTitle =
      host === "inbox"
        ? selected.title
        : selected.incidentNumber
          ? selected.incidentNumber + " — Investigation"
          : "Incident " + (selected.containerIncidentId || "—");

    els.detailTitle.textContent = displayTitle;
    els.assignment.textContent =
      host === "inbox"
        ? "You were assigned to: " + selected.title
        : "Manage Incidents object page — Investigation facet (Major Root Cause below).";
    els.meta.innerHTML = `
      <div><dt>Source</dt><dd>${host === "manage" ? "Manage Incidents" : "SAP_WFRT"}</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(selected.status)}</dd></div>
      <div><dt>Priority</dt><dd>${escapeHtml(selected.priority)}</dd></div>
      <div><dt>Due</dt><dd>${escapeHtml(selected.due)}</dd></div>`;

    els.investigationBlock.hidden = host !== "manage";
    els.footer.hidden = host !== "inbox";
    els.tabs.innerHTML =
      host === "inbox"
        ? `<span aria-current="true">Information</span><span>Notes (0)</span><span>Attachments (0)</span><span>Related Links (0)</span>`
        : `<span>Details</span><span>Location</span><span>People</span><span aria-current="true">Investigation</span><span>Tasks</span><span>Reports</span><span>Documents</span>`;

    const rcaField = document.getElementById("rcaField");
    if (rcaField && host === "manage") {
      rcaField.value = selected.majorRootCause || "";
      rcaField.readOnly = false;
    }

    renderTaskList();
    loadPrecedent();
  }

  function setHost(next) {
    if (next === "inbox") {
      hideObjectPage();
      selected = returnTask || TASKS[0];
    } else if (viewingHistorical) {
      // already on deep-linked object page
      return;
    }
    host = next;
    els.appTitle.textContent = host === "inbox" ? "My Inbox" : "Manage Incidents";
    els.btnInbox.setAttribute("aria-pressed", host === "inbox" ? "true" : "false");
    els.btnManage.setAttribute("aria-pressed", host === "manage" ? "true" : "false");
    renderDetail();
  }

  els.taskList.addEventListener("click", (e) => {
    const node = e.target.closest(".task");
    if (!node) return;
    hideObjectPage();
    selected = TASKS.find((t) => t.id === node.dataset.id);
    returnTask = selected;
    renderDetail();
  });

  els.btnInbox.addEventListener("click", () => setHost("inbox"));
  els.btnManage.addEventListener("click", () => {
    if (viewingHistorical) return;
    setHost("manage");
  });

  els.btnBackToInbox.addEventListener("click", () => setHost("inbox"));
  els.btnOpenInvDetails.addEventListener("click", () => {
    els.objectNavLog.textContent =
      "Open Investigation Details (demo) — would open the full investigation worksheet in Manage Incidents.";
  });

  els.footer.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    els.navLog.textContent =
      "Workflow action fired: " +
      btn.dataset.action +
      " (not blocked by precedent panel — fail open / advisory only).";
  });

  fetch("/api/precedents/388")
    .then((r) => {
      if (!r.ok) throw new Error("bad status");
      return r.json();
    })
    .then((p) => {
      els.apiStatus.textContent =
        "API: " + (p.status ? "ok (" + p.status + " for 388)" : "ok");
    })
    .catch(() => {
      els.apiStatus.textContent = "API: offline — start p1 on :4001";
    });

  renderDetail();
})();
