-- ============================================================
-- Migration 003: Seed data
-- ============================================================

-- ---- Subjects ----
insert into lulu.subjects (key, name_id, name_en, emoji, color, category) values
  ('upacara',        'Upacara/Literasi', 'Assembly/Literacy',  '🏳️', '#C7CEEA', 'ceremony'),
  ('pembiasaan',     'Pembiasaan',       'Habituation',        '🌟', '#B5EAD7', 'habituation'),
  ('science',        'Sains',            'Science',            '🔬', '#B5EAD7', 'academic'),
  ('bhs_indonesia',  'Bahasa Indonesia', 'Indonesian',         '📖', '#FFD6E0', 'academic'),
  ('english',        'Bahasa Inggris',   'English',            '🇬🇧', '#C7CEEA', 'academic'),
  ('mathematics',    'Math (Cambridge)', 'Mathematics (Cambridge)', '🧮', '#FFE5EC', 'academic'),
  ('matematika',     'Matematika',       'Mathematics',             '🔢', '#FFE5EC', 'academic'),
  ('religion',       'Agama Islam',      'Religion',           '🕌', '#FFEAA7', 'academic'),
  ('ummi',           'UMMI',             'Quran (UMMI)',       '📿', '#FFEAA7', 'academic'),
  ('javanese',       'Bahasa Jawa',      'Javanese',           '🎎', '#FFD6E0', 'academic'),
  ('kesenian',       'Kesenian',         'Arts',               '🎨', '#FFB3C6', 'academic'),
  ('music',          'Musik',            'Music',              '🎵', '#FFB3C6', 'academic'),
  ('pe',             'Olahraga',         'PE',                 '⚽', '#B5EAD7', 'academic'),
  ('pramuka',        'Pramuka',          'Scouts',             '⚜️', '#B5EAD7', 'extracurricular'),
  ('ekskul',         'Ekstrakurikuler',  'Extracurricular',   '🎯', '#C7CEEA', 'extracurricular'),
  ('pend_pancasila', 'Pend. Pancasila',  'Civic Education',   '🦅', '#FFE5EC', 'academic'),
  ('listening',      'Listening & Speaking', 'Listening & Speaking', '👂', '#C7CEEA', 'academic'),
  ('break',          'Istirahat',        'Break',              '🍎', '#FFE5EC', 'break'),
  ('sholat',         'Sholat/Istirahat', 'Prayer/Break',       '🕌', '#FFEAA7', 'prayer')
on conflict (key) do nothing;

-- ---- Uniforms ----
insert into lulu.uniforms (day_of_week, name_id, name_en, emoji, color) values
  (1, 'Merah Putih',  'Red & White',  '🇮🇩', '#FF8FB1'),
  (2, 'Jas Biru',     'Blue Jacket',  '🧥', '#C7CEEA'),
  (3, 'Batik',        'Batik',        '👘', '#FFB347'),
  (4, 'Olahraga',     'Sports',       '👟', '#B5EAD7'),
  (5, 'Baju Adat',    'Traditional',  '👗', '#FFD6E0')
on conflict (day_of_week) do nothing;

-- ---- Schedule (I-B ICP) ----
-- MONDAY (1)
insert into lulu.schedule_slots (day_of_week, start_time, end_time, subject_key, label) values
  (1, '07:00', '07:15', 'upacara',       'Upacara/Literasi'),
  (1, '07:15', '07:50', 'upacara',       'Upacara/Literasi'),
  (1, '07:50', '08:25', 'science',       null),
  (1, '08:25', '09:00', 'science',       null),
  (1, '09:00', '09:15', 'break',         'Break Time'),
  (1, '09:15', '09:50', 'science',       null),
  (1, '09:50', '10:25', 'bhs_indonesia', null),
  (1, '10:25', '11:00', 'bhs_indonesia', null),
  (1, '11:00', '11:35', 'bhs_indonesia', null),
  (1, '11:35', '12:10', 'sholat',        'Sholat/Break'),
  (1, '12:10', '13:10', 'ummi',          null),
  (1, '13:20', '14:20', 'ekskul',        'Ekstrakurikuler');

-- TUESDAY (2)
insert into lulu.schedule_slots (day_of_week, start_time, end_time, subject_key, label) values
  (2, '07:00', '07:15', 'pembiasaan',  'Pembiasaan'),
  (2, '07:15', '07:50', 'religion',   null),
  (2, '07:50', '08:25', 'religion',   null),
  (2, '08:25', '09:00', 'religion',   null),
  (2, '09:00', '09:15', 'break',      'Break Time'),
  (2, '09:15', '09:50', 'english',    null),
  (2, '09:50', '10:25', 'english',    null),
  (2, '10:25', '11:00', 'javanese',   null),
  (2, '11:00', '11:35', 'javanese',   null),
  (2, '11:35', '12:10', 'sholat',     'Sholat/Break'),
  (2, '12:10', '13:10', 'ummi',       null);

