import sqlite3
import os

def update_images():
    # Correct path to backend/rental.db
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'rental.db'))
    print(f"Connecting to DB: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Define mappings (name_substring, image_path)
    mappings = [
        ('Swift', '/api/uploads/swift.jpg'),
        ('i20', '/api/uploads/i20.jpg'),
        ('City', '/api/uploads/honda_city.png'),
        ('Crysta', '/api/uploads/innova_crysta.jpeg'),
        ('Toyota Innova', '/api/uploads/toyota_innova.jpeg'),
        ('Creta', '/api/uploads/creta.jpg'),
        ('Seltos', '/api/uploads/seltos.jpg'),
        ('Activa', '/api/uploads/activa_6g.jpeg'),
        ('Nexon', '/api/uploads/nexon_ev_v2.jpeg'),
        ('Ertiga', '/api/uploads/ertiga.jpg'),
        ('Camry', '/api/uploads/camry.jpg'),
        ('Mercedes', '/api/uploads/mercedes.jpg'),
        ('Pulsar', '/api/uploads/pulsar.jpg'),
        ('Apache', '/api/uploads/apache.avif'),
        ('R15', '/api/uploads/r15.avif'),
        ('Ola S1 Pro', '/api/uploads/ola_s1_v2.avif'),
    ]

    for name_sub, img_path in mappings:
        cursor.execute("UPDATE vehicles SET image_url = ? WHERE name LIKE ?", (img_path, f'%{name_sub}%'))
    
    conn.commit()
    conn.close()
    print("✅ Database updated with image paths!")

if __name__ == '__main__':
    update_images()
