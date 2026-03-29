import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, user='cvision_user', password='Dadadax1.', dbname='cvision')
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
tables = [r[0] for r in cur.fetchall()]
print("Tables in PostgreSQL:", tables)
conn.close()

# Also grant schema access
conn2 = psycopg2.connect(host='127.0.0.1', port=5432, user='postgres', password='Dadadax1.', dbname='cvision')
conn2.autocommit = True
cur2 = conn2.cursor()
cur2.execute("GRANT ALL ON SCHEMA public TO cvision_user")
cur2.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cvision_user")
cur2.execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cvision_user")
print("Grants applied!")
cur2.close()
conn2.close()
