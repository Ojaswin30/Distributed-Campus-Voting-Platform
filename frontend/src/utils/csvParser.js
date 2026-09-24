/**
 * Helper to parse a single CSV line with quote and comma handling
 */
export function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result.map(s => s.replace(/^["']|["']$/g, '').trim());
}

/**
 * Normalizes campus name based on keywords
 */
export function normalizeCampus(raw, defaultCampus = 'Bengaluru Campus') {
  if (!raw) return defaultCampus;
  const lower = raw.toLowerCase().trim();
  if (lower.includes('bengaluru') || lower.includes('bangalore') || lower === 'blr') return 'Bengaluru Campus';
  if (lower.includes('noida') || lower === 'noi') return 'Noida Campus';
  if (lower.includes('lucknow') || lower === 'lko') return 'Lucknow Campus';
  if (lower.includes('pune') || lower === 'pun') return 'Pune Campus';
  return raw.trim();
}

/**
 * Parses full CSV text into student objects with header auto-detection
 */
export function parseStudentCsv(csvText, defaultCampus = 'Bengaluru Campus') {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const firstLineCols = parseCsvLine(lines[0]);
  let hasHeader = false;
  const headerMap = {
    enrollment_id: -1,
    name: -1,
    email: -1,
    department: -1,
    campus: -1
  };

  firstLineCols.forEach((col, idx) => {
    const lower = col.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lower.includes('enrollment') || lower === 'id' || lower === 'studentid') {
      headerMap.enrollment_id = idx;
      hasHeader = true;
    } else if (lower === 'name' || lower.includes('studentname')) {
      headerMap.name = idx;
      hasHeader = true;
    } else if (lower.includes('email') || lower.includes('mail') || lower.includes('studentcampusemail')) {
      headerMap.email = idx;
      hasHeader = true;
    } else if (lower.includes('school') || lower.includes('dept') || lower.includes('department')) {
      headerMap.department = idx;
      hasHeader = true;
    } else if (lower.includes('center') || lower.includes('campus') || lower.includes('location')) {
      headerMap.campus = idx;
      hasHeader = true;
    }
  });

  const startIndex = hasHeader ? 1 : 0;
  const students = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    if (cols.length === 0) continue;

    let enrollmentId = '';
    let name = '';
    let email = '';
    let dept = '';
    let campus = '';

    if (hasHeader && headerMap.enrollment_id !== -1 && headerMap.name !== -1) {
      enrollmentId = cols[headerMap.enrollment_id] || '';
      name = cols[headerMap.name] || '';
      email = headerMap.email !== -1 ? cols[headerMap.email] || '' : '';
      dept = headerMap.department !== -1 ? cols[headerMap.department] || 'General Studies' : 'General Studies';
      campus = headerMap.campus !== -1 ? normalizeCampus(cols[headerMap.campus], defaultCampus) : defaultCampus;
    } else {
      // Positional fallback:
      if (cols.length >= 8) {
        enrollmentId = cols[0] || '';
        name = cols[1] || '';
        dept = cols[5] || 'General Studies';
        campus = normalizeCampus(cols[6], defaultCampus);
        email = cols[7] || '';
      } else {
        enrollmentId = cols[0] || '';
        name = cols[1] || '';
        email = cols[2] || '';
        dept = cols[3] || 'General Studies';
        campus = cols[4] ? normalizeCampus(cols[4], defaultCampus) : defaultCampus;
      }
    }

    if (enrollmentId && name) {
      students.push({
        enrollment_id: enrollmentId,
        name: name,
        email: email,
        department: dept,
        campus: campus || defaultCampus
      });
    }
  }

  return students;
}
