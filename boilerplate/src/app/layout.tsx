import { redirect } from "next/navigation";
import { isConfigured, REQUIRED_SETTINGS } from "@/lib/config";

export const metadata = { title: "App" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// Middleware-like check: if app needs settings and they're not configured,
// redirect to /settings on the server side.
// To use this, import and call checkConfig() at the top of any page.tsx:
//
//   import { checkConfig } from "@/lib/config-check";
//   export default async function Page() {
//     checkConfig();
//     return <div>Your app here</div>;
//   }
