import sqlite3
import json

def inspect():
    db_path = 'backend/rental.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    report = {}
    
    # Get tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]
    report['tables'] = tables
    
    # Sample data for key tables
    for table in ['users', 'vehicles', 'locations', 'bookings']:
        if table in tables:
            cursor.execute(f"SELECT * FROM {table} LIMIT 3")
            rows = [dict(r) for r in cursor.fetchall()]
            report[table] = rows
            
    conn.close()
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    inspect()
