"""
SAP IM AI Precedent Nudge — Streamlit MVP demo
Self-contained (no Node servers required) for Streamlit Community Cloud hosting.
"""

from __future__ import annotations

import streamlit as st

st.set_page_config(
    page_title="Incident Precedent Nudge (MVP)",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- Demo data (mirrors p1/p3 sample states) ---

TASKS = [
    {
        "id": "t1",
        "title": "Review and Complete Incident for Incident ID 388",
        "incident_id": "388",
        "priority": "Medium",
        "status": "Ready",
        "due": "May 14, 2026",
        "allowed": True,
    },
    {
        "id": "t2",
        "title": "Review and complete investigation of Incident ID 390",
        "incident_id": "390",
        "priority": "Medium",
        "status": "Ready",
        "due": "May 15, 2026",
        "allowed": True,
    },
    {
        "id": "t3",
        "title": "Perform investigation step 'Root Causes Hierarchy' for Incident ID 391",
        "incident_id": "391",
        "priority": "Low",
        "status": "Ready",
        "due": "May 16, 2026",
        "allowed": True,
    },
    {
        "id": "t4",
        "title": "Approve purchase order 9001",
        "incident_id": None,
        "priority": "Low",
        "status": "Ready",
        "due": "—",
        "allowed": False,
    },
]

PRECEDENTS = {
    "388": {
        "state": "A",
        "matched_id": "347",
        "matched_number": "INC-2024-00347",
        "confidence": 0.5352,
        "summary": (
            "For reference: root cause noted as Guard rail missing on conveyor; "
            "action taken: Guard installed, verified 03 Mar 2025."
        ),
    },
    "390": {
        "state": "B",
        "false_dup_count": 2,
    },
    "391": {
        "state": "C",
    },
}

HISTORICAL = {
    "347": {
        "title": "Conveyor guard rail missing — Line B",
        "incident_number": "INC-2024-00347",
        "investigation_status": "Closed",
        "start_date": "",
        "end_date": "",
        "lead": "A. Manager",
        "major_root_cause": "Guard rail missing on conveyor",
        "comment": "",
    }
}

# --- Styles ---

st.markdown(
    """
<style>
  .block-container { padding-top: 1.2rem; max-width: 1100px; }
  .ai-panel {
    border-left: 4px solid #0070f2;
    background: #f5f9ff;
    padding: 0.85rem 1rem;
    border-radius: 0 0.35rem 0.35rem 0;
    margin: 0.75rem 0 1rem;
  }
  .ai-panel.warn {
    border-left-color: #e76500;
    background: #fff8f0;
  }
  .ai-panel.note {
    border-left-color: #788fa6;
    background: #f7f7f7;
  }
  .ai-badge {
    color: #0070f2;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ai-disclosure { color: #556b82; font-size: 0.82rem; margin: 0.35rem 0 0.55rem; }
  .meta-row { color: #556b82; font-size: 0.85rem; }
  .fiori-shell {
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem 1.25rem;
  }
  .inv-label { color: #6a6d70; }
  .inv-empty { border-bottom: 1px solid #d9d9d9; min-height: 1.2rem; }
</style>
""",
    unsafe_allow_html=True,
)


def init_state() -> None:
    if "view" not in st.session_state:
        st.session_state.view = "inbox"  # inbox | manage
    if "selected_task_id" not in st.session_state:
        st.session_state.selected_task_id = "t1"
    if "historical_id" not in st.session_state:
        st.session_state.historical_id = None


def selected_task():
    return next(t for t in TASKS if t["id"] == st.session_state.selected_task_id)


def render_precedent_panel(incident_id: str | None) -> None:
    if not incident_id or incident_id not in PRECEDENTS:
        return
    p = PRECEDENTS[incident_id]
    state = p["state"]

    if state == "A":
        st.markdown('<div class="ai-panel">', unsafe_allow_html=True)
        st.markdown('<div class="ai-badge">AI suggestion — historical precedent</div>', unsafe_allow_html=True)
        st.markdown(
            '<p class="ai-disclosure">AI-generated advisory content. Not a system-verified fact. Investigate independently.</p>',
            unsafe_allow_html=True,
        )
        st.markdown(
            f"This kind of incident has happened before. For reference, you may check "
            f"**{p['matched_number']}**."
        )
        st.caption(p["summary"])
        if st.button("Open matched incident in Manage Incidents", type="primary", key="open_match"):
            st.session_state.view = "manage"
            st.session_state.historical_id = p["matched_id"]
            st.rerun()
        st.caption("This suggestion does not fill category, root cause, or closure fields.")
        st.markdown("</div>", unsafe_allow_html=True)

    elif state == "B":
        st.markdown('<div class="ai-panel warn">', unsafe_allow_html=True)
        st.markdown('<div class="ai-badge">AI suggestion — historical precedent</div>', unsafe_allow_html=True)
        st.markdown(
            '<p class="ai-disclosure">AI-generated advisory content. Not a system-verified fact. Investigate independently.</p>',
            unsafe_allow_html=True,
        )
        st.markdown("### Possible false or duplicate report")
        st.write(
            f"This report resembles **{p['false_dup_count']}** past incident(s) at this location "
            "that were later closed as not valid or duplicate. Please verify the details before "
            "proceeding with investigation."
        )
        st.markdown("</div>", unsafe_allow_html=True)

    elif state == "C":
        st.markdown('<div class="ai-panel note">', unsafe_allow_html=True)
        st.markdown('<div class="ai-badge">AI suggestion — historical precedent</div>', unsafe_allow_html=True)
        st.markdown(
            '<p class="ai-disclosure">AI-generated advisory content. Not a system-verified fact. Investigate independently.</p>',
            unsafe_allow_html=True,
        )
        st.write("No similar past incidents found — this may be a new pattern.")
        st.markdown("</div>", unsafe_allow_html=True)


def render_inbox() -> None:
    st.title("My Inbox")
    st.caption("SAP EHS Incident Management — AI Precedent Nudge MVP demo")

    left, right = st.columns([0.95, 1.55], gap="large")

    with left:
        st.subheader("Incident Management (demo)")
        for t in TASKS:
            selected = t["id"] == st.session_state.selected_task_id
            label = t["title"]
            if st.button(
                label,
                key=f"task_{t['id']}",
                use_container_width=True,
                type="primary" if selected else "secondary",
            ):
                st.session_state.selected_task_id = t["id"]
                st.session_state.view = "inbox"
                st.session_state.historical_id = None
                st.rerun()
            st.caption(f"{t['priority']} · {t['status']} · Due {t['due']}")
        st.caption("List view unchanged — no precedent badges (MVP).")

    with right:
        task = selected_task()
        st.markdown(f"### {task['title']}")
        st.markdown("**Information** · Notes (0) · Attachments (0) · Related Links (0)")
        m1, m2, m3, m4 = st.columns(4)
        m1.markdown("**Source**  \nSAP_WFRT")
        m2.markdown(f"**Status**  \n{task['status']}")
        m3.markdown(f"**Priority**  \n{task['priority']}")
        m4.markdown(f"**Due**  \n{task['due']}")
        st.write(f"You were assigned to: {task['title']}")

        if task["allowed"] and task["incident_id"]:
            render_precedent_panel(task["incident_id"])
        elif not task["allowed"]:
            st.info("Non-incident task — precedent panel not shown (allow-list).")

        st.divider()
        c1, c2, c3, c4 = st.columns(4)
        c1.button("Show Log", disabled=True)
        c2.button("Claim", disabled=True)
        c3.button("Forward", disabled=True)
        c4.button("Open Task", type="primary", disabled=True)


def render_manage() -> None:
    hist_id = st.session_state.historical_id or "347"
    hist = HISTORICAL[hist_id]

    if st.button("← Back to My Inbox"):
        st.session_state.view = "inbox"
        st.session_state.historical_id = None
        st.rerun()

    st.markdown('<div class="fiori-shell">', unsafe_allow_html=True)
    st.markdown("**Incident ▾**")
    st.title(hist["title"])
    st.caption(
        "Check · Category ▾ · Classification · Regulations · Status ▾ · "
        "Create Investigation · Linked Objects · ⋯"
    )
    st.markdown("Details · Location ▾ · People ▾ · **Investigation** · Tasks · Reports · Documents")
    st.divider()
    st.subheader("Investigation")

    col_l, col_r = st.columns([1, 1.2])
    with col_l:
        st.markdown('<p class="inv-label">Investigation Status</p>', unsafe_allow_html=True)
        st.markdown('<p class="inv-label">Start Date</p>', unsafe_allow_html=True)
        st.markdown('<p class="inv-label">End Date</p>', unsafe_allow_html=True)
        st.markdown('<p class="inv-label">Investigation Lead</p>', unsafe_allow_html=True)
        st.write("")
        st.markdown('<p class="inv-label">Major Root Cause</p>', unsafe_allow_html=True)
        st.markdown('<p class="inv-label">Comment</p>', unsafe_allow_html=True)
    with col_r:
        st.write(hist["investigation_status"])
        if hist["start_date"]:
            st.write(hist["start_date"])
        else:
            st.markdown('<div class="inv-empty"></div>', unsafe_allow_html=True)
        if hist["end_date"]:
            st.write(hist["end_date"])
        else:
            st.markdown('<div class="inv-empty"></div>', unsafe_allow_html=True)
        st.write(hist["lead"])
        st.button("Open Investigation Details", type="secondary")
        st.write(hist["major_root_cause"] or "—")
        if hist["comment"]:
            st.write(hist["comment"])
        else:
            st.markdown('<div class="inv-empty"></div>', unsafe_allow_html=True)

    st.caption(f"Opened from precedent deep link → {hist['incident_number']} · Investigation")
    st.markdown("</div>", unsafe_allow_html=True)


def main() -> None:
    init_state()
    st.sidebar.markdown("### MVP demo")
    st.sidebar.write(
        "AI-Assisted Incident Precedent Nudge for SAP EHS IM "
        "(My Inbox teaser + Manage Incidents Investigation deep link)."
    )
    st.sidebar.info(
        "Advisory only — does not auto-fill RCA/category/closure. "
        "Hosted on Streamlit for always-on sharing."
    )
    if st.session_state.view == "manage":
        render_manage()
    else:
        render_inbox()


if __name__ == "__main__":
    main()
