import { NextRequest } from "next/server";
import { spawn } from "child_process";
import os from "os";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { command, project } = await req.json();
  const cwd = `C:/users/siva_/workspace/${project || "AGENTIC-LAB-360-V2"}`;
  const isWin = os.platform() === "win32";
  const shell = isWin ? "C:\\Windows\\System32\\cmd.exe" : "/bin/sh";
  const shellFlag = isWin ? "/c" : "-c";

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      function safeEnqueue(data: Uint8Array | string) {
        if (!closed) controller.enqueue(data);
      }
      function safeClose() {
        if (!closed) {
          closed = true;
          controller.close();
        }
      }

      const proc = spawn(shell, [shellFlag, command], { cwd });

      proc.stdout.on("data", (data) => {
        safeEnqueue(data);
      });
      proc.stderr.on("data", (data) => {
        safeEnqueue(data);
      });
      proc.on("close", (code) => {
        safeEnqueue(Buffer.from(`[exit code: ${code}]\n`));
        safeClose();
      });
      proc.on("error", (err) => {
        safeEnqueue(Buffer.from(`[error: ${err.message}]\n`));
        safeClose();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}