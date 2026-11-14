/**
 * Inline "next step" suggestion chips.
 *
 * The assistant can end a message with a fenced code block tagged
 * `suggestions`:
 *
 * ```suggestions
 * [{"label":"确认，做第七步","prompt":"确认，做第七步"},{"label":"先改底稿","prompt":"先改底稿"}]
 * ```
 *
 * This module registers a renderer for that fence language in the
 * `conversation.chat.markdown.fence` client slot, so the raw block turns into
 * a row of clickable chips under the message. Clicking a chip submits its
 * `prompt` as the next user message (the same path the composer uses).
 *
 * @param {object} ctx - client plugin context (lazy service lookups).
 * @param {{ react: object, jsxRuntime: object }} runtime - React platform modules.
 */
export function suggestionChips(ctx, runtime) {
  try {
    var react = runtime.react;
    var jsx = runtime.jsxRuntime.jsx;
    var jsxs = runtime.jsxRuntime.jsxs;
    var CURRENT_KEY = "dsh.sessions.current";
    var MAX_ITEMS = 6;
    var attachAttempts = 0;
    var slotState = { found: false, registered: false, error: null, attempts: 0 };

    function getService(name) {
      try {
        return ctx === undefined || ctx === null || typeof ctx.get !== "function" ? undefined : ctx.get(name);
      } catch (error) {
        return undefined;
      }
    }

    function currentSessionId() {
      var sessions = getService("sessions");
      try {
        if (sessions !== undefined && sessions.list !== undefined && sessions.list.getSnapshot !== undefined) {
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
        }
      } catch (error) {
        /* fall through to persisted selection */
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

    /**
     * Parse the fence body into suggestion items.
     * @param {string} code - raw fence text.
     * @returns {Array<{label: string, prompt: string}>|null} parsed items, or null when invalid.
     */
    function parseSuggestions(code) {
      try {
        var data = JSON.parse(String(code === undefined || code === null ? "" : code));
        if (!Array.isArray(data)) return null;
        var items = [];
        for (var index = 0; index < data.length && items.length < MAX_ITEMS; index += 1) {
          var item = data[index];
          if (item === null || typeof item !== "object") continue;
          var label = typeof item.label === "string" ? item.label.trim() : "";
          var prompt = typeof item.prompt === "string" ? item.prompt.trim() : "";
          if (label.length === 0 || prompt.length === 0) continue;
          items.push({ label: label, prompt: prompt });
        }
        return items.length === 0 ? null : items;
      } catch (error) {
        return null;
      }
    }

    /**
     * Send one suggestion as the next user message.
     * @param {string} prompt - text submitted on click.
     * @returns {boolean} whether a submission path was found.
     */
    function sendPrompt(prompt) {
      var sessions = getService("sessions");
      var sessionId = currentSessionId();
      try {
        if (sessionId !== null && sessions !== undefined && typeof sessions.binding === "function") {
          var binding = sessions.binding(sessionId);
          var live = binding === undefined || binding === null ? undefined : binding.session;
          if (live !== undefined && live !== null && typeof live.prompt === "function") {
            var signal = typeof AbortController === "function" ? new AbortController().signal : undefined;
            var result = live.prompt([{ type: "text", text: prompt }], "queue", signal);
            if (result !== undefined && result !== null && typeof result.catch === "function") result.catch(function () {});
            return true;
          }
        }
      } catch (error) {
        console.error("[claude-workbench] suggestion prompt failed", error);
      }
      // Fallback: type into the composer and press Enter.
      try {
        var editor = document.querySelector('[contenteditable="true"]');
        if (editor === null) return false;
        editor.focus();
        var selection = window.getSelection();
        if (selection !== null) {
          var range = document.createRange();
          range.selectNodeContents(editor);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        document.execCommand("insertText", false, prompt);
        editor.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          })
        );
        return true;
      } catch (error) {
        console.error("[claude-workbench] composer fallback failed", error);
        return false;
      }
    }

    var SUGGESTION_LANGS = { suggestions: true, suggestion: true, chips: true, next: true, "next-steps": true };

    function fenceTakesOver(fence, items) {
      if (items === null) return false;
      var lang = typeof fence.lang === "string" ? fence.lang.trim().toLowerCase() : "";
      if (lang !== "") return SUGGESTION_LANGS[lang] === true;
      // The renderer can drop an unknown info string; fall back to content
      // detection only for fences that clearly contain our JSON pair shape.
      return true;
    }

    function SuggestionChips(props) {
      var fence = props === undefined || props === null ? {} : props;
      var ownerContent = fence.children;
      var items = parseSuggestions(fence.code);
      if (!fenceTakesOver(fence, items)) return ownerContent === undefined ? null : ownerContent;
      var state = react.useState(-1);
      var sentIndex = state[0];
      var setSentIndex = state[1];
      var lang = typeof fence.lang === "string" ? fence.lang.trim().toLowerCase() : "";
      if (lang !== "" && SUGGESTION_LANGS[lang] !== true) return ownerContent === undefined ? null : ownerContent;
      var children = [];
      for (var index = 0; index < items.length; index += 1) {
        children.push(renderChip(items[index], index, sentIndex, setSentIndex));
      }
      return jsx("div", {
        className: "dsh-suggestions",
        "data-sent": sentIndex >= 0 ? "1" : "0",
        children: children
      });
    }

    function renderChip(item, index, sentIndex, setSentIndex) {
      var primary = index === 0;
      return jsx(
        "button",
        {
          type: "button",
          className: primary ? "dsh-suggestion dsh-suggestion-primary" : "dsh-suggestion",
          title: item.prompt,
          onClick: function (event) {
            if (event !== undefined) {
              event.preventDefault();
              event.stopPropagation();
            }
            if (sentIndex >= 0) return;
            setSentIndex(sendPrompt(item.prompt) ? index : -2);
          },
          children: primary
            ? jsxs("span", {
                className: "dsh-suggestion-content",
                children: [
                  jsx("span", { className: "dsh-suggestion-label", children: item.label }),
                  jsx("span", { className: "dsh-suggestion-hint", children: "⌘↵" })
                ]
              })
            : jsx("span", { className: "dsh-suggestion-label", children: item.label })
        },
        item.label + "#" + index
      );
    }

    function attachSlot() {
      var slots;
      try {
        slots = ctx !== undefined && ctx !== null && ctx.slots !== undefined ? ctx.slots : getService("slots");
      } catch (error) {
        slots = undefined;
      }
      slotState.found = slots !== undefined && slots !== null;
      if (slots === undefined || slots === null || typeof slots.inject !== "function") {
        attachAttempts += 1;
        slotState.attempts = attachAttempts;
        if (attachAttempts < 150) setTimeout(attachSlot, 200);
        return;
      }
      try {
        slots.inject("conversation.chat.markdown.fence", function () {
          return slots.register(
            {
              name: "conversation.chat.markdown.fence",
              id: "dsh-claude-workbench/fence/suggestions"
            },
            SuggestionChips
          );
        });
        slotState.registered = true;
      } catch (error) {
        slotState.error = String(error && error.message ? error.message : error);
        console.error("[claude-workbench] suggestion slot registration failed", error);
      }
    }

    try {
      globalThis.__dshPanesSuggestions = {
        parse: parseSuggestions,
        send: sendPrompt,
        state: function () {
          return { found: slotState.found, registered: slotState.registered, error: slotState.error, attempts: slotState.attempts };
        }
      };
    } catch (error) {
      /* debug hook is optional */
    }

    attachSlot();
  } catch (error) {
    console.error("[claude-workbench] suggestion chips initialization failed", error);
  }
}
