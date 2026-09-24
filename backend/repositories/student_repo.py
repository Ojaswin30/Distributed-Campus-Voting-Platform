from typing import Optional, List, Dict, Any
from core.database import get_db
from repositories.campus_repo import normalize_campus_name


def get_students(campus: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch registered students, optionally filtered by campus.
    """
    with get_db() as conn:
        if campus:
            rows = conn.execute(
                "SELECT * FROM students WHERE LOWER(campus) = LOWER(?) ORDER BY name ASC", 
                (campus.strip(),)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM students ORDER BY name ASC").fetchall()
        return [dict(row) for row in rows]


def get_student_by_id(enrollment_id: str) -> Optional[Dict[str, Any]]:
    """
    Find student by case-insensitive enrollment ID.
    """
    if not enrollment_id:
        return None
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM students WHERE LOWER(enrollment_id) = LOWER(?)", 
            (enrollment_id.strip(),)
        ).fetchone()
        return dict(row) if row else None


def get_student_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Find student by email, enrollment ID, or normalized email username matching.
    """
    if not email:
        return None
    clean = email.strip().lower()
    
    with get_db() as conn:
        # 1. Exact email match (case-insensitive)
        row = conn.execute(
            "SELECT * FROM students WHERE LOWER(TRIM(email)) = LOWER(?)", 
            (clean,)
        ).fetchone()
        if row:
            return dict(row)

        # 2. Exact enrollment ID match (case-insensitive)
        row = conn.execute(
            "SELECT * FROM students WHERE LOWER(TRIM(enrollment_id)) = LOWER(?)", 
            (clean,)
        ).fetchone()
        if row:
            return dict(row)

        # 3. Exact normalized username match for identical email domain
        if '@' in clean:
            uname, domain = clean.split('@', 1)
            norm_uname = uname.replace('.', '').replace('_', '').replace('-', '')
            
            rows = conn.execute("SELECT * FROM students WHERE email IS NOT NULL AND email != ''").fetchall()
            for r in rows:
                db_email = r["email"].strip().lower()
                if '@' in db_email:
                    db_u, db_d = db_email.split('@', 1)
                    db_norm_u = db_u.replace('.', '').replace('_', '').replace('-', '')
                    if db_d == domain and db_norm_u == norm_uname:
                        return dict(r)

        return None


def get_student_by_email_or_id(identifier: str) -> Optional[Dict[str, Any]]:
    """
    Unified lookup by either email or enrollment ID.
    """
    return get_student_by_email(identifier)


def add_student(enrollment_id: str, name: str, email: Optional[str] = None, 
                department: Optional[str] = None, campus: str = "Bengaluru Campus") -> Dict[str, Any]:
    """
    Add or update a student record with normalized campus.
    """
    norm_campus = normalize_campus_name(campus)
    with get_db() as conn:
        conn.execute("""
            INSERT INTO students (enrollment_id, name, email, department, campus)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(enrollment_id) DO UPDATE SET
                name = excluded.name,
                email = excluded.email,
                department = excluded.department,
                campus = excluded.campus
        """, (enrollment_id.strip(), name.strip(), email.strip() if email else None, 
              department.strip() if department else None, norm_campus))
        conn.commit()
    return get_student_by_id(enrollment_id)


def bulk_add_students(students_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Bulk insert or update a list of students in a single transaction.
    """
    successful = 0
    errors = []
    
    with get_db() as conn:
        for idx, item in enumerate(students_data, 1):
            enrollment_id = str(item.get("enrollment_id") or item.get("Enrollment ID") or "").strip()
            name = str(item.get("name") or item.get("Name") or "").strip()
            email = str(item.get("email") or item.get("Student Campus email") or item.get("Email") or "").strip() or None
            department = str(item.get("department") or item.get("School") or item.get("Department") or "").strip() or None
            raw_campus = str(item.get("campus") or item.get("Center") or item.get("Campus") or "").strip()
            campus = normalize_campus_name(raw_campus)
            
            if not enrollment_id or not name:
                errors.append(f"Row {idx}: Missing Enrollment ID or Name.")
                continue
                
            try:
                conn.execute("""
                    INSERT INTO students (enrollment_id, name, email, department, campus)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(enrollment_id) DO UPDATE SET
                        name = excluded.name,
                        email = excluded.email,
                        department = excluded.department,
                        campus = excluded.campus
                """, (enrollment_id, name, email, department, campus))
                successful += 1
            except Exception as e:
                errors.append(f"Row {idx} ({enrollment_id}): {str(e)}")
        conn.commit()
        
    return {
        "total_processed": len(students_data),
        "successful_records": successful,
        "errors": errors
    }


def delete_student(enrollment_id: str) -> bool:
    """
    Delete a student and any candidate entries associated with them.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM candidates WHERE student_id = ?", (enrollment_id.strip(),))
        cursor.execute("DELETE FROM students WHERE enrollment_id = ?", (enrollment_id.strip(),))
        conn.commit()
        return cursor.rowcount > 0


def clear_all_students(campus: Optional[str] = None) -> int:
    """
    Deletes students and linked candidates.
    If campus is specified, deletes only students belonging to that campus.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        if campus and campus.strip():
            norm = normalize_campus_name(campus)
            cursor.execute("""
                DELETE FROM candidates 
                WHERE student_id IN (SELECT enrollment_id FROM students WHERE LOWER(campus) = LOWER(?))
            """, (norm,))
            cursor.execute("DELETE FROM students WHERE LOWER(campus) = LOWER(?)", (norm,))
        else:
            cursor.execute("DELETE FROM candidates")
            cursor.execute("DELETE FROM students")
        conn.commit()
        return cursor.rowcount
