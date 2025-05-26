import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// GET handler 
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || "AGENTIC-LAB-360-V2";
  const workspace = `C:/users/siva_/workspace/${project}`;
  const file = searchParams.get("file");
  if (!file) {
    return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
  }
  const filePath = path.join(workspace, file);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  if (fs.statSync(filePath).isDirectory()) {
    return NextResponse.json({ error: "Cannot read a directory" }, { status: 400 });
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST handler 
export async function POST(req: NextRequest) {
  const { project, file, content } = await req.json();
  if (!project || !file) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }
  const filePath = path.join("C:/users/siva_/workspace", project, file);
  try {
    fs.writeFileSync(filePath, content ?? "", "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}