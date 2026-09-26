# Streamlit Community Cloud — always-on MVP host

This repo includes a **Streamlit** port of the Incident Precedent Nudge MVP so it can be hosted for free on [Streamlit Community Cloud](https://share.streamlit.io).

## Local run

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

## Deploy (permanent public link)

1. Open https://share.streamlit.io and sign in with GitHub (`Pratishtha25`).
2. **Create app** → Yup, I have an app.
3. Repository: `Pratishtha25/sap-im-ai-precedent-nudge`
4. Branch: `main`
5. Main file path: `streamlit_app.py`
6. Optional App URL: `sap-im-precedent-nudge` → https://sap-im-precedent-nudge.streamlit.app
7. Deploy. In app **Settings → Sharing**, set the app to **Public** so anyone can open it.

After deploy, share that `*.streamlit.app` URL — it stays up without your PC running.
