import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type TreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
};

function readTree(dirPath: string, basePath: string): TreeNode[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.map((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(basePath, fullPath).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: relPath,
          isDirectory: true,
          children: readTree(fullPath, basePath),
        };
      } else {
        return {
          name: entry.name,
          path: relPath,
          isDirectory: false,
        };
      }
    });
  } catch (e) {
    return [];
  }
}

const getWorkspace = (project: string) =>
  `C:/users/siva_/workspace/${project || "AGENTIC-LAB-360-V2"}`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || "AGENTIC-LAB-360-V2";
  const workspace = getWorkspace(project);
  const stat = fs.existsSync(workspace) ? fs.statSync(workspace) : null;
  if (!stat || !stat.isDirectory()) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const rootNode: TreeNode = {
    name: project,
    path: "",
    isDirectory: true,
    children: readTree(workspace, workspace),
  };
  return NextResponse.json({ root: rootNode });
}

export async function POST(req: NextRequest) {
  const { action, project, target, name, newName, isDirectory } = await req.json();
  const workspace = getWorkspace(project);
  const targetPath = path.join(workspace, target || "");
  try {
    if (action === "create") {
      const newPath = path.join(targetPath, name);
      if (isDirectory) {
        fs.mkdirSync(newPath, { recursive: true, mode: 0o777 }); // Folders: fully accessible
      } else {
        // Files: executable for .sh/.py, otherwise editable
        const isExecutable = name.endsWith(".sh") || name.endsWith(".py");
        fs.writeFileSync(newPath, "", { mode: isExecutable ? 0o777 : 0o666 });
      }
      return NextResponse.json({ ok: true });
    }
    if (action === "rename") {
      const newPath = path.join(workspace, newName);
      fs.renameSync(targetPath, newPath);
      return NextResponse.json({ ok: true });
    }
    if (action === "delete") {
      if (fs.statSync(targetPath).isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}