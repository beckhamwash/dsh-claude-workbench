/**
 * dsh-panes UI (shared by the generated client bundle).
 *
 * Runs in a top-level Web GUI document and provides two things:
 *  - Split view: 2–3 same-origin frames that each behave like an extra GUI client
 *    (independent session view, shared Host / auth / theme);
 *  - 旁聊 (side chat): a docked right-hand panel whose frame boots a fresh
 *    fork of the current session, so context is inherited but the main
 *    conversation is not disturbed.
 *
 * @param {{ streamBaseUrl: string, injections: unknown[] }} boot - boot payload
 *   fetched from the Host-side `/dsh-panes/boot` route.
 * @param {object} ctx - client plugin context (lazy service lookups only).
 */
export function panesUi(boot, ctx) {
  try {
    if (window.self !== window.top) return;
    var protocol = location.protocol;
    if (protocol !== "dsh-app:" && protocol !== "http:" && protocol !== "https:") return;
    if (boot === undefined || boot === null || !Array.isArray(boot.injections)) return;
    var context = ctx === undefined || ctx === null ? {} : ctx;

    var scriptOpen = "<" + "script>";
    var scriptClose = "<" + "/" + "script>";
    var bootJson = JSON.stringify(boot).replace(/</g, "\\u003c");
    var baseHref = document.baseURI;
    var CURRENT_KEY = "dsh.sessions.current";

    function absolute(element, attribute) {
      try {
        return new URL(element.getAttribute(attribute), document.baseURI).href;
      } catch (error) {
        return null;
      }
    }

    var styles = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
      .map(function (element) { return absolute(element, "href"); })
      .filter(Boolean);
    var preloads = Array.from(document.querySelectorAll('link[rel="modulepreload"][href]'))
      .map(function (element) { return absolute(element, "href"); })
      .filter(Boolean);
    var modules = Array.from(document.querySelectorAll('script[type="module"][src]'))
      .map(function (element) { return absolute(element, "src"); })
      .filter(Boolean);

    function frameDocumentHtml(extraSeed) {
      return (
        "<!doctype html><html><head><meta charset=\"utf-8\">" +
        "<base href=\"" + baseHref + "\">" +
        scriptOpen + "globalThis.__DSH_BOOT_READY__ = Promise.withResolvers()" + scriptClose +
        (extraSeed === undefined ? "" : scriptOpen + extraSeed + scriptClose) +
        styles.map(function (href) { return "<link rel=\"stylesheet\" href=\"" + href + "\">"; }).join("") +
        "</head><body><div id=\"root\"></div>" +
        scriptOpen +
        "globalThis.__DSH_PANES_BOOT__ = " + bootJson + ";" +
        "globalThis.dshDesktopBoot = {" +
        " ready: function () { return Promise.resolve(globalThis.__DSH_PANES_BOOT__); }," +
        " failed: function (error) { console.error('[dsh-panes]', error); }" +
        "};" +
        scriptClose +
        preloads.map(function (href) { return "<link rel=\"modulepreload\" href=\"" + href + "\">"; }).join("") +
        modules.map(function (href) {
          return "<" + "script type=\"module\" src=\"" + href + "\">" + "<" + "/" + "script>";
        }).join("") +
        "</body></html>"
      );
    }

    var documentHtml = frameDocumentHtml(undefined);

    var STYLE_ID = "dsh-panes-style";
    if (document.getElementById(STYLE_ID) !== null) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      '#dsh-panes-toggle{position:fixed;z-index:2147483001;right:14px;bottom:14px;display:flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3,#0002);background:var(--dsw-alias-button-elevated-fill,#fff);color:var(--dsw-alias-label-secondary,#555);font:500 12px/1 var(--dsw-font-family,system-ui);cursor:pointer;box-shadow:0 2px 10px #00000014}',
      '#dsh-panes-toggle:hover{background:var(--dsw-alias-interactive-bg-hover-solid,#f2efe7);color:var(--dsw-alias-label-primary,#111)}',
      '#dsh-panes{position:fixed;inset:0;z-index:2147483000;display:none;flex-direction:column;background:var(--dsw-alias-bg-base,#f6f4ec);font-family:var(--dsw-font-family,system-ui)}',
      '#dsh-panes[data-open="1"]{display:flex}',
      '.dsh-panes-bar{flex:none;height:38px;display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid var(--dsw-alias-border-l2,#0001);color:var(--dsw-alias-label-tertiary,#666);font-size:12px}',
      '.dsh-panes-bar .dsh-panes-title{font:600 13px/1 var(--dsw-font-family,system-ui);color:var(--dsw-alias-label-primary,#111)}',
      '.dsh-panes-bar .spacer{flex:1}',
      '.dsh-panes-bar button,.dsh-sidechat-bar button{height:24px;padding:0 10px;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary,#555);font:500 12px/1 var(--dsw-font-family,system-ui);cursor:pointer}',
      '.dsh-panes-bar button:hover,.dsh-sidechat-bar button:hover{background:var(--dsw-alias-interactive-bg-hover,#00000010)}',
      '.dsh-panes-bar button[data-active="1"]{background:var(--dsw-alias-interactive-bg-hover-solid,#efece2);border-color:var(--dsw-alias-border-l3,#0002);color:var(--dsw-alias-label-primary,#111)}',
      '.dsh-panes-row{flex:1;min-height:0;display:flex;gap:8px;padding:8px}',
      '.dsh-panes-pane{flex:1;min-width:0;display:flex;border-radius:12px;overflow:hidden;background:var(--dsw-alias-bg-base,#fcfcfb);box-shadow:0 0 0 .5px var(--dsw-alias-border-l3,#0002),0 8px 24px #00000010}',
      '.dsh-panes-pane iframe{flex:1;width:100%;height:100%;border:0;background:#fff}',
      '#dsh-sidechat{position:fixed;top:0;right:0;bottom:0;z-index:2147483000;display:none;flex-direction:column;width:var(--dsh-sidechat-width,min(46vw,680px));background:var(--dsw-alias-bg-base,#fbfaf6);border-left:1px solid var(--dsw-alias-border-l2,#0001);box-shadow:-8px 0 24px #00000010;font-family:var(--dsw-font-family,system-ui)}',
      '#dsh-sidechat[data-open="1"]{display:flex}',
      '.dsh-sidechat-bar{flex:none;height:38px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid var(--dsw-alias-border-l2,#0001);color:var(--dsw-alias-label-tertiary,#666);font-size:12px}',
      '.dsh-sidechat-bar .dsh-sidechat-title{font:600 13px/1 var(--dsw-font-family,system-ui);color:var(--dsw-alias-label-primary,#111)}',
      '.dsh-sidechat-bar .dsh-sidechat-meta{font:11px/1 var(--dsw-font-family-code,monospace);color:var(--dsw-alias-label-caption,#999);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}',
      '.dsh-sidechat-bar .spacer{flex:1}',
      '.dsh-sidechat-body{flex:1;min-height:0;position:relative}',
      '.dsh-sidechat-body iframe{width:100%;height:100%;border:0;background:#fff}',
      '.dsh-sidechat-grip{position:absolute;left:-3px;top:0;bottom:0;width:6px;cursor:col-resize;z-index:1}',
      '.dsh-sidechat-toast{position:absolute;left:12px;right:12px;top:12px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-state-error-tertiary,#fdece9);color:var(--dsw-alias-state-error-primary,#b42318);font-size:12px;line-height:1.5;display:none;z-index:2}',
      'body[data-dsh-sidechat="1"]{--dsh-sidechat-width:min(46vw,680px)}',
      'body[data-dsh-sidechat="1"] #root{width:calc(100% - var(--dsh-sidechat-width))}',
      '#dsh-panes-global-toast{position:fixed;z-index:2147483003;left:50%;bottom:56px;transform:translateX(-50%);display:none;max-width:min(560px,80vw);padding:9px 14px;border-radius:10px;background:var(--dsw-alias-toast-bg,#333);color:var(--dsw-alias-toast-label,#fff);font:500 12px/1.5 var(--dsw-font-family,system-ui);box-shadow:0 8px 24px #00000033}',
      '#dsh-panes-global-toast[data-show="1"]{display:block}',
      '#dsh-theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#555);cursor:pointer;flex:none}',
      '#dsh-theme-toggle:hover{background:var(--dsw-alias-interactive-bg-hover,#00000012);color:var(--dsw-alias-label-primary,#111)}',
      '#dsh-theme-toggle svg{width:15px;height:15px;pointer-events:none}',
      '#dsh-theme-menu{position:fixed;z-index:2147483002;display:none;min-width:168px;padding:4px;border-radius:10px;background:var(--dsw-menu-surface-fill,#fff);border:.5px solid var(--dsw-alias-border-l3,#0002);box-shadow:0 8px 24px #00000022,0 2px 6px #00000012;backdrop-filter:blur(20px);font-family:var(--dsw-font-family,system-ui)}',
      '#dsh-theme-menu[data-open="1"]{display:block}',
      '#dsh-theme-menu button{display:flex;align-items:center;gap:8px;width:100%;height:30px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary,#111);font:500 12px/1 var(--dsw-font-family,system-ui);cursor:pointer;text-align:left}',
      '#dsh-theme-menu button:hover{background:var(--dsw-alias-interactive-bg-hover,#00000012)}',
      '#dsh-theme-menu button svg{width:14px;height:14px;flex:none;color:var(--dsw-alias-label-secondary,#666)}',
      '#dsh-theme-menu .dsh-theme-check{width:14px;height:14px;flex:none;margin-left:auto;color:var(--dsw-alias-state-business-primary,#c6613f);visibility:hidden}',
      '#dsh-theme-menu button[data-active="1"] .dsh-theme-check{visibility:visible}',
      '#dsh-theme-menu .dsh-theme-sep{height:1px;margin:4px 6px;background:var(--dsw-alias-border-l2,#0001)}',
      '#dsh-theme-menu .dsh-theme-volume{display:flex;align-items:center;gap:8px;padding:2px 9px 7px;color:var(--dsw-alias-label-secondary,#555);font:500 12px/1 var(--dsw-font-family,system-ui)}',
      '#dsh-theme-menu .dsh-theme-volume-label{flex:none}',
      '#dsh-theme-menu .dsh-theme-volume input{flex:1;min-width:84px;height:14px;margin:0;accent-color:var(--dsw-alias-state-business-primary,#c6613f);cursor:pointer}',
      '#dsh-theme-menu .dsh-theme-volume-value{flex:none;width:38px;text-align:right;color:var(--dsw-alias-label-caption,#999);font-variant-numeric:tabular-nums}',
      '#dsh-sidechat-menu{position:fixed;z-index:2147483002;display:none;min-width:196px;padding:4px;border-radius:10px;background:var(--dsw-menu-surface-fill,#fff);border:.5px solid var(--dsw-alias-border-l3,#0002);box-shadow:0 8px 24px #00000022,0 2px 6px #00000012;backdrop-filter:blur(20px);font-family:var(--dsw-font-family,system-ui)}',
      '#dsh-sidechat-menu button{display:flex;align-items:center;gap:8px;width:100%;height:30px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary,#111);font:500 12px/1 var(--dsw-font-family,system-ui);cursor:pointer;text-align:left}',
      '#dsh-sidechat-menu button:hover{background:var(--dsw-alias-interactive-bg-hover,#00000012)}',
      '#dsh-sidechat-menu .dsh-ctx-icon{width:16px;text-align:center;color:var(--dsw-alias-label-tertiary,#888)}',
      '#dsh-suggestions,.dsh-suggestions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:12px 0 4px}',
      '.dsh-suggestions button{display:inline-flex;align-items:center;gap:8px;min-height:32px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,#0002);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#111);font:500 13px/1.2 var(--dsw-font-family,system-ui);cursor:pointer;transition:background .15s ease,border-color .15s ease,opacity .15s ease}',
      '.dsh-suggestions button:hover{background:var(--dsw-alias-interactive-bg-hover,#00000010);border-color:var(--dsw-alias-border-l2,#0003)}',
      '.dsh-suggestions button.dsh-suggestion-primary{background:var(--dsw-alias-label-primary,#141413);color:var(--dsw-alias-bg-base,#fbfaf6);border-color:transparent}',
      '.dsh-suggestions button.dsh-suggestion-primary:hover{background:var(--dsw-alias-label-primary,#141413);opacity:.92}',
      '.dsh-suggestions[data-sent="1"] button{opacity:.55;pointer-events:none}',
      '.dsh-suggestions .dsh-suggestion-hint{font:500 11px/1 var(--dsw-font-family-code,ui-monospace,SFMono-Regular,monospace);opacity:.6}'
    ].join("\n");
    document.head.appendChild(style);
    document.body.setAttribute("data-dsh-sidechat", "0");

    // ---------------------------------------------------------------- panes
    var overlay = document.createElement("div");
    overlay.id = "dsh-panes";
    overlay.innerHTML =
      '<div class="dsh-panes-bar">' +
      '<span class="dsh-panes-title">Split view</span>' +
      "<span>并排会话 · 每个面板里可以独立打开 / 切换不同会话</span>" +
      '<span class="spacer"></span>' +
      '<button type="button" data-count="2">2 栏</button>' +
      '<button type="button" data-count="3">3 栏</button>' +
      '<button type="button" data-close="1">退出 Split view</button>' +
      "</div>" +
      '<div class="dsh-panes-row"></div>';
    document.body.appendChild(overlay);
    var row = overlay.querySelector(".dsh-panes-row");

    var toggle = document.createElement("button");
    toggle.id = "dsh-panes-toggle";
    toggle.type = "button";
    toggle.textContent = "◫ Split view";
    toggle.title = "Split view：并排查看 2–3 个会话";
    toggle.setAttribute("aria-label", "Split view（并排会话）");
    toggle.addEventListener("click", function () { openPanes(2); });
    document.body.appendChild(toggle);

    function setRootVisible(visible) {
      var root = document.getElementById("root");
      if (root !== null) root.style.display = visible ? "" : "none";
    }

    function buildFrame() {
      var pane = document.createElement("div");
      pane.className = "dsh-panes-pane";
      var frame = document.createElement("iframe");
      frame.title = "Split view";
      pane.appendChild(frame);
      return { pane: pane, frame: frame };
    }

    function openPanes(count) {
      if (sideOpen) closeSideChat();
      var wanted = count === 3 ? 3 : 2;
      var active = row.children.length === wanted && row.getAttribute("data-built") === String(wanted);
      if (!active) {
        row.textContent = "";
        row.setAttribute("data-built", String(wanted));
        for (var index = 0; index < wanted; index += 1) {
          var built = buildFrame();
          row.appendChild(built.pane);
          try {
            var frameDocument = built.frame.contentDocument;
            if (frameDocument !== null) {
              frameDocument.open();
              frameDocument.write(documentHtml);
              frameDocument.close();
            }
          } catch (error) {
            console.error("[dsh-panes] pane boot failed", error);
          }
        }
      }
      Array.prototype.forEach.call(overlay.querySelectorAll("button[data-count]"), function (button) {
        button.setAttribute("data-active", button.getAttribute("data-count") === String(wanted) ? "1" : "0");
      });
      overlay.setAttribute("data-open", "1");
      toggle.style.display = "none";
      setRootVisible(false);
    }

    function closePanes() {
      overlay.setAttribute("data-open", "0");
      row.textContent = "";
      row.removeAttribute("data-built");
      toggle.style.display = "";
      setRootVisible(true);
    }

    overlay.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var button = target.closest("button");
      if (button === null) return;
      if (button.hasAttribute("data-close")) { closePanes(); return; }
      var count = Number(button.getAttribute("data-count"));
      if (count === 2 || count === 3) openPanes(count);
    });

    // ------------------------------------------------------------- side chat
    var sidePanel = document.createElement("div");
    sidePanel.id = "dsh-sidechat";
    sidePanel.innerHTML =
      '<div class="dsh-sidechat-bar">' +
      '<span class="dsh-sidechat-title">旁聊</span>' +
      '<span class="dsh-sidechat-meta"></span>' +
      '<span class="spacer"></span>' +
      '<button type="button" data-promote="1" title="把这个旁聊会话放到主对话区">在主对话打开</button>' +
      '<button type="button" data-side-close="1" title="关闭并归档这个旁聊会话">关闭</button>' +
      "</div>" +
      '<div class="dsh-sidechat-body"><div class="dsh-sidechat-toast"></div><div class="dsh-sidechat-grip"></div></div>';
    document.body.appendChild(sidePanel);
    var sideBody = sidePanel.querySelector(".dsh-sidechat-body");
    var sideFrame = null;
    var sideMeta = sidePanel.querySelector(".dsh-sidechat-meta");
    var sideToast = sidePanel.querySelector(".dsh-sidechat-toast");
    var sideGrip = sidePanel.querySelector(".dsh-sidechat-grip");

    var globalToast = document.createElement("div");
    globalToast.id = "dsh-panes-global-toast";
    document.body.appendChild(globalToast);

    var sideOpen = false;
    var sideSessionId = null;
    var sidePreviousSelection = null;
    var sideBusy = false;

    function showGlobalToast(message) {
      globalToast.textContent = message;
      globalToast.setAttribute("data-show", "1");
      clearTimeout(showGlobalToast.timer);
      showGlobalToast.timer = setTimeout(function () { globalToast.removeAttribute("data-show"); }, 6000);
    }

    function showSideToast(message) {
      if (!sideOpen) { showGlobalToast(message); return; }
      sideToast.textContent = message;
      sideToast.style.display = "block";
      clearTimeout(showSideToast.timer);
      showSideToast.timer = setTimeout(function () { sideToast.style.display = "none"; }, 6000);
    }

    function getService(name) {
      try {
        return context.get === undefined ? undefined : context.get(name);
      } catch (error) {
        return undefined;
      }
    }

    function currentSessionId() {
      var sessions = getService("sessions");
      if (sessions !== undefined && sessions.list !== undefined && sessions.list.getSnapshot !== undefined) {
        try {
          var list = sessions.list.getSnapshot();
          var byId = (list && list.byId) || {};
          var ids = Object.keys(byId);
          for (var index = 0; index < ids.length; index += 1) {
            var summary = byId[ids[index]];
            var retained = summary && summary.retainedBy;
            if (retained !== undefined && retained !== null && (retained.mainView || 0) > 0) {
              return summary.id !== undefined ? summary.id : summary.sessionId;
            }
          }
        } catch (error) {
          console.error("[dsh-panes] read current session failed", error);
        }
      }
      try {
        var raw = localStorage.getItem(CURRENT_KEY);
        if (raw !== null) {
          var parsed = JSON.parse(raw);
          if (parsed !== null && typeof parsed === "object" && typeof parsed.sessionId === "string") return parsed.sessionId;
        }
      } catch (error) {
        /* ignore malformed persisted selection */
      }
      return null;
    }

    function rememberSelectionRestore(previous) {
      sidePreviousSelection = previous;
    }

    function restoreSelection() {
      var previous = sidePreviousSelection;
      if (previous === undefined) return;
      try {
        if (previous === null) localStorage.removeItem(CURRENT_KEY);
        else localStorage.setItem(CURRENT_KEY, previous);
      } catch (error) {
        /* ignore storage failures */
      }
    }

    function restoreAfterBoot(frame, previous) {
      var started = Date.now();
      var timer = setInterval(function () {
        var booted = false;
        try {
          var documentRoot = frame.contentDocument !== null ? frame.contentDocument.getElementById("root") : null;
          booted = documentRoot !== null && documentRoot !== undefined && documentRoot.childElementCount > 0;
        } catch (error) {
          booted = true;
        }
        var expired = Date.now() - started > 15000;
        if (!booted && !expired) return;
        clearInterval(timer);
        setTimeout(function () {
          try {
            if (previous === null) localStorage.removeItem(CURRENT_KEY);
            else localStorage.setItem(CURRENT_KEY, previous);
          } catch (error) {
            /* ignore storage failures */
          }
          try {
            var bootedDocument = frame.contentDocument;
            var editor = bootedDocument === null ? null : bootedDocument.querySelector('[contenteditable="true"], textarea');
            if (editor !== null) {
              editor.focus();
              if (bootedDocument.getSelection !== undefined && editor.isContentEditable) {
                var caret = bootedDocument.createRange();
                caret.selectNodeContents(editor);
                caret.collapse(false);
                var frameSelection = bootedDocument.getSelection();
                frameSelection.removeAllRanges();
                frameSelection.addRange(caret);
              }
            }
          } catch (error) {
            /* focus is best effort */
          }
        }, booted ? 900 : 0);
      }, 250);
    }

    function quoteSelection(text) {
      var lines = String(text).split(/\r?\n/);
      return lines.map(function (line) { return line.length === 0 ? ">" : "> " + line; }).join("\n") + "\n\n";
    }

    function seedSideDraft(childId, text) {
      try {
        var key = "dsh.conversation." + childId;
        var existing = null;
        try { existing = JSON.parse(localStorage.getItem(key) || "null"); } catch (error) { existing = null; }
        var state = existing !== null && typeof existing === "object" ? existing : { draft: { text: "", references: [] }, view: null, viewRequest: null };
        state.draft = { text: quoteSelection(text), references: [] };
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.warn("[dsh-panes] seed side draft failed", error);
      }
    }

    function writeSideFrame(previous) {
      if (sideFrame === null) return;
      try {
        var frameDocument = sideFrame.contentDocument;
        if (frameDocument === null) return;
        frameDocument.open();
        frameDocument.write(documentHtml);
        frameDocument.close();
      } catch (error) {
        console.error("[dsh-panes] side chat boot failed", error);
        showSideToast("旁聊加载失败：" + String(error));
      }
      restoreAfterBoot(sideFrame, previous);
    }

    async function openSideChat(options) {
      var seed = options !== undefined && options !== null && typeof options.seed === "string" ? options.seed : "";
      if (sideOpen) { closeSideChat(); return; }
      if (sideBusy) return;
      if (overlay.getAttribute("data-open") === "1") closePanes();
      var uiWorkspace = getService("uiWorkspace");
      var sourceId = currentSessionId();
      if (uiWorkspace === undefined || typeof uiWorkspace.forkSession !== "function") {
        showGlobalToast("旁聊暂不可用：客户端 workspace 服务未就绪。");
        return;
      }
      if (sourceId === null) {
        showGlobalToast("旁聊需要一个已打开的会话。");
        return;
      }
      sideBusy = true;
      try {
        var childId = await uiWorkspace.forkSession(sourceId);
        if (typeof childId !== "string" || childId === "") {
          throw new Error("fork 没有返回会话 id");
        }
        var previous = null;
        try { previous = localStorage.getItem(CURRENT_KEY); } catch (error) { previous = null; }
        try { localStorage.setItem(CURRENT_KEY, JSON.stringify({ sessionId: childId })); } catch (error) { /* ignore */ }
        rememberSelectionRestore(previous);
        if (seed.trim().length > 0) seedSideDraft(childId, seed.slice(0, 8000));
        sideSessionId = childId;
        sideMeta.textContent = childId.replace(/^session-/, "").slice(0, 12);
        sideOpen = true;
        sidePanel.setAttribute("data-open", "1");
        document.body.setAttribute("data-dsh-sidechat", "1");
        toggle.style.display = "none";
        if (sideFrame !== null) sideFrame.remove();
        sideFrame = document.createElement("iframe");
        sideFrame.title = "旁聊";
        sideBody.appendChild(sideFrame);
        writeSideFrame(previous);
      } catch (error) {
        var message = String(error && error.message ? error.message : error);
        var friendly = message.indexOf("fork-unavailable") >= 0 ? "当前会话还没有已完成的轮次（或正在运行），旁聊需要从已完成的对话分叉。" : message;
        showGlobalToast("旁聊创建失败：" + friendly);
        console.error("[dsh-panes] side chat fork failed", error);
      } finally {
        sideBusy = false;
      }
    }

    function closeSideChat(keepSession) {
      if (!sideOpen) return;
      var archivedId = keepSession === true ? null : sideSessionId;
      if (archivedId !== null) {
        var workspaceService = getService("uiWorkspace");
        if (workspaceService !== undefined && typeof workspaceService.archiveSession === "function") {
          Promise.resolve(workspaceService.archiveSession(archivedId)).catch(function (error) {
            console.warn("[dsh-panes] side chat archive failed", error);
          });
        }
      }
      sideOpen = false;
      sideSessionId = null;
      sidePanel.setAttribute("data-open", "0");
      document.body.setAttribute("data-dsh-sidechat", "0");
      if (sideFrame !== null) {
        sideFrame.remove();
        sideFrame = null;
      }
      restoreSelection();
      var panesOpen = overlay.getAttribute("data-open") === "1";
      toggle.style.display = panesOpen ? "none" : "";
    }

    sidePanel.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var button = target.closest("button");
      if (button === null) return;
      if (button.hasAttribute("data-side-close")) { closeSideChat(); return; }
      if (button.hasAttribute("data-promote") && sideSessionId !== null) {
        var uiWorkspace = getService("uiWorkspace");
        if (uiWorkspace !== undefined && typeof uiWorkspace.openSession === "function") {
          uiWorkspace.openSession(sideSessionId);
          closeSideChat(true);
        }
      }
    });

    // ------------------------------------------- selection → "在旁聊中提问"
    var selectionMenu = document.createElement("div");
    selectionMenu.id = "dsh-sidechat-menu";
    selectionMenu.innerHTML =
      '<button type="button" data-act="sidechat"><span class="dsh-ctx-icon">◧</span><span>在旁聊中提问</span></button>' +
      '<button type="button" data-act="copy"><span class="dsh-ctx-icon">⧉</span><span>复制</span></button>';
    document.body.appendChild(selectionMenu);
    var pendingSelection = "";

    function hideSelectionMenu() {
      selectionMenu.style.display = "none";
      pendingSelection = "";
    }

    function showSelectionMenu(x, y) {
      selectionMenu.style.display = "block";
      var rect = selectionMenu.getBoundingClientRect();
      var left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8));
      var top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8));
      selectionMenu.style.left = left + "px";
      selectionMenu.style.top = top + "px";
    }

    function insideConversation(node) {
      var element = node instanceof Element ? node : node !== null && node !== undefined && node.parentElement ? node.parentElement : null;
      return element !== null && element.closest('[data-conversation-scroll]') !== null;
    }

    document.addEventListener("contextmenu", function (event) {
      try {
        var target = event.target;
        if (target instanceof Element && target.closest("#dsh-sidechat, #dsh-panes, #dsh-sidechat-menu") !== null) return;
        var selection = window.getSelection();
        var text = selection === null ? "" : selection.toString().trim();
        if (text.length === 0 && selection !== null && selection.rangeCount > 0) {
          try { text = selection.getRangeAt(0).toString().trim(); } catch (error) { text = ""; }
        }
        if (text.length === 0) return;
        if (!insideConversation(target)) return;
        pendingSelection = text.slice(0, 8000);
        event.preventDefault();
        showSelectionMenu(event.clientX, event.clientY);
      } catch (error) {
        console.error("[dsh-panes] selection menu failed", error);
      }
    }, true);

    document.addEventListener("mousedown", function (event) {
      if (selectionMenu.style.display !== "block") return;
      var target = event.target;
      if (target instanceof Element && target.closest("#dsh-sidechat-menu") !== null) return;
      hideSelectionMenu();
    }, true);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") hideSelectionMenu();
    }, true);
    window.addEventListener("scroll", hideSelectionMenu, true);
    window.addEventListener("blur", hideSelectionMenu);

    selectionMenu.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var button = target.closest("button");
      if (button === null) return;
      var action = button.getAttribute("data-act");
      var text = pendingSelection;
      hideSelectionMenu();
      if (action === "copy") {
        try {
          if (navigator.clipboard !== undefined) navigator.clipboard.writeText(text).catch(function () {});
        } catch (error) {
          /* clipboard unavailable */
        }
        return;
      }
      if (action === "sidechat") openSideChat({ seed: text });
    });

    var dragState = null;
    sideGrip.addEventListener("pointerdown", function (event) {
      dragState = { startX: event.clientX, startWidth: sidePanel.getBoundingClientRect().width };
      try { sideGrip.setPointerCapture(event.pointerId); } catch (error) { /* ignore */ }
    });
    sideGrip.addEventListener("pointermove", function (event) {
      if (dragState === null) return;
      var width = Math.min(Math.max(dragState.startWidth + (dragState.startX - event.clientX), 360), Math.round(window.innerWidth * 0.7));
      document.body.style.setProperty("--dsh-sidechat-width", width + "px");
    });
    sideGrip.addEventListener("pointerup", function () { dragState = null; });
    sideGrip.addEventListener("pointercancel", function () { dragState = null; });
    // ------------------------------------- top-right light/dark quick switch
    var THEME_ICONS = {
      system:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1.6" y="2.6" width="12.8" height="8.4" rx="1.4"/><path d="M5.4 13.4h5.2M8 11v2.4"/></svg>',
      light:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="8" cy="8" r="3.1"/><path d="M8 1.2v1.7M8 13.1v1.7M1.2 8h1.7M13.1 8h1.7M3.2 3.2l1.2 1.2M11.6 11.6l1.2 1.2M12.8 3.2l-1.2 1.2M4.4 11.6l-1.2 1.2"/></svg>',
      dark:
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.4 9.6A5.9 5.9 0 0 1 6.4 2.6 6 6 0 1 0 13.4 9.6Z"/></svg>'
    };

    var SOUND_ICON =
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11V7a4 4 0 0 1 8 0v4l1.2 1.6H2.8L4 11Z"/><path d="M6.2 13.2a1.9 1.9 0 0 0 3.6 0"/></svg>';

    var themeButton = document.createElement("button");
    themeButton.id = "dsh-theme-toggle";
    themeButton.type = "button";
    themeButton.title = "切换外观：跟随系统 / 浅色 / 深色";
    themeButton.setAttribute("aria-label", "切换外观");
    themeButton.innerHTML = THEME_ICONS.system;

    var themeMenu = document.createElement("div");
    themeMenu.id = "dsh-theme-menu";
    themeMenu.innerHTML =
      '<button type="button" data-pref="system"><span class="dsh-theme-icon"></span><span>跟随系统</span><span class="dsh-theme-check">✓</span></button>' +
      '<button type="button" data-pref="light"><span class="dsh-theme-icon"></span><span>浅色</span><span class="dsh-theme-check">✓</span></button>' +
      '<button type="button" data-pref="dark"><span class="dsh-theme-icon"></span><span>深色</span><span class="dsh-theme-check">✓</span></button>' +
      '<div class="dsh-theme-sep"></div>' +
      '<button type="button" data-sound="1"><span class="dsh-theme-icon">' + SOUND_ICON + '</span><span>完成提示音</span><span class="dsh-theme-check">✓</span></button>' +
      '<div class="dsh-theme-volume"><span class="dsh-theme-volume-label">音量</span><input id="dsh-theme-volume" type="range" min="0" max="250" step="10" aria-label="完成提示音音量"><span class="dsh-theme-volume-value"></span></div>';
    document.body.appendChild(themeMenu);
    var themeMenuItems = Array.prototype.slice.call(themeMenu.querySelectorAll("button[data-pref]"));
    themeMenuItems.forEach(function (button) {
      var icon = button.querySelector(".dsh-theme-icon");
      if (icon !== null) icon.innerHTML = THEME_ICONS[button.getAttribute("data-pref")] || "";
    });

    // ------------------------------------------ completion sound (turn finished)
    var CHIME_KEY = "dsh-workbench.completion-sound";
    var CHIME_VOLUME_KEY = "dsh-workbench.chime-volume";
    var chimeEnabled = true;
    try { if (localStorage.getItem(CHIME_KEY) === "0") chimeEnabled = false; } catch (error) { /* ignore */ }
    var chimeVolume = 1.5;
    try {
      var storedChimeVolumeRaw = localStorage.getItem(CHIME_VOLUME_KEY);
      if (storedChimeVolumeRaw !== null && storedChimeVolumeRaw !== "") {
        var storedChimeVolume = Number(storedChimeVolumeRaw);
        if (Number.isFinite(storedChimeVolume) && storedChimeVolume >= 0 && storedChimeVolume <= 2.5) chimeVolume = storedChimeVolume;
      }
    } catch (error) {
      /* ignore */
    }
    var chimeLog = [];
    var chimeAttachAttempts = 0;
    var chimeUnsubscribe = null;
    var chimeAudioContext = null;
    var chimeLastPlayedAt = 0;
    var chimePreviousRunning = new Map();
    var soundButton = themeMenu.querySelector("button[data-sound]");
    var volumeInput = themeMenu.querySelector("#dsh-theme-volume");
    var volumeValueLabel = themeMenu.querySelector(".dsh-theme-volume-value");

    function refreshVolumeControl() {
      var percent = Math.round(chimeVolume * 100);
      if (volumeInput !== null) volumeInput.value = String(percent);
      if (volumeValueLabel !== null) volumeValueLabel.textContent = percent + "%";
    }

    refreshVolumeControl();
    if (volumeInput !== null) {
      var volumePreviewTimer = null;
      volumeInput.addEventListener("input", function () {
        var nextVolume = Number(volumeInput.value) / 100;
        if (!Number.isFinite(nextVolume)) return;
        chimeVolume = Math.max(0, Math.min(2.5, nextVolume));
        try { localStorage.setItem(CHIME_VOLUME_KEY, String(chimeVolume)); } catch (error) { /* ignore */ }
        refreshVolumeControl();
        if (chimeEnabled) {
          clearTimeout(volumePreviewTimer);
          volumePreviewTimer = setTimeout(function () { playCompletionChime(); }, 350);
        }
      });
    }

    function ensureChimeAudio() {
      try {
        var AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (AudioCtor === undefined) return null;
        if (chimeAudioContext === null) chimeAudioContext = new AudioCtor();
        if (chimeAudioContext.state === "suspended" && typeof chimeAudioContext.resume === "function") {
          chimeAudioContext.resume().catch(function () { /* waits for the next user gesture */ });
        }
        return chimeAudioContext;
      } catch (error) {
        return null;
      }
    }

    function playCompletionChime() {
      chimeLog.push(Date.now());
      if (chimeLog.length > 50) chimeLog.shift();
      if (!chimeEnabled) return;
      var audio = ensureChimeAudio();
      if (audio === null) return;
      try {
        var start = audio.currentTime + 0.01;
        var master = audio.createGain();
        master.gain.value = chimeVolume;
        master.connect(audio.destination);
        function tone(frequency, offset, duration, peak, type) {
          var oscillator = audio.createOscillator();
          var gain = audio.createGain();
          oscillator.type = type === undefined ? "sine" : type;
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0.0001, start + offset);
          gain.gain.exponentialRampToValueAtTime(peak, start + offset + 0.006);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
          oscillator.connect(gain);
          gain.connect(master);
          oscillator.start(start + offset);
          oscillator.stop(start + offset + duration + 0.03);
        }
        tone(1046.5, 0, 0.34, 0.16, "sine");
        tone(1567.98, 0.07, 0.3, 0.11, "sine");
        tone(3135.96, 0.07, 0.14, 0.03, "sine");
      } catch (error) {
        /* audio is best effort */
      }
    }

    function triggerCompletionChime() {
      var now = Date.now();
      if (now - chimeLastPlayedAt < 750) return;
      chimeLastPlayedAt = now;
      playCompletionChime();
    }

    function isSubagentChimeSession(sessionId) {
      try {
        var sessions = getService("sessions");
        if (sessions === undefined || sessions.list === undefined || sessions.list.getSnapshot === undefined) return false;
        var row = (sessions.list.getSnapshot().byId || {})[sessionId];
        return row !== undefined && row !== null && row.subagent !== undefined && row.subagent !== null;
      } catch (error) {
        return false;
      }
    }

    function onSessionRunningChanged(sessionId, running) {
      var value = chimePreviousRunning.get(sessionId) === true;
      chimePreviousRunning.set(sessionId, running);
      if (!value || running) return;
      if (isSubagentChimeSession(sessionId)) return;
      triggerCompletionChime();
    }

    function installCompletionChime() {
      var uiSession = getService("uiSession");
      var status = uiSession === undefined || uiSession === null ? undefined : uiSession.sessionStatus;
      if (status === undefined || status === null || typeof status.subscribe !== "function") {
        chimeAttachAttempts += 1;
        if (chimeAttachAttempts < 100) setTimeout(installCompletionChime, 300);
        return;
      }
      try {
        var initial = status.getSnapshot();
        initial.forEach(function (value, id) {
          chimePreviousRunning.set(id, value !== undefined && value !== null && value.running === true);
        });
        chimeUnsubscribe = status.subscribe(function () {
          try {
            // Client stores notify subscribers without passing the snapshot; read it.
            var snapshot = status.getSnapshot();
            snapshot.forEach(function (value, id) {
              onSessionRunningChanged(id, value !== undefined && value !== null && value.running === true);
            });
          } catch (error) {
            /* ignore */
          }
        });
      } catch (error) {
        console.error("[claude-workbench] completion sound subscription failed", error);
      }
    }

    function toggleCompletionSound() {
      chimeEnabled = !chimeEnabled;
      try { localStorage.setItem(CHIME_KEY, chimeEnabled ? "1" : "0"); } catch (error) { /* ignore */ }
      if (chimeEnabled) {
        ensureChimeAudio();
        if (soundButton !== null) soundButton.setAttribute("data-active", "1");
        playCompletionChime();
      }
      refreshThemeButton();
    }

    function unlockChimeAudio() {
      ensureChimeAudio();
    }

    document.addEventListener("pointerdown", unlockChimeAudio, true);
    document.addEventListener("keydown", unlockChimeAudio, true);
    installCompletionChime();

    function themeService() {
      return getService("theme");
    }

    function currentThemePreference() {
      var service = themeService();
      try {
        if (service !== undefined && typeof service.getTheme === "function") {
          var snapshot = service.getTheme();
          if (snapshot !== null && snapshot !== undefined && typeof snapshot.preference === "string") return snapshot.preference;
        }
      } catch (error) {
        /* fall through */
      }
      return "system";
    }

    function effectiveScheme() {
      return document.body.hasAttribute("data-ds-dark-theme") ? "dark" : "light";
    }

    function refreshThemeButton() {
      var preference = currentThemePreference();
      var iconKey = preference === "light" || preference === "dark" ? preference : "system";
      themeButton.innerHTML = THEME_ICONS[iconKey];
      themeButton.setAttribute("data-preference", preference);
      themeButton.title = "当前：" + (preference === "system" ? "跟随系统（" + (effectiveScheme() === "dark" ? "深色" : "浅色") + "）" : preference === "dark" ? "深色" : "浅色") + " · 点击切换";
      themeMenuItems.forEach(function (button) {
        button.setAttribute("data-active", button.getAttribute("data-pref") === preference ? "1" : "0");
      });
      if (soundButton !== null) {
        soundButton.setAttribute("data-active", chimeEnabled ? "1" : "0");
        soundButton.title = chimeEnabled ? "完成提示音：开（点击关闭）" : "完成提示音：关（点击开启）";
      }
    }

    function closeThemeMenu() {
      themeMenu.removeAttribute("data-open");
    }

    function openThemeMenu() {
      refreshThemeButton();
      var rect = themeButton.getBoundingClientRect();
      themeMenu.setAttribute("data-open", "1");
      var menuRect = themeMenu.getBoundingClientRect();
      var left = Math.min(Math.max(rect.right - menuRect.width, 8), window.innerWidth - menuRect.width - 8);
      var top = Math.min(rect.bottom + 6, window.innerHeight - menuRect.height - 8);
      themeMenu.style.left = left + "px";
      themeMenu.style.top = top + "px";
    }

    themeButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (themeMenu.getAttribute("data-open") === "1") closeThemeMenu();
      else openThemeMenu();
    });

    themeMenu.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("button[data-sound]") !== null) {
        toggleCompletionSound();
        return;
      }
      var button = target.closest("button[data-pref]");
      if (button === null) return;
      var preference = button.getAttribute("data-pref");
      var service = themeService();
      closeThemeMenu();
      if (service === undefined || typeof service.setTheme !== "function") {
        showGlobalToast("外观切换暂不可用：主题服务未就绪。");
        return;
      }
      try {
        service.setTheme(preference);
      } catch (error) {
        showGlobalToast("外观切换失败：" + String(error && error.message ? error.message : error));
        return;
      }
      refreshThemeButton();
    });

    document.addEventListener("mousedown", function (event) {
      if (themeMenu.getAttribute("data-open") !== "1") return;
      var target = event.target;
      if (target instanceof Element && (target.closest("#dsh-theme-menu") !== null || target.closest("#dsh-theme-toggle") !== null)) return;
      closeThemeMenu();
    }, true);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeThemeMenu();
    }, true);
    window.addEventListener("scroll", closeThemeMenu, true);
    window.addEventListener("resize", closeThemeMenu);

    function mountThemeButton() {
      var host = document.querySelector("[data-conversation-header-corner]");
      if (host === null) {
        if (themeButton.parentElement !== null) themeButton.remove();
        return;
      }
      if (themeButton.parentElement !== host) host.insertBefore(themeButton, host.firstChild);
    }

    var themeMountTimer = setInterval(function () {
      try { mountThemeButton(); } catch (error) { /* ignore */ }
    }, 800);
    try { mountThemeButton(); } catch (error) { /* ignore */ }
    try { refreshThemeButton(); } catch (error) { /* ignore */ }

    try {
      if (typeof context.on === "function") {
        context.on("theme/change", function () {
          try { refreshThemeButton(); } catch (error) { /* ignore */ }
        });
      }
    } catch (error) {
      /* theme change subscription is best effort */
    }

    try {
      globalThis.__dshPanesTeardown = function () {
        try { clearInterval(themeMountTimer); } catch (error) { /* ignore */ }
        try { if (typeof chimeUnsubscribe === "function") chimeUnsubscribe(); } catch (error) { /* ignore */ }
        chimeUnsubscribe = null;
        document.removeEventListener("pointerdown", unlockChimeAudio, true);
        document.removeEventListener("keydown", unlockChimeAudio, true);
        try { if (chimeAudioContext !== null && typeof chimeAudioContext.close === "function") chimeAudioContext.close(); } catch (error) { /* ignore */ }
        chimeAudioContext = null;
        closeThemeMenu();
        if (themeButton.parentElement !== null) themeButton.remove();
        themeMenu.remove();
        globalToast.remove();
      };
    } catch (error) {
      /* teardown hook is optional */
    }

    try {
      globalThis.__dshPanes = {
        listSessions: function () {
          var sessions = getService("sessions");
          var list = sessions !== undefined && sessions.list !== undefined ? sessions.list.getSnapshot() : null;
          var byId = (list && list.byId) || {};
          return Object.keys(byId).map(function (id) {
            var row = byId[id] || {};
            return { id: id, title: row.title === undefined ? null : row.title, mainView: ((row.retainedBy || {}).mainView || 0) > 0 };
          });
        },
        archivedIds: function () {
          var workspaces = getService("workspaces");
          try {
            return workspaces.list.getSnapshot().archivedSessionIds || [];
          } catch (error) {
            return [];
          }
        },
        archiveSession: function (id) {
          var workspaceService = getService("uiWorkspace");
          return workspaceService.archiveSession(id);
        },
        playChime: playCompletionChime,
        chimeInfo: function () {
          return {
            enabled: chimeEnabled,
            attached: typeof chimeUnsubscribe === "function",
            volume: Math.round(chimeVolume * 100),
            log: chimeLog.slice()
          };
        },
        toggleChime: toggleCompletionSound
      };
    } catch (error) {
      /* debug hook is optional */
    }
  } catch (error) {
    console.error("[dsh-panes] initialization failed", error);
  }
}
