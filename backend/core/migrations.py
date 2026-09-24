from .database import get_db


def init_db():
    """
    Initializes SQLite database tables, indexes, and default administrator credentials.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Admins Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Migration check for existing admins table columns
        cursor.execute("PRAGMA table_info(admins);")
        admin_cols = [r["name"] for r in cursor.fetchall()]
        if "full_name" not in admin_cols:
            cursor.execute("ALTER TABLE admins ADD COLUMN full_name TEXT;")
        if "role" not in admin_cols:
            cursor.execute("ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin';")
        if "created_at" not in admin_cols:
            cursor.execute("ALTER TABLE admins ADD COLUMN created_at DATETIME;")

        # 2. Campuses Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS campuses (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                code TEXT NOT NULL UNIQUE,
                location TEXT,
                description TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Students Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS students (
                enrollment_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                department TEXT,
                campus TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. Clubs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS clubs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                campus TEXT NOT NULL,
                description TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 5. Candidates Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL UNIQUE,
                club_id TEXT NOT NULL,
                votes_count INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(enrollment_id) ON DELETE CASCADE,
                FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
            );
        """)

        # 6. Votes Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS votes (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                candidate_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(enrollment_id) ON DELETE RESTRICT,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE RESTRICT
            );
        """)

        # Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_candidates_club ON candidates(club_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_votes_student ON votes(student_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_campus ON students(campus);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_clubs_campus ON clubs(campus);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_campuses_name ON campuses(name);")

        # Default Admin Credentials
        cursor.execute("SELECT COUNT(*) AS count FROM admins")
        if cursor.fetchone()["count"] == 0:
            cursor.execute("INSERT INTO admins (id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)", 
                           ("ADM-OFFICER-01", "admin", "admin123", "Chief Election Officer", "admin"))
            cursor.execute("INSERT INTO admins (id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)", 
                           ("ADM-SUPER-01", "superadmin", "supersecret123", "System Administrator", "superadmin"))
        else:
            # Ensure unique officer ID ADM-OFFICER-01 exists
            cursor.execute("SELECT 1 FROM admins WHERE id = 'ADM-OFFICER-01'")
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT OR REPLACE INTO admins (id, username, password_hash, full_name, role) 
                    VALUES ('ADM-OFFICER-01', 'admin', 'admin123', 'Chief Election Officer', 'admin')
                """)

        conn.commit()
