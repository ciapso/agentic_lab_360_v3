"use client";
import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";

const PROJECT_NAME = "AGENTIC-LAB-360-V2";
const PROMPT = `C:\\users\\siva_\\workspace\\${PROJECT_NAME}> `;

const TerminalClient = forwardRef(function TerminalClient(_, ref) {
  const termRef = useRef<HTMLDivElement>(null);

  let term: any;
  let fitAddon: any;
  let buffer = "";
  let isRunning = false;

  function showPrompt() {
    term?.write(`\x1b[1;32m${PROMPT}\x1b[0m`);
  }

  async function runCommand(cmd: string) {
    if (!cmd) return;
    term?.writeln(`\x1b[1;32m${PROMPT}\x1b[0m${cmd}`);
    const res = await fetch("/api/terminal", {
      method: "POST",
      body: JSON.stringify({ command: cmd, project: PROJECT_NAME }),
    });
    const data = await res.json();
    if (data.output) term?.writeln(data.output.replace(/\n$/, ""));
    if (data.error) term?.writeln(`\x1b[1;31m${data.error}\x1b[0m`);
    term?.writeln(`\x1b[1;34m[exit code: ${data.code}]\x1b[0m`);
  }

  async function handleEnter() {
    term.write("\r\n");
    isRunning = true;
    await runCommand(buffer.trim());
    buffer = "";
    isRunning = false;
    showPrompt();
  }

  useImperativeHandle(ref, () => ({
    runCommand: (cmd: string) => {
      if (term && !isRunning) {
        buffer = cmd;
        handleEnter();
      }
    },
  }));

  useEffect(() => {
    async function loadXterm() {
      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("xterm-addon-fit");
      await import("xterm/css/xterm.css");

      term = new Terminal({ fontSize: 14, theme: { background: "#1e1e1e" } });
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current!);
      fitAddon.fit();
      term.writeln("Welcome to the Deploy Terminal!");
      showPrompt();

      term.focus();

      term.onKey(async ({ key, domEvent }: any) => {
        if (isRunning) return;
        if (domEvent.key === "Enter") {
          handleEnter();
        } else if (domEvent.key === "Backspace") {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            term.write("\b \b");
          }
        } else if (domEvent.key.length === 1) {
          buffer += domEvent.key;
          term.write(domEvent.key);
        }
      });

      window.addEventListener("resize", () => fitAddon.fit());
    }

    loadXterm();

    return () => {
      term?.dispose();
      window.removeEventListener("resize", () => fitAddon?.fit());
    };
    // eslint-disable-next-line
  }, []);

  return <div ref={termRef} className="w-full h-full" style={{ height: "100%" }} />;
});

export default TerminalClient;