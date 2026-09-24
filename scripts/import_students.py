#!/usr/bin/env python3
import sys
import os
import csv

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
import database as db

def import_students_from_csv(csv_path: str):
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)

    db.init_db()
    students_to_import = []
    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        field_map = {}
        for h in reader.fieldnames or []:
            norm = h.strip().lower().replace(" ", "_").replace("-", "_")
            if "enrollment" in norm or "student_id" in norm or "roll" in norm or norm == "id":
                field_map[h] = "enrollment_id"
            elif "name" in norm:
                field_map[h] = "name"
            elif "email" in norm or "mail" in norm:
                field_map[h] = "email"
            elif "dept" in norm or "department" in norm or "branch" in norm or "major" in norm:
                field_map[h] = "department"
            elif "campus" in norm or "location" in norm:
                field_map[h] = "campus"

        for row_idx, row in enumerate(reader, start=2):
            item = {
                "enrollment_id": None,
                "name": None,
                "email": None,
                "department": None,
                "campus": "Bengaluru Campus"
            }
            for raw_k, raw_v in row.items():
                if raw_k in field_map:
                    target = field_map[raw_k]
                    item[target] = (raw_v or "").strip()

            if not item["enrollment_id"] or not item["name"]:
                print(f"Skipping row {row_idx}: Missing required Enrollment ID or Student Name.")
                continue

            students_to_import.append(item)

    if not students_to_import:
        print("No valid student rows found in the CSV.")
        return

    print(f"Processing {len(students_to_import)} student records...")
    result = db.bulk_add_students(students_to_import)
    print("=" * 50)
    print("CSV IMPORT COMPLETE")
    print(f"Total Rows Processed : {result['total_processed']}")
    print(f"Successfully Saved   : {result['successful_records']}")
    if result["errors"]:
        print(f"Errors Encountered    : {len(result['errors'])}")
        for err in result["errors"]:
            print(f"   - {err}")
    print("=" * 50)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sample = os.path.join(os.path.dirname(__file__), "..", "data", "sample_students.csv")
        if os.path.exists(sample):
            print(f"Running sample import: {sample}")
            import_students_from_csv(sample)
    else:
        import_students_from_csv(sys.argv[1])
