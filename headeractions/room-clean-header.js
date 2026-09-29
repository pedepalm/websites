const VARIABLES = [
  "globalRmCleanWorkItemData",
  "globalRmCleanWorkItemMsg",
  "globalRmCleanWorkItemAddr",
];

const DEFAULT_SUBMIT_URL = "https://pedepalm.netlify.app/.netlify/functions/room-clean";

class RoomCleanHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selectedTask = null;
    this._darkMode = false;
    this._menuOpen = false;
    this._modalOpen = false;
    this._fields = [];
    this._notices = [];
    this._status = "";
    this._submitting = false;
    this._submitted = false;
    this._onDocClick = (event) => {
      if (!this._menuOpen) return;
      const path = event.composedPath();
      if (!path.includes(this)) this._closeMenu();
    };
  }

  set selectedTask(value) {
    this._selectedTask = value;
  }

  get selectedTask() {
    return this._selectedTask;
  }

  set darkMode(value) {
    this._darkMode = value === true || value === "true";
    this._render();
  }

  get darkMode() {
    return this._darkMode;
  }

  connectedCallback() {
    this._render();
    document.addEventListener("click", this._onDocClick);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onDocClick);
  }

  _render() {
    const dark = this._darkMode ? "dark" : "";
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-flex; align-items: center; height: 64px; }
        button, input { font: inherit; }
        .actions {
          height: 32px;
          padding: 0 12px;
          border: 1px solid #c8c8c8;
          border-radius: 16px;
          background: #fff;
          color: #121212;
          cursor: pointer;
        }
        .menu {
          position: fixed;
          z-index: 10000;
          min-width: 180px;
          margin: 0;
          padding: 4px 0;
          list-style: none;
          background: #fff;
          color: #121212;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        }
        .menu button {
          display: block;
          width: 100%;
          padding: 8px 12px;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }
        .menu button:hover { background: #f2f2f2; }
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.45);
        }
        .dialog {
          width: min(640px, calc(100vw - 32px));
          max-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
          background: #fff;
          color: #121212;
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
        }
        .dialog header, .dialog footer { padding: 16px 20px; }
        .dialog header { border-bottom: 1px solid #e6e6e6; }
        .dialog h2 { margin: 0; font-size: 18px; }
        .body { overflow: auto; padding: 8px 12px 16px; }
        .row {
          display: grid;
          grid-template-columns: minmax(120px, 180px) minmax(0, 1fr) auto;
          gap: 8px;
          align-items: start;
          padding: 10px 8px;
          background: #fff;
        }
        .row.shade { background: rgba(0, 0, 0, 0.06); }
        .row strong { padding-top: 4px; }
        .value {
          min-width: 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          word-break: break-word;
          padding-top: 4px;
        }
        .row input, .row textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 6px 8px;
          border: 1px solid #bdbdbd;
          border-radius: 6px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          resize: vertical;
        }
        .icon {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 16px;
          background: transparent;
          cursor: pointer;
        }
        .notice, .status { margin: 8px 0 0; font-size: 13px; }
        .status.error { color: #a12512; }
        .status.ok { color: #0d6b2f; }
        footer { display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #e6e6e6; }
        .submit, .cancel {
          height: 36px;
          padding: 0 16px;
          border-radius: 18px;
          cursor: pointer;
        }
        .cancel { background: #fff; border: 1px solid #c8c8c8; }
        .submit { background: #0a6dd9; border: 0; color: #fff; }
        .submit:disabled { background: #9e9e9e; opacity: 0.7; cursor: default; }
        .icon:disabled { opacity: 0.35; cursor: default; }
        .dark .actions, .dark .dialog, .dark .menu { background: #1c1c1c; color: #f5f5f5; border-color: #3a3a3a; }
        .dark .menu button:hover { background: #2a2a2a; }
        .dark .row { background: #1c1c1c; }
        .dark .row.shade { background: rgba(255, 255, 255, 0.08); }
        .dark .row input, .dark .row textarea { background: #111; color: #f5f5f5; border-color: #555; }
      </style>
      <div class="${dark}">
        <button class="actions" type="button" aria-haspopup="menu" aria-expanded="${this._menuOpen}">Actions</button>
        <div class="mount"></div>
      </div>
    `;
    this.shadowRoot.querySelector(".actions").addEventListener("click", (event) => {
      event.stopPropagation();
      this._menuOpen ? this._closeMenu() : this._openMenu();
    });
    if (this._menuOpen) this._paintMenu();
    if (this._modalOpen) this._paintModal();
  }

  _openMenu() {
    this._menuOpen = true;
    this._render();
  }

  _closeMenu() {
    this._menuOpen = false;
    const menu = this.shadowRoot.querySelector(".menu");
    if (menu) menu.remove();
    const button = this.shadowRoot.querySelector(".actions");
    if (button) button.setAttribute("aria-expanded", "false");
  }

  _paintMenu() {
    const button = this.shadowRoot.querySelector(".actions");
    const mount = this.shadowRoot.querySelector(".mount");
    const rect = button.getBoundingClientRect();
    const menu = document.createElement("ul");
    menu.className = "menu";
    menu.setAttribute("role", "menu");
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${rect.left}px`;
    const item = document.createElement("li");
    const action = document.createElement("button");
    action.type = "button";
    action.setAttribute("role", "menuitem");
    action.textContent = "Room Clean";
    action.addEventListener("click", () => this._openRoomClean());
    item.appendChild(action);
    menu.appendChild(item);
    mount.replaceChildren(menu);
  }

  _openRoomClean() {
    this._closeMenu();
    const loaded = loadFields(this._selectedTask);
    this._fields = loaded.fields;
    this._notices = loaded.notices;
    this._status = "";
    this._submitted = false;
    this._modalOpen = true;
    this._paintModal();
  }

  _paintModal() {
    const mount = this.shadowRoot.querySelector(".mount");
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) this._closeModal();
    });

    const dialog = document.createElement("div");
    dialog.className = "dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-label", "Room Clean Notification");

    const header = document.createElement("header");
    const title = document.createElement("h2");
    title.textContent = "Room Clean Notification";
    header.appendChild(title);

    const body = document.createElement("div");
    body.className = "body";
    if (!this._fields.length) {
      const empty = document.createElement("p");
      empty.className = "notice";
      empty.textContent = this._selectedTask
        ? "No room clean details are available on this task."
        : "Room Clean is available only during a live interaction.";
      body.appendChild(empty);
    }
    this._fields.forEach((field, index) => body.appendChild(this._fieldRow(field, index)));
    if (this._status) {
      const status = document.createElement("p");
      status.className = `status ${this._status.ok ? "ok" : "error"}`;
      status.textContent = this._status.text;
      body.appendChild(status);
    }

    const footer = document.createElement("footer");
    const cancel = document.createElement("button");
    cancel.className = "cancel";
    cancel.type = "button";
    cancel.textContent = this._submitted ? "OK" : "Cancel";
    cancel.addEventListener("click", () => this._closeModal());
    const submit = document.createElement("button");
    submit.className = "submit";
    submit.type = "button";
    submit.textContent = this._submitting ? "Sending..." : this._submitted ? "Sent" : "Submit";
    submit.disabled = !this._canSubmit();
    submit.addEventListener("click", () => this._submit());
    footer.append(cancel, submit);

    dialog.append(header, body, footer);
    overlay.appendChild(dialog);
    mount.replaceChildren(overlay);
  }

  _fieldRow(field, index) {
    const row = document.createElement("div");
    row.className = index % 2 === 0 ? "row" : "row shade";
    const label = document.createElement("strong");
    label.textContent = field.key;
    const longText = field.key.toLowerCase() === "description" || field.value.length > 80;
    const value = document.createElement(field.editing ? (longText ? "textarea" : "input") : "span");
    value.className = "value";
    if (field.editing) {
      value.value = field.value;
      if (longText) value.rows = Math.min(8, Math.max(3, Math.ceil(field.value.length / 48)));
      value.addEventListener("input", () => {
        field.value = value.value;
      });
    } else {
      value.textContent = field.value;
    }
    const pencil = document.createElement("button");
    pencil.className = "icon";
    pencil.type = "button";
    pencil.setAttribute("aria-label", field.editing ? `Done editing ${field.key}` : `Edit ${field.key}`);
    pencil.textContent = field.editing ? "OK" : "✎";
    pencil.disabled = this._submitting || this._submitted;
    pencil.addEventListener("click", () => {
      field.editing = !field.editing;
      this._paintModal();
    });
    row.append(label, value, pencil);
    return row;
  }

  _closeModal() {
    this._modalOpen = false;
    const mount = this.shadowRoot.querySelector(".mount");
    if (mount) mount.replaceChildren();
  }

  _canSubmit() {
    return this._fields.length > 0 && !this._submitting && !this._submitted;
  }

  async _submit() {
    if (!this._canSubmit()) return;
    const payload = {};
    for (const field of this._fields) {
      field.editing = false;
      payload[field.key] = field.value;
    }
    this._submitting = true;
    this._status = "";
    this._paintModal();
    try {
      const response = await fetch(this.getAttribute("submit-url") || DEFAULT_SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Submit failed (${response.status})`);
      this._submitted = true;
      this._status = { ok: true, text: "Room Clean notification sent." };
    } catch (error) {
      const unreachable = !error.message || error.message === "Failed to fetch";
      this._status = {
        ok: false,
        text: unreachable
          ? "Could not reach the submit service. Publish the Netlify function, set WEBEX_CONNECT_EVENT_URL, and allow pedepalm.netlify.app on the Contact Center content security policy."
          : error.message,
      };
    } finally {
      this._submitting = false;
      this._paintModal();
    }
  }
}

function loadFields(task) {
  const cad = findCallAssociatedData(task);
  const fields = [];
  const notices = [];
  for (const name of VARIABLES) {
    const raw = lookupVariable(cad, name);
    if (raw == null || raw === "") {
      notices.push({ source: name, message: "This variable is empty on the current task." });
      continue;
    }
    const parsed = parseWorkItem(raw);
    if (!parsed.ok) {
      notices.push({ source: name, message: "This value is not valid JSON after removing escaped quotes." });
      continue;
    }
    const entries = Object.entries(parsed.value);
    if (!entries.length) {
      notices.push({ source: name, message: "This variable did not contain any fields." });
      continue;
    }
    for (const [key, value] of entries) {
      fields.push({
        source: name,
        key,
        value: value == null ? "" : String(value),
        editing: false,
      });
    }
  }
  return { fields, notices };
}

function parseWorkItem(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return { ok: true, value: raw };
  const text = String(raw).trim();
  const direct = tryParseObject(text);
  if (direct) return { ok: true, value: direct };
  const unescaped = tryParseObject(text.replace(/\\"/g, '"'));
  if (unescaped) return { ok: true, value: unescaped };
  return { ok: false, value: {} };
}

function tryParseObject(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch (_error) {
    return null;
  }
  return null;
}

function findCallAssociatedData(task) {
  if (!task || typeof task !== "object") return null;
  const candidates = [
    task.interaction && task.interaction.callAssociatedData,
    task.callAssociatedData,
    task.cad,
  ];
  return candidates.find((candidate) => candidate && typeof candidate === "object") || null;
}

function lookupVariable(cad, name) {
  if (!cad) return null;
  if (Array.isArray(cad)) {
    const match = cad.find((item) => item && (item.name === name || item.displayName === name));
    return match ? match.value : null;
  }
  if (Object.prototype.hasOwnProperty.call(cad, name)) {
    const entry = cad[name];
    if (entry && typeof entry === "object" && "value" in entry) return entry.value;
    return entry;
  }
  const found = Object.values(cad).find((item) => item && (item.name === name || item.displayName === name));
  return found ? found.value : null;
}

customElements.define("room-clean-header", RoomCleanHeader);
