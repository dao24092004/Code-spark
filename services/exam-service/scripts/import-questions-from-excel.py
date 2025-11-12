#!/usr/bin/env python3
"""
Import questions from Excel files to PostgreSQL database.
Requires: pip install openpyxl psycopg2-binary

Usage:
    python import-questions-from-excel.py

Files to import:
    - datas/bo_cau_hoi_Java.xlsx
    - datas/bo_cau_hoi_C_co_ban.xlsx
    - datas/bo_cau_hoi_C_nang_cao.xlsx
"""

import openpyxl
import psycopg2
import json
import uuid
from datetime import datetime
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'exam_db',
    'user': 'postgres',
    'password': 'password'  # Change if needed
}

# Excel file mappings
EXCEL_FILES = [
    {
        'file': 'datas/bo_cau_hoi_Java.xlsx',
        'subject': 'Java',
        'tags': ['Java', 'Programming']
    },
    {
        'file': 'datas/bo_cau_hoi_C_co_ban.xlsx',
        'subject': 'C cơ bản',
        'tags': ['C', 'C cơ bản', 'Programming']
    },
    {
        'file': 'datas/bo_cau_hoi_C_nang_cao.xlsx',
        'subject': 'C nâng cao',
        'tags': ['C', 'C nâng cao', 'Programming']
    }
]

def parse_excel_row(row, subject):
    """
    Parse a single row from Excel into Question entity format.
    
    Expected Excel columns (ACTUAL format from screenshot):
    A: STT (number)
    B: Câu hỏi (question text)
    C: Đáp án A
    D: Đáp án B
    E: Đáp án C
    F: Đáp án D
    G: Đáp án đúng (full text of correct answer OR letter A/B/C/D)
    
    NOTE: No difficulty or explanation columns in actual files!
    
    Returns dict with Question fields or None if invalid row
    """
    # Skip if row is empty or header
    if not row[1] or str(row[1]).strip().lower() in ['câu hỏi', 'question', 'stt', '']:
        return None
    
    try:
        question_text = str(row[1]).strip()
        option_a = str(row[2]).strip() if row[2] else ""
        option_b = str(row[3]).strip() if row[3] else ""
        option_c = str(row[4]).strip() if row[4] else ""
        option_d = str(row[5]).strip() if row[5] else ""
        correct_answer_raw = str(row[6]).strip() if row[6] else ""
        
        # Build options list
        options = [option_a, option_b, option_c, option_d]
        
        # Determine correct answer index
        # Strategy 1: Check if it's a single letter (A/B/C/D)
        correct_answer_upper = correct_answer_raw.upper()
        if correct_answer_upper in ['A', 'B', 'C', 'D']:
            answer_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            correct_index = answer_map[correct_answer_upper]
        # Strategy 2: Match full text with options
        else:
            # Try to find exact match
            correct_index = -1
            for i, opt in enumerate(options):
                if opt.strip().lower() == correct_answer_raw.lower():
                    correct_index = i
                    break
            
            # If no exact match, try partial match
            if correct_index == -1:
                for i, opt in enumerate(options):
                    if correct_answer_raw.lower() in opt.lower() or opt.lower() in correct_answer_raw.lower():
                        correct_index = i
                        break
            
            # Default to A if still not found
            if correct_index == -1:
                print(f"   ⚠️  Could not match correct answer '{correct_answer_raw}' to any option, defaulting to A")
                correct_index = 0
        
        # Build content JSON
        content = {
            'question': question_text,
            'options': options,
            'correctAnswer': correct_index
        }
        
        return {
            'type': 'SINGLE_CHOICE',
            'content': json.dumps(content, ensure_ascii=False),
            'text': question_text,
            'difficulty': 5,  # Default medium difficulty (no difficulty in Excel)
            'explanation': None,  # No explanation in Excel
            'score': 10  # Default score
        }
    except Exception as e:
        print(f"⚠️  Error parsing row: {e}")
        return None

def import_excel_file(file_path, subject, tags, conn):
    """Import questions from a single Excel file."""
    print(f"\n📂 Processing: {file_path}")
    print(f"   Subject: {subject}")
    print(f"   Tags: {tags}")
    
    wb = openpyxl.load_workbook(file_path)
    sheet = wb.active
    
    cur = conn.cursor()
    imported_count = 0
    skipped_count = 0
    
    # Iterate through rows (skip header)
    for idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        question_data = parse_excel_row(row, subject)
        
        if not question_data:
            skipped_count += 1
            continue
        
        try:
            # Generate UUID
            question_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            # Insert into questions table
            cur.execute("""
                INSERT INTO questions (id, type, content, text, difficulty, explanation, score, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                question_id,
                question_data['type'],
                question_data['content'],
                question_data['text'],
                question_data['difficulty'],
                question_data['explanation'],
                question_data['score'],
                now
            ))
            
            # Insert tags into question_tags table
            for tag in tags:
                cur.execute("""
                    INSERT INTO question_tags (question_id, tag)
                    VALUES (%s, %s)
                """, (question_id, tag))
            
            imported_count += 1
            
            if imported_count % 10 == 0:
                print(f"   ✅ Imported {imported_count} questions...")
                
        except Exception as e:
            print(f"   ❌ Error inserting row {idx}: {e}")
            skipped_count += 1
    
    conn.commit()
    cur.close()
    
    print(f"   ✅ Imported: {imported_count} questions")
    print(f"   ⚠️  Skipped: {skipped_count} rows")
    
    return imported_count

def main():
    """Main import process."""
    print("=" * 60)
    print("📚 Excel Questions Import Tool")
    print("=" * 60)
    
    # Connect to database
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print(f"✅ Connected to database: {DB_CONFIG['database']}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    total_imported = 0
    
    # Process each Excel file
    for file_config in EXCEL_FILES:
        file_path = Path(__file__).parent.parent / file_config['file']
        
        if not file_path.exists():
            print(f"⚠️  File not found: {file_path}")
            continue
        
        try:
            count = import_excel_file(
                file_path,
                file_config['subject'],
                file_config['tags'],
                conn
            )
            total_imported += count
        except Exception as e:
            print(f"❌ Failed to import {file_path}: {e}")
    
    conn.close()
    
    print("\n" + "=" * 60)
    print(f"🎉 Import Complete!")
    print(f"   Total imported: {total_imported} questions")
    print("=" * 60)
    
    # Verify import
    print("\n🔍 Verifying import...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    cur.execute("SELECT tag, COUNT(*) FROM question_tags GROUP BY tag ORDER BY tag")
    results = cur.fetchall()
    
    print("\n📊 Questions by tag:")
    for tag, count in results:
        print(f"   - {tag}: {count} questions")
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()

