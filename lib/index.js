import { readFileSync } from "node:fs";

const SKIN_CSS = new URL("./skin.css", import.meta.url);
const BOOT_PATH = "/dsh-claude-workbench/boot";

/**
 * Host half of the Claude workbench.
 *
 * - pushes the skin stylesheet (token overrides + inlined fonts) into every
 *   Web GUI index response;
 * - serves the same index injection rows plus the transport base URL at
 *   `BOOT_PATH`, which the browser half uses to boot extra same-origin frames
 *   for the 2–3 pane view and the side chat.
 */
export function apply(ctx) {
  const css = readFileSync(SKIN_CSS, "utf8");

  ctx.on("webserver/index-inject", (table) => {
    table.push({ kind: "style", text: css });
  });

  ctx.inject(["webServer", "connection"], (child) => {
    const webServer = child.webServer;
    const connection = child.connection;

    child.effect(
      () =>
        webServer.register({
          kind: "exact",
          path: BOOT_PATH,
          resource: () => {
            try {
              const streamBaseUrl = `${webServer.protocol}//127.0.0.1:${String(webServer.port)}`;
              const injections = webServer.collectIndexInjections(connection.browserPeer);
              return new Response(JSON.stringify({ streamBaseUrl, injections }), {
                headers: {
                  "content-type": "application/json; charset=utf-8",
                  "cache-control": "no-store"
                }
              });
            } catch (error) {
              return new Response(JSON.stringify({ error: String(error) }), {
                status: 500,
                headers: { "content-type": "application/json; charset=utf-8" }
              });
            }
          }
        }),
      "claude-workbench: boot payload route"
    );
  });
}
