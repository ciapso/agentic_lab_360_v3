"use client";
import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";

const PROJECT_NAME = "AGENTIC-LAB-360-V2";
const PROMPT = `C:\\users\\siva_\\workspace\\${PROJECT_NAME}> `;

const TerminalClient = forwardRef(function TerminalClient(_, ref) {
  const termRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    runCommand: (cmd: string) => {
      if (termRef.current) {
        window.dispatchEvent(new CustomEvent("deploy-terminal-run", { detail: cmd }));
      }
    },
  }));

  useEffect(() => {
    let term: any;
    let fitAddon: any;
    let buffer = "";
    let isRunning = false;

    async function showPrompt() {
      term?.write(`\x1b[1;32m${PROMPT}\x1b[0m`);
      term?.focus(); // Focus the terminal after showing the prompt
    }

    async function runCommand(cmd: string) {
      if (!cmd) return;
      term?.writeln(`\x1b[1;32m${PROMPT}\x1b[0m${cmd}`);

      const res = await fetch("/api/terminal", {
        method: "POST",
        body: JSON.stringify({ command: cmd, project: PROJECT_NAME }),
      });

      if (!res.body) {
        term?.writeln("\x1b[1;31m[error: No response body]\x1b[0m");
        await showPrompt();
        term?.focus(); 
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        term?.write(decoder.decode(value));
      }
      term?.writeln('');
      await showPrompt();
      term?.focus(); 
    }

    async function handleEnter() {
      term.write("\r\n");
      isRunning = true;
      await runCommand(buffer.trim());
      buffer = "";
      isRunning = false;
    }

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
      await showPrompt();
      term.focus();

      term.onKey(async ({ key, domEvent }: any) => {
        if (isRunning) return;
        if (domEvent.key === "Enter") {
          await handleEnter();
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

      // Listen for runCommand from parent
      window.addEventListener("deploy-terminal-run", async (e: any) => {
        if (!isRunning) {
          buffer = e.detail;
          await handleEnter();
        }
      });

      window.addEventListener("resize", () => fitAddon.fit());
    }

    loadXterm();

    return () => {
      term?.dispose();
      window.removeEventListener("resize", () => fitAddon?.fit());
      window.removeEventListener("deploy-terminal-run", () => {});
    };
    // eslint-disable-next-line
  }, []);

  return <div ref={termRef} className="w-full h-full" style={{ height: "100%" }} />;
});

export default TerminalClient;