-- WEDNESDAY (3)
insert into lulu.schedule_slots (day_of_week, start_time, end_time, subject_key, label) values
  (3, '07:00', '07:15', 'pembiasaan',  'Pembiasaan'),
  (3, '07:15', '07:50', 'english',    null),
  (3, '07:50', '08:25', 'english',    null),
  (3, '08:25', '09:00', 'mathematics', null),
  (3, '09:00', '09:15', 'break',      'Break Time'),
  (3, '09:15', '09:50', 'mathematics', null),
  (3, '09:50', '10:25', 'mathematics', null),
  (3, '10:25', '11:00', 'kesenian',   null),
  (3, '11:00', '11:35', 'kesenian',   null),
  (3, '11:35', '12:10', 'sholat',     'Sholat/Break'),
  (3, '12:10', '13:10', 'ummi',       null);

-- THURSDAY (4)
insert into lulu.schedule_slots (day_of_week, start_time, end_time, subject_key, label) values
  (4, '07:00', '07:15', 'pembiasaan', 'Pembiasaan'),
  (4, '07:15', '07:50', 'matematika', null),
  (4, '07:50', '08:25', 'matematika', null),
  (4, '08:25', '09:00', 'music',      null),
  (4, '09:00', '09:15', 'break',      'Break Time'),
  (4, '09:15', '09:50', 'music',      null),
  (4, '09:50', '10:25', 'pe',         null),
  (4, '10:25', '11:00', 'pe',         null),
  (4, '11:00', '11:35', 'pe',         null),
  (4, '11:35', '12:10', 'sholat',     'Sholat/Break'),
  (4, '12:10', '13:10', 'pramuka',    null),
  (4, '13:20', '14:20', 'ekskul',     'Ekstrakurikuler');

-- FRIDAY (5)
insert into lulu.schedule_slots (day_of_week, start_time, end_time, subject_key, label) values
  (5, '07:00', '07:15', 'pembiasaan',     'Pembiasaan'),
  (5, '07:15', '07:50', 'pend_pancasila', null),
  (5, '07:50', '08:25', 'pend_pancasila', null),
  (5, '08:25', '09:00', 'matematika',     null),
  (5, '09:00', '09:15', 'break',          'Break Time'),
  (5, '09:15', '09:50', 'matematika',     null),
  (5, '09:50', '10:25', 'listening',      null),
  (5, '10:25', '11:00', 'listening',      null);

-- ---- Starter Habits ----
insert into lulu.habits (name_id, name_en, emoji, sort_order, active) values
  ('Sikat Gigi',       'Brush Teeth',       '🦷', 1, true),
  ('Sholat Subuh',     'Fajr Prayer',       '🕌', 2, true),
  ('Baca Al-Qur''an',  'Read Quran',        '📿', 3, true),
  ('Sarapan',          'Eat Breakfast',     '🍳', 4, true),
  ('Beres-beres Tas',  'Pack School Bag',   '🎒', 5, true),
  ('Baca Buku',        'Read a Book',       '📖', 6, true),
  ('Rapikan Mainan',   'Tidy Toys',         '🧸', 7, true),
  ('Tidur Tepat Waktu','Sleep on Time',     '😴', 8, true);

