import { redirect } from "next/navigation";
import { isConfigured, REQUIRED_SETTINGS } from "./config";

/**
 * Call this at the top of any server page to redirect to /settings
 * if the app isn't configured yet.
 *
 * Usage in any page.tsx:
 *   import { checkConfig } from "@/lib/config-check";
 *   export default async function Page() {
 *     checkConfig();
 *     return <div>...</div>;
 *   }
 */
export function checkConfig() {
  if (REQUIRED_SETTINGS.length > 0 && !isConfigured()) {
    redirect("/settings");
  }
}
