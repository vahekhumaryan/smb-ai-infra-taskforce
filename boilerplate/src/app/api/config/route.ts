import { NextResponse } from "next/server";
import { loadConfig, saveConfig, REQUIRED_SETTINGS } from "@/lib/config";

export async function GET() {
  const config = loadConfig();
  // Mask sensitive values for display
  const masked: Record<string, string> = {};
  for (const setting of REQUIRED_SETTINGS) {
    const val = config[setting.key] || "";
    masked[setting.key] =
      setting.type === "password" && val
        ? "•".repeat(Math.min(val.length, 20))
        : val;
  }
  return NextResponse.json({ config: masked, settings: REQUIRED_SETTINGS });
}

export async function POST(req: Request) {
  const body = await req.json();
  const current = loadConfig();
  // Only update non-empty values (so masked passwords don't overwrite)
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string" && value && !value.startsWith("•")) {
      current[key] = value;
    }
  }
  saveConfig(current);
  return NextResponse.json({ ok: true });
}
