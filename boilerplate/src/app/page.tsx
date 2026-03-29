import { checkConfig } from "@/lib/config-check";

export default async function Home() {
  checkConfig(); // redirects to /settings if not configured

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 20px", fontFamily: "system-ui" }}>
      <h1>Your App</h1>
      <p>Replace this with your app. Settings are configured ✓</p>
      <a href="/settings" style={{ color: "#666", fontSize: 14 }}>Settings →</a>
    </div>
  );
}
