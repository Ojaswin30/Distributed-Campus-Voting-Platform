from .database import get_db


def init_db():
    """
    Initializes SQLite database tables, indexes, and administrator schemas.
    All password-based authentication has been removed in favor of Google OAuth verification.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Admins Table (Google OAuth based)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                full_name TEXT,
                role TEXT DEFAULT 'admin',
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Migration check for existing admins table columns
        cursor.execute("PRAGMA table_info(admins);")
        admin_cols = [r["name"] for r in cursor.fetchall()]
        if "email" not in admin_cols:
            cursor.execute("ALTER TABLE admins ADD COLUMN email TEXT;")
        if "full_name" not in admin_cols:
            cursor.execute("ALTER TABLE admins ADD COLUMN full_name TEXT;")
        if "role" not in admin_cols:
            cursor.execute("ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin';")
        if "is_active" not in admin_cols:
            cursor.execute("ALTER TABLE admins ADD COLUMN is_active INTEGER DEFAULT 1;")
        if "created_at" not in admin_cols:
            cursor.execute("ALTER TABLE admins ADD COLUMN created_at DATETIME;")

        # Purge legacy password-only records with no Google email
        cursor.execute("DELETE FROM admins WHERE email IS NULL OR TRIM(email) = '';")

        # 2. Admin Access Request Tickets Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_requests (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                department TEXT,
                reason TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reviewed_at DATETIME
            );
        """)

        # 3. Campuses Table
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

        # 4. Students Table
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

        # 5. Clubs Table
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

        # 6. Candidates Table
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

        # 7. Votes Table
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
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_admin_requests_email ON admin_requests(email);")

        conn.commit()