-- ---- Calendar Events 2026/2027 ----
insert into lulu.calendar_events (start_date, end_date, title, type, description) values
  -- SEMESTER GANJIL
  ('2026-07-13','2026-07-13','Hari Pertama Masuk Sekolah','event','Tahun Ajaran Baru 2026/2027'),
  ('2026-07-13','2026-07-17','Pekan MPLS Kelas 2-6','activity','MPLS siswa-siswi kelas 2-6'),
  ('2026-07-13','2026-07-24','MPLS & Matrikulasi Kelas 1','activity','Pekan MPLS dan matrikulasi siswa/i kelas 1'),
  ('2026-08-03','2026-08-03','Mulai Efektif Mengaji & Ekskul','activity','Efektif kegiatan Mengaji/Pemantapan Kitab dan Ekstrakurikuler'),
  ('2026-08-13','2026-08-13','Lomba Agustusan','event','Lomba Agustusan'),
  ('2026-08-17','2026-08-17','HUT RI Ke-81','holiday','Peringatan HUT RI Ke-81 Tahun'),
  ('2026-08-25','2026-08-25','Peringatan Maulid Nabi','holiday','Peringatan Maulid Nabi Muhammnad SAW'),
  ('2026-08-29','2026-08-30','Kegiatan STAR Kelas 1-2','activity','Kegiatan Grand Design Siswa Tangguh Aktif dan Religius (STAR)'),
  ('2026-10-26','2026-10-30','Kegiatan Tengah Semester (KTS)','activity','KTS: Pengembangan diri melalui kegiatan Kokurikuler'),
  ('2026-10-29','2026-10-29','Outing Class','activity','Outing Class'),
  ('2026-10-30','2026-10-30','Student Day','event','Student Day'),
  ('2026-11-21','2026-11-21','Pertemuan Terakhir Ekskul Semester 1','activity','Pertemuan terakhir ekstrakurikuler semester 1'),
  ('2026-11-30','2026-11-30','Mulai ASAS 1','exam','Hari pertama Asesmen Sumatif Akhir Semester 1'),
  ('2026-12-01','2026-12-09','Pekan ASAS 1','exam','Pekan Asesmen Sumatif Akhir Semester 1'),
  ('2026-12-18','2026-12-18','Pembagian Rapot Semester 1','report','Pembagian rapot semester 1'),
  ('2026-12-21','2026-12-31','Libur Semester 1','holiday','Libur Semester 1'),
  ('2026-12-24','2026-12-25','Cuti & Libur Natal','holiday','Cuti bersama dan Libur Hari Besar Perayaan Natal'),
  -- SEMESTER GENAP
  ('2027-01-01','2027-01-01','Libur Tahun Baru Masehi','holiday','Libur Hari Besar Perayaan Tahun Baru Masehi'),
  ('2027-01-04','2027-01-04','Hari Pertama Semester 2','event','Hari pertama masuk semester 2'),
  ('2027-01-05','2027-01-05','Libur Isra Miraj','holiday','Libur Hari Besar Isra'' Miraj'),
  ('2027-01-11','2027-01-11','Mulai Efektif Ekskul Semester 2','activity','Mulai efektif kegiatan ekstrakurikuler semester 2'),
  ('2027-02-06','2027-02-06','Tahun Baru Imlek','holiday','Tahun Baru Imlek'),
  ('2027-02-08','2027-02-10','Libur Awal Puasa Ramadhan','holiday','Libur awal puasa Ramadhan 1448 H'),
  ('2027-02-09','2027-02-09','Hari Raya Nyepi','holiday','Hari Raya Nyepi'),
  ('2027-03-08','2027-03-17','Libur Hari Raya Idul Fitri','holiday','Libur Hari Raya Idul Fitri 1448 H'),
  ('2027-03-26','2027-03-26','Libur Wafat Yesus Kristus','holiday','Libur Hari Besar Wafat Yesus Kristus'),
  ('2027-04-21','2027-04-22','Perkiraan TKA 2026','exam','Perkiraan pelaksanaan Tes Kemampuan Akademik (TKA) 2026'),
  ('2027-05-06','2027-05-06','Libur Kenaikan Yesus Kristus','holiday','Libur Hari Besar Kenaikan Yesus Kristus'),
  ('2027-05-10','2027-05-12','International Checkpoint Test Kelas 6','exam','Perkiraan International Checkpoint Test (ICT) 2026 bagi kelas 6 ICP'),
  ('2027-05-13','2027-05-13','Manasik Haji Kelas 4-5','activity','Kegiatan Manasik Haji bagi siswa/i kelas 4-5'),
  ('2027-05-17','2027-05-17','Libur Idul Adha','holiday','Libur Hari Raya Idul Adha 1448 H'),
  ('2027-05-20','2027-05-20','Libur Hari Raya Waisak','holiday','Libur Hari Raya Waisak 2571'),
  ('2027-05-22','2027-05-22','Pertemuan Terakhir Ekskul Semester 2','activity','Pertemuan terakhir ekstrakurikuler semester 1'),
  ('2027-05-26','2027-05-28','International Progression Test Kelas 3-5','exam','Perkiraan IPT 2026 bagi kelas 3-5 ICP'),
  ('2027-05-31','2027-05-31','Mulai ASAS 2','exam','Perkiraan hari pertama pekan Asesmen Sumatif Akhir Semester 2'),
  ('2027-06-01','2027-06-01','Libur Lahirnya Pancasila','holiday','Libur Hari Besar Lahirnya Pancasila'),
  ('2027-06-02','2027-06-10','Pekan ASAS 2','exam','Perkiraan pekan Asesmen Sumatif Akhir Semester 2'),
  ('2027-06-18','2027-06-18','Pembagian Rapot Semester 2','report','Pembagian rapot semester 2'),
  ('2027-06-21','2027-06-30','Libur Semester 2','holiday','Libur semester 2/kenaikan kelas');
