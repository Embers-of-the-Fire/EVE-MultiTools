####  EVE MultiTools Sqlite MockDB Script  ####

from pathlib import Path
import sqlite3

SERVER = "tq" # modify this to mock your target bundle server.

def get_table_def(db_path: Path) -> dict[str, str]:
    """Get the table definition from the mock database."""
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL;")
        return {row[0]: row[1] for row in cursor.fetchall()}

sqls = {}
for file in (Path(__file__).parent / "bundle-cache" / SERVER).glob("**/*.db"):
    if file.is_file() and file.name.endswith(".db"):
        table_def = get_table_def(file)
        sqls.update(table_def)

# Write the SQL definitions to a file
output_path = Path(__file__).parent / "eve-multitools-sqlite-mock.db"
if output_path.exists():
    print(f"Mock database {output_path} already exists. Overwriting it.")
    output_path.unlink()
with sqlite3.connect(output_path) as conn:
    cursor = conn.cursor()
    for table, sql in sqls.items():
        print(f"Creating table {table} in mock database.")
        cursor.execute(sql)
    conn.commit()
