import { spawn } from "node:child_process";

async function diagnose() {
  const chromeProcess = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--window-size=1280,850",
    "--autoplay-policy=no-user-gesture-required",
    "about:blank"
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error("No WS URL");
    chromeProcess.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let idCounter = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const newTarget = await sendCommand("Target.createTarget", { url: "http://localhost:5173/" });
  const targetId = newTarget.result.targetId;
  const sessionRes = await sendCommand("Target.attachToTarget", { targetId, flatten: true });
  const sessionId = sessionRes.result.sessionId;

  function sendSession(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  const consoleLogs = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled") {
      consoleLogs.push({
        type: msg.params.type,
        args: msg.params.args.map((a) => a.value || a.description || JSON.stringify(a))
      });
    }
    if (msg.method === "Runtime.exceptionThrown") {
      consoleLogs.push({
        type: "exception",
        details: msg.params.exceptionDetails
      });
    }
  });

  await sendSession("Page.enable");
  await sendSession("Runtime.enable");

  await new Promise((r) => setTimeout(r, 2000));

  console.log("Checking what happens on clicking play in quick access Columbia...");
  await sendSession("Runtime.evaluate", {
    expression: `
      (() => {
        const playBtn = document.querySelector('.bg-\\\\[\\\\#282828\\\\/60 button');
        if (playBtn) playBtn.click();
      })()
    `
  });

  await new Promise((r) => setTimeout(r, 3000));

  console.log("AudioEngine state in browser:");
  const stateRes = await sendSession("Runtime.evaluate", {
    expression: `
      (() => {
        return {
          windowYT: typeof window.YT,
          isYTReady: window.audioEngine?.isYTReady,
          isYouTube: window.audioEngine?.isYouTube,
          audioSrc: window.audioEngine?.audioElement?.src,
          audioPaused: window.audioEngine?.audioElement?.paused,
          audioError: window.audioEngine?.audioElement?.error ? {
            code: window.audioEngine.audioElement.error.code,
            message: window.audioEngine.audioElement.error.message
          } : null,
          engineState: window.audioEngine?.state
        };
      })()
    `,
    returnByValue: true
  });
  console.log(JSON.stringify(stateRes.result?.result?.value, null, 2));

  console.log("Console Logs Captured:");
  console.log(JSON.stringify(consoleLogs, null, 2));

  chromeProcess.kill();
  process.exit(0);
}

diagnose().catch(console.error);
