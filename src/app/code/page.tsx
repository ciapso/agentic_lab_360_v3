"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { FiChevronDown, FiChevronRight, FiFile, FiFolder, FiX } from "react-icons/fi";
import ReactMarkdown from "react-markdown";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type TreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
};

const PROJECT_NAME = "AGENTIC-LAB-360-V2";

export default function CodePage() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [openTabs, setOpenTabs] = useState<TreeNode[]>([]);
  const [activeTab, setActiveTab] = useState<TreeNode | null>(null);
  const [fileContents, setFileContents] = useState<{ [path: string]: string }>({});
  const [savedContents, setSavedContents] = useState<{ [path: string]: string }>({});
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});
  const [saveStatus, setSaveStatus] = useState<{ [path: string]: string }>({});
  const [copilotSuggestion, setCopilotSuggestion] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Copilot Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: "user"|"assistant", text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [contextFiles, setContextFiles] = useState<string[]>(activeTab ? [activeTab.path] : []);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<{timestamp: number, chatMessages: any[]}[]>([]);


  const editorRef = useRef<any>(null);

  // Fetch folder tree (root node)
  const fetchTree = useCallback(() => {
    fetch(`/api/files/tree?project=${encodeURIComponent(PROJECT_NAME)}`)
      .then((res) => res.json())
      .then((data) => setTree(data.root || data.tree || null));
  }, []);

  // Helper to get all files from tree
  function getAllFiles(node: TreeNode): TreeNode[] {
    if (!node) return [];
    if (!node.isDirectory) return [node];
      return (node.children || []).flatMap(getAllFiles);
}

  useEffect(() => { fetchTree(); }, [fetchTree]);

  // Fetch file content when a file is opened
  useEffect(() => {
    if (
      activeTab &&
      !activeTab.isDirectory &&
      activeTab.path &&
      fileContents[activeTab.path] === undefined
    ) {
      fetch(
        `/api/files/content?project=${encodeURIComponent(PROJECT_NAME)}&file=${encodeURIComponent(activeTab.path)}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.error) return;
          setFileContents((prev) => ({
            ...prev,
            [activeTab.path]: data.content ?? "",
          }));
          setSavedContents((prev) => ({
            ...prev,
            [activeTab.path]: data.content ?? "",
          }));
        });
    }
  }, [activeTab, fileContents]);

  // On chat send or receive, save history:
useEffect(() => {
  if (!PROJECT_NAME) return;
  const key = `copilot-chat-${PROJECT_NAME}`;
  const data = { chatMessages, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(data));
}, [chatMessages, PROJECT_NAME]);

// On load, restore if not older than 2 days:
useEffect(() => {
  if (!PROJECT_NAME) return;
  const key = `copilot-chat-${PROJECT_NAME}`;
  const data = localStorage.getItem(key);
  if (data) {
    const parsed = JSON.parse(data);
    if (Date.now() - parsed.timestamp < 2 * 24 * 60 * 60 * 1000) {
      setChatMessages(parsed.chatMessages || []);
    } else {
      localStorage.removeItem(key);
    }
  }
}, [PROJECT_NAME]);


// On chat send or receive, save history:
useEffect(() => {
  if (!PROJECT_NAME) return;
  const key = `copilot-chat-${PROJECT_NAME}`;
  const data = { chatMessages, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(data));
}, [chatMessages, PROJECT_NAME]);

// On load, restore if not older than 2 days:
useEffect(() => {
  if (!PROJECT_NAME) return;
  const key = `copilot-chat-${PROJECT_NAME}`;
  const data = localStorage.getItem(key);
  if (data) {
    const parsed = JSON.parse(data);
    if (Date.now() - parsed.timestamp < 2 * 24 * 60 * 60 * 1000) {
      setChatMessages(parsed.chatMessages || []);
    } else {
      localStorage.removeItem(key);
    }
  }
}, [PROJECT_NAME]);

  // Open file in tab
  const openFile = (node: TreeNode) => {
    if (node.isDirectory) return;
    if (!openTabs.find((tab) => tab.path === node.path)) {
      setOpenTabs((tabs) => [...tabs, node]);
    }
    setActiveTab(node);
    setSelected(node);
  };

  // Close tab
  const closeTab = (node: TreeNode) => {
    setOpenTabs((tabs) => tabs.filter((tab) => tab.path !== node.path));
    if (activeTab?.path === node.path) {
      const idx = openTabs.findIndex((tab) => tab.path === node.path);
      const nextTab = openTabs[idx - 1] || openTabs[idx + 1] || null;
      setActiveTab(nextTab);
      setSelected(nextTab);
    }
  };

  // File/folder ops (implement as needed)
  const handleContextAction = async (action: string, node: TreeNode) => {
    if (action === "rename") {
      const newName = prompt("Rename to:", node.name);
      if (!newName || newName === node.name) return;
      const parentPath = node.path.split("/").slice(0, -1).join("/");
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;
      await fetch("/api/files/tree", {
        method: "POST",
        body: JSON.stringify({
          action: "rename",
          project: PROJECT_NAME,
          target: node.path,
          newName: newPath,
        }),
      });
      fetchTree();
    } else if (action === "delete") {
      if (!confirm(`Delete "${node.name}"?`)) return;
      await fetch("/api/files/tree", {
        method: "POST",
        body: JSON.stringify({
          action: "delete",
          project: PROJECT_NAME,
          target: node.path,
        }),
      });
      fetchTree();
    } else if (action === "newFile") {
      const name = prompt("New file name:");
      if (!name) return;
      await fetch("/api/files/tree", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          project: PROJECT_NAME,
          target: node.path,
          name,
          isDirectory: false,
        }),
      });
      fetchTree();
    } else if (action === "newFolder") {
      const name = prompt("New folder name:");
      if (!name) return;
      await fetch("/api/files/tree", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          project: PROJECT_NAME,
          target: node.path,
          name,
          isDirectory: true,
        }),
      });
      fetchTree();
    }
  };

  // Save file to backend
  const saveFile = useCallback(async (node: TreeNode | null) => {
    if (!node || node.isDirectory) return;
    setSaveStatus((prev) => ({ ...prev, [node.path]: "Saving..." }));
    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: PROJECT_NAME,
          file: node.path,
          content: fileContents[node.path],
        }),
      });
      if (res.ok) {
        setSavedContents((prev) => ({
          ...prev,
          [node.path]: fileContents[node.path],
        }));
        setSaveStatus((prev) => ({ ...prev, [node.path]: "Saved" }));
        setTimeout(() => setSaveStatus((prev) => ({ ...prev, [node.path]: "" })), 1200);
      } else {
        setSaveStatus((prev) => ({ ...prev, [node.path]: "Error" }));
      }
    } catch {
      setSaveStatus((prev) => ({ ...prev, [node.path]: "Error" }));
    }
  }, [fileContents]);

  // Is file dirty?
  const isDirty = (node: TreeNode) =>
    fileContents[node.path] !== undefined &&
    fileContents[node.path] !== savedContents[node.path];

  // Ctrl+S/Cmd+S to save and Copilot keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (activeTab && isDirty(activeTab)) {
          e.preventDefault();
          saveFile(activeTab);
        }
      }
      // Copilot: Tab/Enter to accept, Esc to dismiss
      if (copilotSuggestion) {
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          acceptCopilot();
        }
        if (e.key === "Escape") {
          setCopilotSuggestion(null);
        }
      }
      // Copilot Chat: Ctrl+Shift+I to open chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setChatOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, isDirty, saveFile, copilotSuggestion]);

  // Copilot: Request suggestion from backend
  const requestCopilot = async () => {
    if (!activeTab || !editorRef.current) return;
    setCopilotLoading(true);
    setCopilotSuggestion(null);
    const content = fileContents[activeTab.path] ?? "";
    const position = editorRef.current.getPosition();
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          position,
          filename: activeTab.name,
        }),
      });
      const data = await res.json();
      setCopilotSuggestion(data.suggestion || "");
    } catch (e) {
      setCopilotSuggestion("// Error getting suggestion");
    }
    setCopilotLoading(false);
  };

  // Copilot: Accept suggestion
  const acceptCopilot = () => {
    if (!copilotSuggestion || !editorRef.current || !activeTab) return;
    const editor = editorRef.current;
    editor.executeEdits("", [
      {
        range: editor.getSelection(),
        text: copilotSuggestion,
        forceMoveMarkers: true,
      },
    ]);
    setFileContents((prev) => ({
      ...prev,
      [activeTab.path]: editor.getValue(),
    }));
    setCopilotSuggestion(null);
  };


  const loadHistory = () => {
  const items: {timestamp: number, chatMessages: any[]}[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`copilot-chat-${PROJECT_NAME}-`)) {
      const data = JSON.parse(localStorage.getItem(key)!);
      if (Date.now() - data.timestamp < 2 * 24 * 60 * 60 * 1000) {
        items.push(data);
      }
    }
  }
  // Sort by newest first
  items.sort((a, b) => b.timestamp - a.timestamp);
  setHistoryList(items);
};

  // Copilot Chat: Send message
const sendChat = async () => {
  if (!chatInput.trim()) return;
  const userMsg: { role: "user" | "assistant"; text: string } = { role: "user", text: chatInput };
  setChatMessages((msgs) => [...msgs, userMsg]);
  setChatLoading(true);
  setChatInput("");

  // Gather context file contents
  const contextFilesSet = new Set(contextFiles);
  if (activeTab?.path && !contextFilesSet.has(activeTab.path)) {
    contextFilesSet.add(activeTab.path);
  }
  const contextContents = Array.from(contextFilesSet).map((path) => ({
  path,
  content: fileContents[path] ?? "",
}));

  try {
    const res = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contextFiles: contextContents,
        filename: activeTab?.name ?? "",
        filepath: activeTab?.path ?? "",
        project: PROJECT_NAME,
        chat: [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.text })),
        prompt: chatInput,
        stream: true,
      }),
    });

    if (!res.body) throw new Error("No stream");
const reader = res.body.getReader();
let assistantMsg = "";
setChatMessages((msgs) => [...msgs, { role: "assistant", text: "" }]);
let idx = 0;
let buffer = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += new TextDecoder().decode(value);

  // Process each complete line (Ollama streams JSON lines)
  let lines = buffer.split("\n");
  buffer = lines.pop() || ""; // Save incomplete line for next chunk

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const json = JSON.parse(line);
      if (json.response) {
        assistantMsg += json.response;
        setChatMessages((msgs) => {
          const copy = [...msgs];
          copy[copy.length - 1] = { role: "assistant", text: assistantMsg };
          return copy;
        });
      }
    } catch {}
  }
}
  } catch {
    setChatMessages((msgs) => [...msgs, { role: "assistant", text: "Error getting response." }]);
  }
  setChatLoading(false);
};
  // Recursive tree rendering with VS Code-like expand/collapse
  function FileTree({ node }: { node: TreeNode }) {
    const isOpen = open[node.path] ?? node.path === ""; // root open by default
    return (
      <ul className="pl-2">
        <li key={node.path}>
          <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
              <div
                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer select-none
                  ${
                    selected?.path === node.path
                      ? "bg-[#23272e] text-blue-400 font-semibold"
                      : "hover:bg-[#23272e] text-gray-200"
                  }`}
                onClick={() => {
                  setSelected(node);
                  if (!node.isDirectory) openFile(node);
                }}
              >
                {node.isDirectory ? (
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      setOpen((o) => ({ ...o, [node.path]: !isOpen }));
                    }}
                    className="flex items-center"
                  >
                    {isOpen ? (
                      <FiChevronDown className="text-gray-400" />
                    ) : (
                      <FiChevronRight className="text-gray-400" />
                    )}
                  </span>
                ) : (
                  <span className="w-4" />
                )}
                {node.isDirectory ? (
                  <FiFolder className="text-yellow-400" />
                ) : (
                  <FiFile className="text-blue-300" />
                )}
                <span className="truncate">{node.name || PROJECT_NAME}</span>
              </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content className="min-w-[180px] rounded bg-[#23272e] text-gray-100 shadow border border-gray-700 p-1 z-50">
                {node.isDirectory && (
                  <>
                    <ContextMenu.Item
                      className="px-3 py-2 rounded hover:bg-[#2d323b]"
                      onSelect={() => handleContextAction("newFile", node)}
                    >
                      ➕ New File
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      className="px-3 py-2 rounded hover:bg-[#2d323b]"
                      onSelect={() => handleContextAction("newFolder", node)}
                    >
                      📁 New Folder
                    </ContextMenu.Item>
                  </>
                )}
                <ContextMenu.Item
                  className="px-3 py-2 rounded hover:bg-[#2d323b]"
                  onSelect={() => handleContextAction("rename", node)}
                >
                  ✏️ Rename
                </ContextMenu.Item>
                <ContextMenu.Item
                  className="px-3 py-2 rounded hover:bg-red-700 text-red-300"
                  onSelect={() => handleContextAction("delete", node)}
                >
                  🗑️ Delete
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
          {node.isDirectory && node.children && isOpen && (
            <div>
              {node.children.map((child) => (
                <FileTree key={child.path} node={child} />
              ))}
            </div>
          )}
        </li>
      </ul>
    );
  }

  // Determine language for Monaco
  const getLanguage = (filename: string | undefined) => {
    if (!filename) return "python";
    if (filename.endsWith(".py")) return "python";
    if (filename.endsWith(".js")) return "javascript";
    if (filename.endsWith(".ts")) return "typescript";
    if (filename.endsWith(".md")) return "markdown";
    if (filename.endsWith(".json")) return "json";
    return "plaintext";
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#181a1b] rounded shadow-lg overflow-hidden border border-gray-800">
      {/* File Explorer */}
      <aside className="w-64 border-r border-gray-800 bg-[#1e1e1e] p-0 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="font-semibold text-gray-200 tracking-wide text-sm">EXPLORER</span>
          <button
            className="text-xs px-2 py-1 rounded bg-[#23272e] hover:bg-blue-700 text-blue-200 transition"
            onClick={() => {
              if (!tree) return;
              handleContextAction("newFile", tree);
            }}
          >
            + New File
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 pr-2">
          {tree && <FileTree node={tree} />}
        </div>
      </aside>
      {/* Editor with Tabs */}
      <main className="flex-1 flex flex-col bg-[#1e1e1e]">
        {/* Tabs and Save/Copilot Buttons */}
        <div className="flex items-center border-b border-gray-800 bg-[#23272e] h-10">
          {/* Tabs - take up all available space */}
          <div className="flex flex-1 overflow-x-auto">
            {openTabs.map((tab) => (
              <div
                key={tab.path}
                className={`flex items-center px-4 h-full cursor-pointer border-r border-gray-800
                  ${activeTab?.path === tab.path ? "bg-[#1e1e1e] text-blue-400 font-semibold" : "text-gray-300 hover:bg-[#23272e]"}`}
                onClick={() => {
                  if (!tab.isDirectory) {
                    setActiveTab(tab);
                    setSelected(tab);
                  }
                }}
              >
                <FiFile className="mr-2 text-blue-300" />
                <span className="truncate max-w-[120px]">
                  {tab.name}
                  {isDirty(tab) && <span className="ml-1 text-yellow-400">●</span>}
                </span>
                <button
                  className="ml-2 text-gray-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab);
                  }}
                >
                  <FiX size={16} />
                </button>
                {saveStatus[tab.path] && (
                  <span className="ml-2 text-xs text-gray-400">{saveStatus[tab.path]}</span>
                )}
              </div>
            ))}
          </div>
          {/* Right-aligned buttons */}
          <div className="flex items-center gap-2 ml-4 pr-4">
            <button
              className={`text-xs px-3 py-1 rounded transition ${
                activeTab && isDirty(activeTab)
                  ? "bg-blue-700 text-white hover:bg-blue-800"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!activeTab || !isDirty(activeTab)}
              onClick={() => saveFile(activeTab)}
              title="Save (Ctrl+S)"
            >
              Save
            </button>
            <button
              className="text-xs px-3 py-1 rounded bg-green-700 text-white hover:bg-green-800"
              onClick={requestCopilot}
              disabled={copilotLoading || !activeTab}
              title="Ask Copilot (Ollama)"
            >
              {copilotLoading ? "Thinking..." : "Copilot"}
            </button>
            <button
              className="text-xs px-3 py-1 rounded bg-green-700 text-white hover:bg-green-800"
              onClick={() => setChatOpen((v) => !v)}
              title="Open Copilot Chat (Ctrl+Shift+I)"
            >
              Copilot Chat
            </button>
          </div>
        </div>
        {/* Monaco Editor */}
        <div className="flex-1 min-h-0 relative">
          {activeTab ? (
            <>
              <MonacoEditor
                height="100%"
                defaultLanguage={getLanguage(activeTab.name)}
                language={getLanguage(activeTab.name)}
                value={fileContents[activeTab.path] ?? ""}
                onChange={(v) =>
                  setFileContents((prev) => ({
                    ...prev,
                    [activeTab.path]: v ?? "",
                  }))
                }
                theme="vs-dark"
                options={{
                  fontSize: 15,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  roundedSelection: true,
                  wordWrap: "on",
                  fontFamily: "Consolas, 'Fira Mono', 'Menlo', 'Monaco', monospace",
                  lineNumbers: "on",
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
              />
              {/* Copilot Suggestion Overlay */}
              {copilotSuggestion && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: 20,
                    background: "#23272e",
                    color: "#a0e7a0",
                    padding: "8px 16px",
                    borderRadius: 6,
                    fontFamily: "monospace",
                    zIndex: 20,
                    opacity: 0.95,
                    pointerEvents: "none",
                    whiteSpace: "pre-wrap",
                    maxWidth: "80%",
                  }}
                >
                  {copilotSuggestion}
                  <span className="ml-2 text-xs text-gray-400">(Tab/Enter to accept, Esc to dismiss)</span>
                </div>
              )}
              {/* Copilot Chat Window */}

{chatOpen && (
  <div
    style={{
      position: "absolute",
      top: 60,
      right: 40,
      width: 420,
      maxHeight: 600,
      background: "#23272e",
      color: "#e0e0e0",
      borderRadius: 8,
      boxShadow: "0 2px 16px #000a",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Header */}
    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
      <span className="font-semibold">Copilot Chat</span>
      <button
    className="text-xs px-2 py-1 rounded bg-gray-700 text-white ml-2"
    onClick={() => { setShowHistory(v => !v); if (!showHistory) loadHistory(); }}
>
  {showHistory ? "Hide History" : "View History"}
</button>
      <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-red-400">✕</button>
    </div>
    {/* Context Summary & Edit */}
    <div className="px-4 py-2 border-b border-gray-700 bg-[#20232a]">
      <div className="text-xs text-gray-400 mb-1">Context:</div>
      <div className="flex flex-col gap-1">
        <div>
          <span className="font-semibold text-gray-300">Project:</span> {PROJECT_NAME}
        </div>
        <div>
          <span className="font-semibold text-gray-300">Current File:</span> {activeTab?.name || "None"}
        </div>
        <div>
          <span className="font-semibold text-gray-300">Current File Path:</span> {activeTab?.path || "None"}
        </div>
        {/* Optionally, add more context here */}
      </div>
    </div>
    {/* Show history modal/list */}
{showHistory && (
  <div className="absolute top-12 right-0 bg-[#23272e] border border-gray-700 rounded shadow-lg z-50 w-96 max-h-96 overflow-y-auto p-4">
    <div className="font-semibold mb-2">Chat History (last 2 days)</div>
    {historyList.length === 0 && <div className="text-gray-400">No history found.</div>}
    {historyList.map((item, idx) => (
      <div key={item.timestamp} className="mb-4 border-b border-gray-700 pb-2">
        <div className="text-xs text-gray-400 mb-1">
          {new Date(item.timestamp).toLocaleString()}
          <button
            className="ml-2 text-blue-400 underline"
            onClick={() => { setChatMessages(item.chatMessages); setShowHistory(false); }}
          >
            Restore
          </button>
        </div>
        <div className="max-h-24 overflow-y-auto text-xs">
          {item.chatMessages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "text-blue-300" : "text-green-300"}>
              <b>{msg.role === "user" ? "You" : "Copilot"}:</b> {msg.text}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)}
    <div className="px-4 py-2 border-b border-gray-700 bg-[#20232a]">
  <div className="flex items-center justify-between">
    <div>
      <span className="font-semibold text-gray-300">Context Files:</span>
      <span className="ml-2 text-xs text-gray-400">
        {contextFiles.length === 0 ? "None" : contextFiles.join(", ")}
      </span>
    </div>
    <button
      className="text-xs px-2 py-1 rounded bg-blue-800 text-white ml-2"
      onClick={() => setShowContextSelector((v) => !v)}
    >
      {showContextSelector ? "Done" : "Edit"}
    </button>
  </div>
  {showContextSelector && (
    <div className="mt-2 max-h-32 overflow-y-auto">
      {(tree ? getAllFiles(tree) : []).map((file) => (
        <label key={file.path} className="block text-xs text-gray-300">
          <input
            type="checkbox"
            checked={contextFiles.includes(file.path)}
            onChange={() => {
              setContextFiles((prev) =>
                prev.includes(file.path)
                  ? prev.filter((p) => p !== file.path)
                  : [...prev, file.path]
              );
            }}
          />{" "}
          {file.name}
        </label>
      ))}
    </div>
  )}
</div>
    {/* Chat Messages */}
    <div className="flex-1 overflow-y-auto px-4 py-2" style={{maxHeight: 350}}>
      {chatMessages.length === 0 && (
        <div className="text-gray-400 text-sm mt-4">
          Ask anything about your code, project, or files.<br />
          <span className="text-xs text-gray-500">Copilot will use the current file and project as context.</span>
        </div>
      )}
      {chatMessages.map((msg, i) => (
  <div key={i} className={`mb-2 ${msg.role === "user" ? "text-blue-300" : "text-green-300"}`}>
    <b>{msg.role === "user" ? "You" : "Copilot"}:</b>{" "}
    {msg.role === "assistant" ? (
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown>{msg.text}</ReactMarkdown>
      </div>
    ) : (
      msg.text
    )}
  </div>
))}
      {chatLoading && <div className="text-green-300">Copilot is typing...</div>}
    </div>
    {/* Input */}
    <form
      className="flex border-t border-gray-700"
      onSubmit={e => { e.preventDefault(); sendChat(); }}
    >
      <input
        className="flex-1 px-3 py-2 bg-[#181a1b] text-gray-100 outline-none"
        value={chatInput}
        onChange={e => setChatInput(e.target.value)}
        placeholder="Ask Copilot anything about your code or project..."
        disabled={chatLoading}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-700 text-white rounded-r hover:bg-blue-800 disabled:opacity-50"
        disabled={chatLoading}
      >
        Send
      </button>
    </form>
  </div>
)}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg">
              Select a file to view its contents
            </div>
          )}
        </div>
      </main>
    </div>
  );
}