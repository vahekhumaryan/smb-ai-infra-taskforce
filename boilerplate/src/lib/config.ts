import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.env.DATA_DIR || "./data", "config.json");

export type AppConfig = Record<string, string>;

export function loadConfig(): AppConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export function saveConfig(config: AppConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getConfigValue(key: string): string | undefined {
  return loadConfig()[key];
}

// Define what your app needs from the user at runtime.
// Edit this array for each app.
export const REQUIRED_SETTINGS: {
  key: string;
  label: string;
  type: "text" | "password" | "textarea";
  placeholder: string;
}[] = [
  // --- EDIT THESE FOR YOUR APP ---
  // {
  //   key: "shopify_store_url",
  //   label: "Shopify Store URL",
  //   type: "text",
  //   placeholder: "https://your-store.myshopify.com",
  // },
  // {
  //   key: "default_cv",
  //   label: "Default CV (paste full text)",
  //   type: "textarea",
  //   placeholder: "Paste your CV here...",
  // },
];

export function isConfigured(): boolean {
  if (REQUIRED_SETTINGS.length === 0) return true;
  const config = loadConfig();
  return REQUIRED_SETTINGS.every((s) => config[s.key]?.trim());
}
