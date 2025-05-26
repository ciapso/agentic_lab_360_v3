"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";

const TerminalClient = dynamic(() => import("./TerminalClient"), { ssr: false });

const DEPLOY_SCRIPTS = [
  { label: "Build", command: "npm run build" },
  { label: "Deploy", command: "npm run deploy" },
  { label: "Rollback", command: "npm run rollback" },
];

export default function DeployPage() {
  const terminalRef = useRef<{ runCommand: (cmd: string) => void }>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-purple-100 rounded shadow-lg overflow-hidden border border-gray-200">
      {/* Left Panel */}
      <aside className="w-60 border-r bg-white/80 p-4 flex flex-col gap-4">
        <h2 className="font-semibold mb-4 text-indigo-700">Deploy Scripts</h2>
        {DEPLOY_SCRIPTS.map((script) => (
          <button
            key={script.label}
            className="w-full py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            onClick={() => terminalRef.current?.runCommand(script.command)}
          >
            {script.label}
          </button>
        ))}
      </aside>
      {/* Right Panel: Terminal */}
      <main className="flex-1 flex flex-col bg-black">
        <div className="flex-1 min-h-0 p-0">
          <TerminalClient ref={terminalRef} />
        </div>
      </main>
    </div>
  );
}