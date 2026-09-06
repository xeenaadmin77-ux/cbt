/**
 * XEENA INSTITUTE OF SKILL DEVELOPMENT - CBT Examination System
 * Firestore Automatic Seeder Script
 * 
 * Usage:
 * 1. Place your 'serviceAccountKey.json' in this project root folder, OR set:
 *    export FIREBASE_SERVICE_ACCOUNT="$(cat serviceAccountKey.json)"
 * 2. Run: node scripts/seed-firestore.mjs
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error('Failed to parse process.env.FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
  }
}

if (!serviceAccount) {
  const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(localKeyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
  }
}

if (!serviceAccount) {
  console.error('\n❌ Error: No Firebase Service Account found!');
  console.log('Please download "serviceAccountKey.json" from Firebase Console:');
  console.log('Project Settings -> Service Accounts -> Generate new private key');
  console.log('and put it in the project root directory, or set FIREBASE_SERVICE_ACCOUNT.\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
  console.log('🚀 Starting Firebase Firestore Database Initialization for Xeena CBT...\n');

  // 1. Settings Collection
  console.log('📁 1/6 Seeding settings collection...');
  await db.collection('settings').doc('public_config').set({
    collegeName: 'XEENA INSTITUTE OF SKILL DEVELOPMENT',
    tagline: 'Centre of Excellence in Vocational & Technical Training',
    labName: 'Main Computer Examination Lab',
    updatedAt: Date.now()
  });

  await db.collection('settings').doc('invigilator_secret').set({
    exitPassword: 'admin',
    updatedAt: Date.now()
  });
  console.log('  ✅ public_config & invigilator_secret created.');

  // 2. Teachers Collection
  console.log('\n📁 2/6 Seeding teachers collection...');
  await db.collection('teachers').doc('teacher_admin').set({
    uid: 'teacher_admin',
    name: 'Controller of Examinations',
    email: 'teamscartino07@gmail.com',
    role: 'teacher',
    active: true,
    createdAt: Date.now()
  });
  console.log('  ✅ Teacher record created (email: teamscartino07@gmail.com).');

  // 3. Students Collection
  console.log('\n📁 3/6 Seeding students collection...');
  const sampleStudents = [
    {
      uid: 'std_ranit_01',
      name: 'Ranit Biswas',
      username: 'ranit.biswas',
      admissionNumber: 'XEENA2025010',
      trade: 'COPA (Computer Operator)',
      batch: '2024-2025',
      rollNumber: 'ROLL-10',
      role: 'student',
      active: true,
      createdAt: Date.now()
    },
    {
      uid: 'std_001',
      name: 'Ramesh Kumar',
      username: 'ramesh.k',
      admissionNumber: 'XEENA2025001',
      trade: 'Electrician',
      batch: '2024-2026',
      rollNumber: 'ROLL-01',
      role: 'student',
      active: true,
      createdAt: Date.now()
    },
    {
      uid: 'std_002',
      name: 'Amit Sharma',
      username: 'amit.s',
      admissionNumber: 'XEENA2025002',
      trade: 'COPA (Computer Operator)',
      batch: '2024-2025',
      rollNumber: 'ROLL-02',
      role: 'student',
      active: true,
      createdAt: Date.now()
    },
    {
      uid: 'std_003',
      name: 'Priya Singh',
      username: 'priya.s',
      admissionNumber: 'XEENA2025003',
      trade: 'Fitter',
      batch: '2024-2026',
      rollNumber: 'ROLL-03',
      role: 'student',
      active: true,
      createdAt: Date.now()
    }
  ];

  for (const st of sampleStudents) {
    await db.collection('students').doc(st.uid).set(st);
  }
  console.log(`  ✅ ${sampleStudents.length} Students added to roster.`);

  // 4. Exams Collection
  console.log('\n📁 4/6 Seeding exams collection...');
  const examId = 'exam_copa_01';
  await db.collection('exams').doc(examId).set({
    examId,
    title: 'COPA Theory & Computer Fundamentals',
    month: 'September 2026',
    description: 'Hardware, Operating Systems, Networking Fundamentals, and Office Automation.',
    trade: 'COPA (Computer Operator)',
    durationMinutes: 30,
    enablePerQuestionTimer: false,
    perQuestionTimerSeconds: 60,
    passPercentage: 40,
    totalQuestions: 5,
    totalMarks: 50,
    published: true,
    showResultImmediately: false,
    resultsPublished: false,
    createdBy: 'teacher_admin',
    createdAt: Date.now()
  });
  console.log(`  ✅ Exam '${examId}' created.`);

  // 5. Questions Collection
  console.log('\n📁 5/6 Seeding questions collection...');
  const questions = [
    {
      questionId: 'q_copa_1',
      examId,
      questionSet: 'Set A',
      questionText: 'Which computer component is known as the "Brain of the Computer" responsible for processing instructions?',
      optionA: 'RAM (Random Access Memory)',
      optionB: 'CPU (Central Processing Unit)',
      optionC: 'Hard Disk Drive (HDD)',
      optionD: 'Motherboard',
      correctAnswer: 'B',
      marks: 10,
      timeLimitSeconds: 60
    },
    {
      questionId: 'q_copa_2',
      examId,
      questionSet: 'Set A',
      questionText: 'What type of memory is non-volatile and retains its contents when power is turned off?',
      optionA: 'SRAM',
      optionB: 'DRAM',
      optionC: 'ROM (Read Only Memory)',
      optionD: 'Cache Memory',
      correctAnswer: 'C',
      marks: 10,
      timeLimitSeconds: 60
    },
    {
      questionId: 'q_copa_3',
      examId,
      questionSet: 'Set A',
      questionText: 'Which keyboard shortcut is globally used in Windows to permanently delete a selected file bypassing the Recycle Bin?',
      optionA: 'Ctrl + Delete',
      optionB: 'Shift + Delete',
      optionC: 'Alt + Delete',
      optionD: 'Windows + Delete',
      correctAnswer: 'B',
      marks: 10,
      timeLimitSeconds: 60
    },
    {
      questionId: 'q_copa_4',
      examId,
      questionSet: 'Set A',
      questionText: 'What does the abbreviation "URL" stand for in web technologies?',
      optionA: 'Uniform Resource Locator',
      optionB: 'Universal Radio Link',
      optionC: 'United Resource Line',
      optionD: 'Unique Record List',
      correctAnswer: 'A',
      marks: 10,
      timeLimitSeconds: 60
    },
    {
      questionId: 'q_copa_5',
      examId,
      questionSet: 'Set A',
      questionText: 'In spreadsheet software like Microsoft Excel, which symbol MUST precede any calculation formula?',
      optionA: '# (Hash)',
      optionB: '@ (At the rate)',
      optionC: '= (Equal to)',
      optionD: '$ (Dollar)',
      correctAnswer: 'C',
      marks: 10,
      timeLimitSeconds: 60
    }
  ];

  for (const q of questions) {
    await db.collection('questions').doc(q.questionId).set(q);
  }
  console.log(`  ✅ ${questions.length} Questions added to '${examId}'.`);

  // 6. Audit Logs
  console.log('\n📁 6/6 Initializing auditLogs collection...');
  await db.collection('auditLogs').doc(`log_init_${Date.now()}`).set({
    logId: `log_init_${Date.now()}`,
    sessionId: 'SYSTEM',
    studentUid: 'SYSTEM',
    examId,
    eventType: 'DATABASE_INITIALIZED',
    details: 'Firestore database successfully seeded for Xeena CBT Examination System.',
    timestamp: Date.now()
  });
  console.log('  ✅ auditLogs initialized.');

  console.log('\n🎉 ALL DONE! Your Firebase Firestore database is 100% configured and ready!');
  console.log('You can now check Firebase Console -> Cloud Firestore.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
