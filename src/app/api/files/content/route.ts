import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") || "AGENTIC-LAB-360-V2";
  const workspace = `C:/users/siva_/workspace/${project}`;
  const file = searchParams.get("file");
  if (!file) return NextResponse.json({ error: "No file specified" }, { status: 400 });

  const filePath = path.join(workspace, file);

  try {

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      return NextResponse.json({ error: "Cannot read a directory" }, { status: 400 });
  }
    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json({ error: "Unable to read file", details: String(e) }, { status: 500 });
  }
}