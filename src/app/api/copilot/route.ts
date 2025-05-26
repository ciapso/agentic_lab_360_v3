import { NextRequest } from "next/server";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "devstral:latest";

export async function POST(req: NextRequest) {
  const { contextFiles = [], filename, filepath, project, chat, prompt, stream } = await req.json();

  let contextString = "";
  if (contextFiles && contextFiles.length > 0) {
    contextString = contextFiles
      .map((f) =>
        `File: ${f.path}${f.path === filepath ? " (current)" : ""}\nContent:\n${f.content}\n`
      )
      .join("\n");
  }

  let ollamaPrompt =
    `You are GitHub Copilot Chat, an AI assistant for coding.\n` +
    `Project: ${project}\n` +
    (filepath ? `Current File: ${filename}\nFile Path: ${filepath}\n` : "") +
    (contextString ? `Context Files:\n${contextString}\n` : "") +
    (chat && Array.isArray(chat)
      ? chat.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") +
        `\nUser: ${prompt}\nAssistant:`
      : `User: ${prompt}\nAssistant:`);

  const ollamaRes = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt: ollamaPrompt,
      stream: !!stream,
    }),
  });

  if (stream) {
    return new Response(ollamaRes.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } else {
    const data = await ollamaRes.json();
    return Response.json({ suggestion: data.response || "" });
  }
}