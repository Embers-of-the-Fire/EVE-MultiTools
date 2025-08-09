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
        if '_fts' in sql and 'fts5' not in sql:
            continue
        print(f"Creating table {table} in mock database.")
        cursor.execute(sql)
    conn.commit()

# Attach external SQL files if needed
def attach_external_sql(db_path: Path, sql_files: list[Path]) -> None:
    """Attach external SQL files to the mock database."""
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        for sql_file in sql_files:
            if sql_file.is_file():
                print(f"Attaching external SQL file {sql_file.name} to mock database.")
                with open(sql_file, 'r') as f:
                    sql_script = f.read()
                    cursor.executescript(sql_script)
        conn.commit()

external_sql_files = list((Path(__file__).parent / "external-sql").glob("*.sql"))
if external_sql_files:
    attach_external_sql(output_path, external_sql_files)
