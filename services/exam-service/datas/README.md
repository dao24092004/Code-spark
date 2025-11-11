# 📚 Excel Question Bank

This folder contains question banks in Excel format for different subjects.

## 📁 Files

| File | Subject | Description |
|------|---------|-------------|
| `bo_cau_hoi_Java.xlsx` | **Java** | Java programming questions |
| `bo_cau_hoi_C_co_ban.xlsx` | **C cơ bản** | Basic C programming questions |
| `bo_cau_hoi_C_nang_cao.xlsx` | **C nâng cao** | Advanced C programming questions |

## 📋 Excel Format

Expected columns (Row 1 = header, data starts from Row 2):

| Column | Field | Type | Description | Example |
|--------|-------|------|-------------|---------|
| **A** | STT | Number | Question number | 1, 2, 3, ... |
| **B** | Câu hỏi | Text | Question text | "Kết quả ch 3" |
| **C** | Đáp án A | Text | Option A | "6" |
| **D** | Đáp án B | Text | Option B | "5" |
| **E** | Đáp án C | Text | Option C | "10" |
| **F** | Đáp án D | Text | Option D | "Lỗi biên dịch" |
| **G** | Đáp án đúng | Text | Correct answer (letter OR full text) | **"B"** or **"Lỗi biên dịch"** ✅ |

### Notes:
- ✅ **Header row** (Row 1) will be skipped automatically
- ✅ **Correct answer** (Column G) can be:
  - **Single letter:** `A`, `B`, `C`, `D` → will map to option index
  - **Full text:** `Lỗi biên dịch` → will match against options A/B/C/D
- ✅ **Difficulty:** Default to 5 (medium) for all questions (not in Excel)
- ✅ **Explanation:** Not available in Excel files (will be `null`)
- ✅ **Empty rows** will be skipped automatically
- ⚠️  If correct answer doesn't match any option → defaults to A (with warning)

## 🚀 Import to Database

### Prerequisites

```bash
# Install Python 3.x
# Install dependencies
pip install openpyxl psycopg2-binary
```

### Run Import Script

```bash
cd Code-spark/services/exam-service

# Make sure PostgreSQL is running
# Default: localhost:5433, database: exam_db

# Run import
py scripts/import-questions-from-excel.py
```

### Expected Output

```
============================================================
📚 Excel Questions Import Tool
============================================================
✅ Connected to database: exam_db

📂 Processing: datas/bo_cau_hoi_Java.xlsx
   Subject: Java
   Tags: ['Java', 'Programming']
   ✅ Imported 10 questions...
   ✅ Imported 20 questions...
   ...
   ✅ Imported: 129 questions
   ⚠️  Skipped: 0 rows

📂 Processing: datas/bo_cau_hoi_C_co_ban.xlsx
   Subject: C cơ bản
   Tags: ['C', 'C cơ bản', 'Programming']
   ✅ Imported: 116 questions
   ⚠️  Skipped: 0 rows

📂 Processing: datas/bo_cau_hoi_C_nang_cao.xlsx
   Subject: C nâng cao
   Tags: ['C', 'C nâng cao', 'Programming']
   ✅ Imported: 128 questions
   ⚠️  Skipped: 0 rows

============================================================
🎉 Import Complete!
   Total imported: 373 questions
============================================================

🔍 Verifying import...

📊 Questions by tag:
   - C: 244 questions
   - C cơ bản: 116 questions
   - C nâng cao: 128 questions
   - Java: 129 questions
   - Programming: 373 questions
```

## 🎯 How It Works

### Database Schema

```sql
-- questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,           -- 'SINGLE_CHOICE'
    content JSONB NOT NULL,              -- { "question": "...", "options": [...], "correctAnswer": 0 }
    text VARCHAR(2000),                  -- Plain text question
    difficulty INTEGER,                  -- 1-10
    explanation TEXT,                    -- Optional explanation
    score INTEGER,                       -- Default 10 points
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- question_tags table (ElementCollection)
CREATE TABLE question_tags (
    question_id UUID REFERENCES questions(id),
    tag VARCHAR(255)
);
```

### Tag Mapping

Each imported question gets tagged with:

| Excel File | Subject Tag | Additional Tags |
|------------|-------------|-----------------|
| `bo_cau_hoi_Java.xlsx` | `Java` | `Programming` |
| `bo_cau_hoi_C_co_ban.xlsx` | `C cơ bản` | `C`, `Programming` |
| `bo_cau_hoi_C_nang_cao.xlsx` | `C nâng cao` | `C`, `Programming` |

**Why multiple tags?**
- **Primary tag** (e.g., "Java"): Used for exam subject dropdown
- **Secondary tags** (e.g., "Programming"): For flexible filtering

