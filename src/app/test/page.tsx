"use client";
import dynamic from "next/dynamic";

const TerminalClient = dynamic(() => import("./TerminalClient"), { ssr: false });

export default function TestPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-purple-100 rounded shadow-lg overflow-hidden border border-gray-200">
      {/* Left Panel */}
      <aside className="w-60 border-r bg-white/80 p-4 flex flex-col gap-4">
        <h2 className="font-semibold mb-4 text-indigo-700">Test Actions</h2>
        {/* You can add your action buttons here, and trigger commands via events or context */}
      </aside>
      {/* Right Panel: Terminal */}
      <main className="flex-1 flex flex-col bg-black">
        <div className="flex-1 min-h-0 p-0">
          <TerminalClient />
        </div>
      </main>
    </div>
  );
}