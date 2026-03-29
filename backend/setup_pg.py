import psycopg2

conn = psycopg2.connect(host='127.0.0.1', port=5432, user='postgres', password='Dadadax1.')
conn.autocommit = True
cur = conn.cursor()

cur.execute("SELECT 1 FROM pg_database WHERE datname='cvision'")
if not cur.fetchone():
    cur.execute("CREATE DATABASE cvision")
    print("Database 'cvision' created!")
else:
    print("Database 'cvision' already exists.")

cur.execute("SELECT 1 FROM pg_roles WHERE rolname='cvision_user'")
if not cur.fetchone():
    cur.execute("CREATE USER cvision_user WITH PASSWORD 'Dadadax1.'")
    cur.execute("GRANT ALL PRIVILEGES ON DATABASE cvision TO cvision_user")
    print("User 'cvision_user' created and granted!")
else:
    print("User 'cvision_user' already exists.")

cur.close()
conn.close()
print("Done!")