### Generate Questions Flow

```
┌─────────────────────────────────────┐
│ Admin: Create Exam                  │
│ Select subject: "Java"              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Admin: Generate Questions           │
│ Click "Sinh câu hỏi ngẫu nhiên"    │
│ Difficulty: Mixed                   │
│ Count: 30                           │
└────────────┬────────────────────────┘
             │ POST /exams/{id}/generate-questions
             │ Body: { tags: ["Java"], count: 30 }
             ▼
┌─────────────────────────────────────┐
│ Backend: QuestionService            │
│ 1. Query questions with tag="Java" │
│ 2. Filter by difficulty (if set)   │
│ 3. Shuffle results                  │
│ 4. Take random 30 questions         │
│ 5. Save to exam_questions table     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Database: exam_questions            │
│ ✅ 30 Java questions linked to exam│
└─────────────────────────────────────┘
```

## 🧪 Testing

### 1. Verify Import

```bash
# Check question counts
psql -h localhost -p 5433 -U postgres -d exam_db

SELECT tag, COUNT(*) 
FROM question_tags 
GROUP BY tag 
ORDER BY tag;

# Expected output:
#  tag         | count
# -------------+-------
#  C           |   244
#  C cơ bản    |   116
#  C nâng cao  |   128
#  Java        |   129
#  Programming |   373
```

### 2. Test via Admin Frontend

1. Open `http://localhost:4173/admin/exams`
2. Click **"Thêm đề thi mới"**
3. Subject dropdown should show:
   - **C**
   - **C cơ bản**
   - **C nâng cao**
   - **Java**
   - **Programming**

4. Create exam with subject = "Java"
5. Click **"Sinh câu hỏi ngẫu nhiên"**
6. Select exam → Choose difficulty → Generate
7. Verify questions in database:

```sql
SELECT COUNT(*) FROM exam_questions 
WHERE exam_id = '<exam-uuid>';

-- Should be 30 (or your chosen count)
```

### 3. Verify Question Content

```sql
-- Sample Java questions
SELECT q.text, q.difficulty 
FROM questions q 
JOIN question_tags qt ON q.id = qt.question_id 
WHERE qt.tag = 'Java' 
LIMIT 5;
```

## 📝 Customization

### Add More Subjects

1. **Add Excel file** to `datas/` folder
2. **Update import script** `scripts/import-questions-from-excel.py`:

```python
EXCEL_FILES = [
    # ... existing files ...
    {
        'file': 'datas/bo_cau_hoi_Python.xlsx',
        'subject': 'Python',
        'tags': ['Python', 'Programming']
    }
]
```

3. **Run import** again:

```bash
python scripts/import-questions-from-excel.py
```

4. **Frontend will auto-update** - No code changes needed! ✨

### Change Database Connection

Edit `scripts/import-questions-from-excel.py`:

```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'exam_db',
    'user': 'postgres',
    'password': 'your_password'  # Update here
}
```

## 🐛 Troubleshooting

### Problem 1: Import Script Fails

**Error:** `ModuleNotFoundError: No module named 'openpyxl'`

**Solution:**
```bash
pip install openpyxl psycopg2-binary
```

---

### Problem 2: Database Connection Failed

**Error:** `Connection refused`

**Check:**
```bash
# Is PostgreSQL running?
psql -h localhost -p 5433 -U postgres -l

# If not, start it:
docker-compose up -d postgres  # or your setup
```

---

### Problem 3: Subjects Don't Show in Frontend

**Check:**
```bash
# Verify tags in database
psql -h localhost -p 5433 -U postgres -d exam_db
SELECT DISTINCT tag FROM question_tags;

# Test backend API
curl http://localhost:9005/exams/subjects

# Should return: ["C", "C cơ bản", "C nâng cao", "Java", "Programming"]
```

---

### Problem 4: Generated Questions Are Empty

**Possible causes:**
- No questions with matching tag
- Difficulty filter too strict
- Exam subject doesn't match question tags

**Debug:**
```sql
-- Check available questions for a subject
SELECT COUNT(*) 
FROM questions q 
JOIN question_tags qt ON q.id = qt.question_id 
WHERE qt.tag = 'Java';

-- If 0 → Need to import questions first!
```

---

## 🎉 Summary

1. ✅ Add Excel files to `datas/` folder
2. ✅ Run import script: `python scripts/import-questions-from-excel.py`
3. ✅ Questions are tagged with subjects
4. ✅ Frontend auto-loads subjects from `/exams/subjects`
5. ✅ Generate questions filters by selected subject tag

**No frontend code changes needed!** 🚀

