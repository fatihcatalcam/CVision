import sqlite3
import os

db_path = "cvision.db"

if not os.path.exists(db_path):
    print("Veritabani yok, ilk baslatmada olusturulacak.")
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    existing = {r[1] for r in cur.execute("PRAGMA table_info(analysis_results)")}
    for col, typ in [("ai_summary", "TEXT"), ("ai_suggestions", "TEXT"), ("ai_enhanced", "INTEGER DEFAULT 0")]:
        if col not in existing:
            cur.execute(f"ALTER TABLE analysis_results ADD COLUMN {col} {typ}")
            print(f"Eklendi: analysis_results.{col}")

    existing = {r[1] for r in cur.execute("PRAGMA table_info(users)")}
    for col, typ in [
        ("plan_type", 'VARCHAR(20) NOT NULL DEFAULT "free"'),
        ("analysis_count", "INTEGER NOT NULL DEFAULT 0"),
        ("quota_reset_at", "DATETIME"),
        ("subscription_end_at", "DATETIME"),
        ("stripe_customer_id", "VARCHAR(100)"),
    ]:
        if col not in existing:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {typ}")
            print(f"Eklendi: users.{col}")

    existing = {r[1] for r in cur.execute("PRAGMA table_info(cvs)")}
    if "target_domain" not in existing:
        cur.execute("ALTER TABLE cvs ADD COLUMN target_domain VARCHAR(100)")
        print("Eklendi: cvs.target_domain")

    existing = {r[1] for r in cur.execute("PRAGMA table_info(role_profiles)")}
    if "domain" not in existing:
        cur.execute("ALTER TABLE role_profiles ADD COLUMN domain VARCHAR(100)")
        print("Eklendi: role_profiles.domain")

    existing = {r[1] for r in cur.execute("PRAGMA table_info(suggestions)")}
    if "snippets" not in existing:
        cur.execute("ALTER TABLE suggestions ADD COLUMN snippets TEXT")
        print("Eklendi: suggestions.snippets")

    conn.commit()
    conn.close()
    print("Veritabani guncelleme tamamlandi.")
