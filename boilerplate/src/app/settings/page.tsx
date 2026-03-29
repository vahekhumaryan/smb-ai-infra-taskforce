"use client";

import { useEffect, useState } from "react";

type Setting = {
  key: string;
  label: string;
  type: "text" | "password" | "textarea";
  placeholder: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setValues(data.config);
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;

  if (settings.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.muted}>
          No runtime settings needed. All config comes from environment
          variables.
        </p>
        <a href="/" style={styles.link}>← Back to app</a>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>
      <p style={styles.muted}>
        These are saved on the server and persist across restarts.
      </p>

      <div style={styles.form}>
        {settings.map((s) => (
          <div key={s.key} style={styles.field}>
            <label style={styles.label}>{s.label}</label>
            {s.type === "textarea" ? (
              <textarea
                style={styles.textarea}
                placeholder={s.placeholder}
                value={values[s.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [s.key]: e.target.value })
                }
                rows={6}
              />
            ) : (
              <input
                style={styles.input}
                type={s.type}
                placeholder={s.placeholder}
                value={values[s.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [s.key]: e.target.value })
                }
              />
            )}
          </div>
        ))}

        <button onClick={handleSave} style={styles.button}>
          {saved ? "✓ Saved" : "Save settings"}
        </button>
      </div>

      <a href="/" style={styles.link}>← Back to app</a>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 520,
    margin: "60px auto",
    padding: "0 20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 4,
  },
  muted: {
    color: "#666",
    fontSize: 14,
    marginBottom: 24,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
  },
  input: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
  },
  textarea: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "monospace",
    resize: "vertical" as const,
  },
  button: {
    padding: "10px 20px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 8,
  },
  link: {
    display: "inline-block",
    marginTop: 24,
    color: "#666",
    fontSize: 14,
    textDecoration: "none",
  },
};
