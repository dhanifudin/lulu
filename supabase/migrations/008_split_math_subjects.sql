-- ============================================================
-- Migration 008: Distinguish the two math subjects
-- ============================================================
-- The timetable has two math subjects (Cambridge English-medium vs. Indonesian
-- national curriculum) that both seeded as "Matematika" 🔢 and were
-- indistinguishable on the schedule. Give each a distinct name + emoji.

update lulu.subjects
   set name_id = 'Math (Cambridge)',
       name_en = 'Mathematics (Cambridge)',
       emoji   = '🧮'
 where key = 'mathematics';

update lulu.subjects
   set name_id = 'Matematika',
       name_en = 'Mathematics',
       emoji   = '🔢'
 where key = 'matematika';
