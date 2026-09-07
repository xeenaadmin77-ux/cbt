import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
const publicPath = path.join(process.cwd(), 'dist');

app.use(express.static(publicPath));

// ----------------------------------------------------
// In-Memory Data Store (Synchronized CBT Datastore)
// ----------------------------------------------------

interface Student {
  uid: string;
  name: string;
  username: string;
  admissionNumber: string; // Acts as Password (Admission Form Number)
  trade: string;
  batch: string;
  rollNumber?: string;
  role: 'student';
}

interface Question {
  questionId: string;
  examId: string;
  questionSet?: string; // e.g. "Set A", "Set B", "Common"
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
  timeLimitSeconds?: number; // per-question timer in seconds (0 = full exam timer)
}

interface Exam {
  examId: string;
  title: string;
  month?: string; // e.g. "September 2026", "Monthly Assessment - Oct 2026"
  description: string;
  trade: string;
  durationMinutes: number;
  enablePerQuestionTimer?: boolean; // toggle per-question timer mode
  perQuestionTimerSeconds?: number; // default per-question timer seconds
  passPercentage: number;
  totalQuestions: number;
  totalMarks: number;
  published: boolean;
  showResultImmediately: boolean;
  resultsPublished: boolean;
  createdAt: number;
}

interface ExamSession {
  sessionId: string;
  examId: string;
  studentUid: string;
  studentName: string;
  admissionNumber: string;
  startTime: number;
  expiryTime: number;
  status: 'in_progress' | 'submitted' | 'expired' | 'terminated';
  questionOrder: string[]; // Shuffled question IDs
  answers: Record<string, string>;
  markedQuestions: string[];
  terminatedReason?: string;
}

interface Result {
  resultId: string;
  sessionId: string;
  examId: string;
  examTitle: string;
  studentUid: string;
  studentName: string;
  admissionNumber: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: number;
  isAutoExpired: boolean;
  breakdown: Array<{
    questionId: string;
    questionText: string;
    selectedOption: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    marksAwarded: number;
  }>;
}

interface AuditLog {
  logId: string;
  sessionId: string;
  studentUid: string;
  examId: string;
  eventType: string;
  details: string;
  timestamp: number;
}

interface Settings {
  collegeName: string;
  tagline: string;
  labName: string;
  exitPassword: string;
}

// Initial Seed Data
const settings: Settings = {
  collegeName: 'XEENA INSTITUTE OF SKILL DEVELOPMENT',
  tagline: 'Centre of Excellence in Vocational & Technical Training',
  labName: 'Main Computer Examination Lab',
  exitPassword: 'admin'
};

const students: Student[] = [
  {
    uid: 'std_ranit_01',
    name: 'Ranit Biswas',
    username: 'ranit.biswas',
    admissionNumber: 'XEENA2025010',
    trade: 'COPA (Computer Operator)',
    batch: '2024-2025',
    rollNumber: 'ROLL-10',
    role: 'student'
  },
  {
    uid: 'std_001',
    name: 'Ramesh Kumar',
    username: 'ramesh.k',
    admissionNumber: 'XEENA2025001',
    trade: 'Electrician',
    batch: '2024-2026',
    rollNumber: 'ROLL-01',
    role: 'student'
  },
  {
    uid: 'std_002',
    name: 'Amit Sharma',
    username: 'amit.s',
    admissionNumber: 'XEENA2025002',
    trade: 'COPA (Computer Operator)',
    batch: '2024-2025',
    rollNumber: 'ROLL-02',
    role: 'student'
  },
  {
    uid: 'std_003',
    name: 'Priya Singh',
    username: 'priya.s',
    admissionNumber: 'XEENA2025003',
    trade: 'Fitter',
    batch: '2024-2026',
    rollNumber: 'ROLL-03',
    role: 'student'
  }
];

const exams: Exam[] = [
  {
    examId: 'exam_copa_01',
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
    createdAt: Date.now() - 43200000
  },
  {
    examId: 'exam_electrician_01',
    title: 'Electrician Theory - Monthly Assessment',
    month: 'September 2026',
    description: 'Covers Electrical Safety, Basic Ohm\'s Law, Circuit Components, and Measuring Tools.',
    trade: 'Electrician',
    durationMinutes: 20,
    enablePerQuestionTimer: true,
    perQuestionTimerSeconds: 60,
    passPercentage: 40,
    totalQuestions: 4,
    totalMarks: 10,
    published: true,
    showResultImmediately: false,
    resultsPublished: false,
    createdAt: Date.now() - 86400000
  }
];

const questions: Question[] = [
  {
    questionId: 'q_elec_1',
    examId: 'exam_electrician_01',
    questionSet: 'Set A',
    questionText: 'Which law states that current flowing through a conductor is directly proportional to the potential difference across its ends, provided temperature remains constant?',
    optionA: 'Coulomb\'s Law',
    optionB: 'Ohm\'s Law',
    optionC: 'Faraday\'s Law',
    optionD: 'Kirchhoff\'s Voltage Law',
    correctAnswer: 'B',
    marks: 2,
    timeLimitSeconds: 60
  },
  {
    questionId: 'q_elec_2',
    examId: 'exam_electrician_01',
    questionSet: 'Set A',
    questionText: 'What is the standard unit of Electrical Resistance?',
    optionA: 'Volt',
    optionB: 'Ampere',
    optionC: 'Ohm',
    optionD: 'Watt',
    correctAnswer: 'C',
    marks: 2,
    timeLimitSeconds: 45
  },
  {
    questionId: 'q_elec_3',
    examId: 'exam_electrician_01',
    questionSet: 'Set A',
    questionText: 'Which class of fire extinguisher is specifically recommended for extinguishing electrical fires in a workshop?',
    optionA: 'Class A (Water type)',
    optionB: 'Class B (Foam type)',
    optionC: 'Class C (Halon / CO2 / Dry Powder)',
    optionD: 'Class D (Combustible metals)',
    correctAnswer: 'C',
    marks: 3,
    timeLimitSeconds: 60
  },
  {
    questionId: 'q_elec_4',
    examId: 'exam_electrician_01',
    questionSet: 'Set B',
    questionText: 'Which instrument is used to measure extremely high insulation resistance in wiring installations?',
    optionA: 'Multimeter',
    optionB: 'Megger (Insulation Tester)',
    optionC: 'Ammeter',
    optionD: 'Energy Meter',
    correctAnswer: 'B',
    marks: 3,
    timeLimitSeconds: 60
  },
  {
    questionId: 'q_copa_1',
    examId: 'exam_copa_01',
    questionSet: 'Set A',
    questionText: 'Which component is known as the "Brain" of a computer system?',
    optionA: 'Random Access Memory (RAM)',
    optionB: 'Central Processing Unit (CPU)',
    optionC: 'Hard Disk Drive',
    optionD: 'Graphics Processing Unit (GPU)',
    correctAnswer: 'B',
    marks: 10,
    timeLimitSeconds: 60
  },
  {
    questionId: 'q_copa_2',
    examId: 'exam_copa_01',
    questionSet: 'Set A',
    questionText: 'What type of memory is non-volatile and retains its contents when power is turned off?',
    optionA: 'RAM',
    optionB: 'Cache Memory',
    optionC: 'ROM (Read-Only Memory)',
    optionD: 'Virtual Memory',
    correctAnswer: 'C',
    marks: 10,
    timeLimitSeconds: 60
  },
  {
    questionId: 'q_copa_3',
    examId: 'exam_copa_01',
    questionSet: 'Set A',
    questionText: 'Which keyboard shortcut is globally used in Windows to permanently delete a selected file bypassing the Recycle Bin?',
    optionA: 'Ctrl + Delete',
    optionB: 'Shift + Delete',
    optionC: 'Alt + Delete',
    optionD: 'Ctrl + Shift + Esc',
    correctAnswer: 'B',
    marks: 10,
    timeLimitSeconds: 60
  },
  {
    questionId: 'q_copa_4',
    examId: 'exam_copa_01',
    questionSet: 'Set A',
    questionText: 'What does the abbreviation "URL" stand for in web technologies?',
    optionA: 'Uniform Resource Locator',
    optionB: 'Universal Radio Link',
    optionC: 'United Resource Language',
    optionD: 'Uniform Route Line',
    correctAnswer: 'A',
    marks: 10,
    timeLimitSeconds: 60
  },
  {
    questionId: 'q_copa_5',
    examId: 'exam_copa_01',
    questionSet: 'Set B',
    questionText: 'In spreadsheet software like Microsoft Excel, which symbol MUST precede any calculation formula?',
    optionA: '# (Hash)',
    optionB: '$ (Dollar)',
    optionC: '= (Equals)',
    optionD: '@ (At rate)',
    correctAnswer: 'C',
    marks: 10,
    timeLimitSeconds: 60
  }
];

const sessions: Map<string, ExamSession> = new Map();
const results: Result[] = [
  {
    resultId: 'res_seed_ranit_01',
    sessionId: 'sess_ranit_seed',
    examId: 'exam_copa_01',
    examTitle: 'COPA Theory & Computer Fundamentals (September 2026)',
    studentUid: 'std_ranit_01',
    studentName: 'Ranit Biswas',
    admissionNumber: 'XEENA2025010',
    score: 40,
    totalMarks: 50,
    percentage: 80,
    passed: true,
    submittedAt: Date.now() - 3600000 * 2,
    isAutoExpired: false,
    breakdown: [
      {
        questionId: 'q_copa_1',
        questionText: 'Which component is known as the "Brain" of a computer system?',
        selectedOption: 'B',
        correctAnswer: 'B',
        isCorrect: true,
        marksAwarded: 10
      },
      {
        questionId: 'q_copa_2',
        questionText: 'What type of memory is non-volatile and retains its contents when power is turned off?',
        selectedOption: 'C',
        correctAnswer: 'C',
        isCorrect: true,
        marksAwarded: 10
      },
      {
        questionId: 'q_copa_3',
        questionText: 'Which keyboard shortcut is globally used in Windows to permanently delete a selected file bypassing the Recycle Bin?',
        selectedOption: 'B',
        correctAnswer: 'B',
        isCorrect: true,
        marksAwarded: 10
      },
      {
        questionId: 'q_copa_4',
        questionText: 'What does the abbreviation "URL" stand for in web technologies?',
        selectedOption: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        marksAwarded: 10
      },
      {
        questionId: 'q_copa_5',
        questionText: 'In spreadsheet software like Microsoft Excel, which symbol MUST precede any calculation formula?',
        selectedOption: 'B',
        correctAnswer: 'C',
        isCorrect: false,
        marksAwarded: 0
      }
    ]
  },
  {
    resultId: 'res_seed_ramesh_01',
    sessionId: 'sess_ramesh_seed',
    examId: 'exam_electrician_01',
    examTitle: 'Electrician Theory - Monthly Assessment (September 2026)',
    studentUid: 'std_001',
    studentName: 'Ramesh Kumar',
    admissionNumber: 'XEENA2025001',
    score: 8,
    totalMarks: 10,
    percentage: 80,
    passed: true,
    submittedAt: Date.now() - 3600000 * 4,
    isAutoExpired: false,
    breakdown: []
  },
  {
    resultId: 'res_seed_amit_01',
    sessionId: 'sess_amit_seed',
    examId: 'exam_copa_01',
    examTitle: 'COPA Theory & Computer Fundamentals (September 2026)',
    studentUid: 'std_002',
    studentName: 'Amit Sharma',
    admissionNumber: 'XEENA2025002',
    score: 30,
    totalMarks: 50,
    percentage: 60,
    passed: true,
    submittedAt: Date.now() - 3600000 * 5,
    isAutoExpired: false,
    breakdown: []
  }
];
const auditLogs: AuditLog[] = [];

// ----------------------------------------------------
// Google Firebase Firestore Cloud Database Persistence
// ----------------------------------------------------
let firestoreDb: Firestore | null = null;

function getFirestoreDb(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  try {
    let serviceAccount: any = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e: any) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON environment variable:', e.message);
      }
    }
    if (!serviceAccount) {
      const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(localKeyPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
        } catch (e: any) {
          console.error('Failed to parse serviceAccountKey.json file:', e.message);
        }
      }
    }

    if (serviceAccount) {
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount)
        });
      }
      firestoreDb = getFirestore();
      console.log('✅ Connected to Google Firebase Cloud Firestore successfully!');
      syncFromFirestore();
    } else {
      console.log('ℹ️ Running in-memory database mode (FIREBASE_SERVICE_ACCOUNT not configured yet).');
    }
  } catch (err: any) {
    console.warn('⚠️ Firebase initialization status:', err.message);
  }
  return firestoreDb;
}

// Background sync from Firestore to memory on server boot
async function syncFromFirestore() {
  if (!firestoreDb) return;
  try {
    // 1. Settings
    const cfgSnap = await firestoreDb.collection('settings').doc('public_config').get();
    if (cfgSnap.exists) {
      const d = cfgSnap.data();
      if (d?.collegeName) settings.collegeName = d.collegeName;
      if (d?.tagline) settings.tagline = d.tagline;
      if (d?.labName) settings.labName = d.labName;
    }
    const secSnap = await firestoreDb.collection('settings').doc('invigilator_secret').get();
    if (secSnap.exists) {
      const d = secSnap.data();
      if (d?.exitPassword) settings.exitPassword = d.exitPassword;
    }

    // 2. Students
    const stdSnap = await firestoreDb.collection('students').get();
    if (!stdSnap.empty) {
      const loadedStudents: Student[] = [];
      stdSnap.forEach(doc => loadedStudents.push(doc.data() as Student));
      if (loadedStudents.length > 0) {
        students.length = 0;
        students.push(...loadedStudents);
      }
    }

    // 3. Exams
    const exSnap = await firestoreDb.collection('exams').get();
    if (!exSnap.empty) {
      const loadedExams: Exam[] = [];
      exSnap.forEach(doc => loadedExams.push(doc.data() as Exam));
      if (loadedExams.length > 0) {
        exams.length = 0;
        exams.push(...loadedExams);
      }
    }

    // 4. Questions
    const qSnap = await firestoreDb.collection('questions').get();
    if (!qSnap.empty) {
      const loadedQuestions: Question[] = [];
      qSnap.forEach(doc => loadedQuestions.push(doc.data() as Question));
      if (loadedQuestions.length > 0) {
        questions.length = 0;
        questions.push(...loadedQuestions);
      }
    }

    // 5. Results
    const resSnap = await firestoreDb.collection('results').get();
    if (!resSnap.empty) {
      const loadedResults: Result[] = [];
      resSnap.forEach(doc => loadedResults.push(doc.data() as Result));
      if (loadedResults.length > 0) {
        results.length = 0;
        results.push(...loadedResults);
      }
    }

    console.log(`✅ Loaded from Firebase Firestore: ${students.length} students, ${exams.length} exams, ${questions.length} questions, ${results.length} results.`);
  } catch (err: any) {
    console.warn('⚠️ Firestore sync check:', err.message);
  }
}

// Background firestore writer helper
async function firestoreSave(collection: string, docId: string, data: any): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  try {
    await db.collection(collection).doc(docId).set(data, { merge: true });
  } catch (err: any) {
    console.warn(`Firestore save error on ${collection}/${docId}:`, err.message);
  }
}

function firestoreDelete(collection: string, docId: string) {
  const db = getFirestoreDb();
  if (!db) return;
  db.collection(collection).doc(docId).delete().catch(err => {
    console.warn(`Firestore delete error on ${collection}/${docId}:`, err.message);
  });
}

// Check Firebase connection on startup
getFirestoreDb();

// ----------------------------------------------------
// Firebase Authentication Middleware
// ----------------------------------------------------
async function authenticateFirebaseToken(req: any, res: any, next: any) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const token = header.slice(7).trim();

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const db = getFirestoreDb();

    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Authentication service is temporarily unavailable.'
      });
    }

    const teacherDoc = await db.collection('teachers').doc(decodedToken.uid).get();

    if (!teacherDoc.exists) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher account is not authorized.'
      });
    }

    const teacherData = teacherDoc.data() || {};
    const role = teacherData.role || decodedToken.role;

    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher permission required.'
      });
    }

    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || teacherData.email || '',
      name: teacherData.name || decodedToken.name || '',
      role
    };

    next();
  } catch (error: any) {
    console.error('Firebase token verification failed:', error.message);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Protect all teacher/admin API endpoints with Firebase Authentication.
app.use('/api/teacher', authenticateFirebaseToken);

// 1. Settings & Branding
app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings });
});

app.post('/api/settings', authenticateFirebaseToken, (req, res) => {
  const { collegeName, tagline, labName, exitPassword } = req.body;
  if (collegeName) settings.collegeName = collegeName;
  if (tagline !== undefined) settings.tagline = tagline;
  if (labName !== undefined) settings.labName = labName;
  if (exitPassword) settings.exitPassword = exitPassword;

  // Persist to Cloud Firestore
  firestoreSave('settings', 'public_config', {
    collegeName: settings.collegeName,
    tagline: settings.tagline,
    labName: settings.labName,
    updatedAt: Date.now()
  });
  if (exitPassword) {
    firestoreSave('settings', 'invigilator_secret', {
      exitPassword: settings.exitPassword,
      updatedAt: Date.now()
    });
  }

  res.json({ success: true, settings });
});

// 2. Student Authentication (Username/Name + Admission Form Number as Password)
app.post('/api/student-login', (req, res) => {
  const { username, password, studentName, admissionNumber } = req.body;
  
  const userIdentifier = String(username || studentName || '').trim();
  const passIdentifier = String(password || admissionNumber || '').trim().toUpperCase();

  if (!userIdentifier || !passIdentifier) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username (অথবা নাম) এবং কলেজ অ্যাডমিশন ফর্ম নম্বর (Password) উভয়ই প্রয়োজন।' 
    });
  }

  const cleanUser = userIdentifier.toLowerCase();

  // 1. Look up student in roster: Admission Number acts as the authoritative password
  let student = students.find(s => {
    const matchesPass = s.admissionNumber.toUpperCase() === passIdentifier;
    const matchesUser = (s.username && s.username.toLowerCase() === cleanUser) ||
                        (s.name.toLowerCase() === cleanUser) ||
                        (s.admissionNumber.toUpperCase() === cleanUser.toUpperCase());
    return matchesPass && matchesUser;
  });

  // 2. Admission number + username/name must both match an enrolled student.
  // Do NOT create a new student dynamically during login.
  if (!student) {
    return res.status(401).json({
      success: false,
      message: 'ভুল Username/Name অথবা Admission Form Number। আগে কলেজের roster-এ student হিসেবে যুক্ত হতে হবে।'
    });
  }

  res.json({
    success: true,
    user: {
      uid: student.uid,
      name: student.name,
      username: student.username || student.name.toLowerCase().replace(/\s+/g, '.'),
      admissionNumber: student.admissionNumber,
      trade: student.trade,
      batch: student.batch,
      rollNumber: student.rollNumber || '',
      role: 'student'
    }
  });
});

// 3. Teacher Authentication
// Teacher authentication is handled by Firebase Authentication on the client.
// The server verifies the Firebase ID token through authenticateFirebaseToken.

// 4. Available Exams for Student
app.get('/api/available-exams', (req, res) => {
  const { studentUid } = req.query;

  const list = exams.filter(e => e.published).map(exam => {
    // Check if student has active session or result
    let userStatus = 'available';
    let sessionId = '';

    const existingResult = results.find(r => r.studentUid === studentUid && r.examId === exam.examId);
    if (existingResult) {
      userStatus = 'submitted';
      sessionId = existingResult.sessionId;
    } else {
      // Check session map
      for (const [sId, sess] of sessions.entries()) {
        if (sess.studentUid === studentUid && sess.examId === exam.examId) {
          userStatus = sess.status;
          sessionId = sId;
          break;
        }
      }
    }

    return {
      examId: exam.examId,
      title: exam.title,
      description: exam.description,
      trade: exam.trade,
      durationMinutes: exam.durationMinutes,
      totalQuestions: exam.totalQuestions,
      totalMarks: exam.totalMarks,
      passPercentage: exam.passPercentage,
      resultsPublished: Boolean(exam.resultsPublished),
      userStatus,
      sessionId
    };
  });

  res.json({ success: true, exams: list });
});

// 5. Start / Resume Exam Session
app.post('/api/start-session', (req, res) => {
  const { examId, studentUid } = req.body;
  if (!examId || !studentUid) {
    return res.status(400).json({ success: false, message: 'Missing examId or studentUid' });
  }

  // Always load student identity from the enrolled roster.
  // Never trust studentName/admissionNumber supplied by the client.
  const enrolledStudent = students.find(s => s.uid === studentUid);
  if (!enrolledStudent) {
    return res.status(401).json({
      success: false,
      message: 'Student roster-এ এই student পাওয়া যায়নি।'
    });
  }

  const exam = exams.find(e => e.examId === examId);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  // Check if session already exists
  let existingSessionId: string | null = null;
  for (const [sId, sess] of sessions.entries()) {
    if (sess.studentUid === studentUid && sess.examId === examId) {
      existingSessionId = sId;
      break;
    }
  }

  let session: ExamSession;
  const examQuestions = questions.filter(q => q.examId === examId);

  if (existingSessionId) {
    session = sessions.get(existingSessionId)!;
  } else {
    // Create new session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = Date.now();
    const expiryTime = now + exam.durationMinutes * 60 * 1000;

    // Randomize question order for anti-cheating (Section 11)
    const shuffledIds = examQuestions.map(q => q.questionId).sort(() => Math.random() - 0.5);

    session = {
      sessionId,
      examId,
      studentUid,
      studentName: enrolledStudent.name,
      admissionNumber: enrolledStudent.admissionNumber,
      startTime: now,
      expiryTime,
      status: 'in_progress',
      questionOrder: shuffledIds,
      answers: {},
      markedQuestions: []
    };

    sessions.set(sessionId, session);
  }

  // CRITICAL SECURITY RULE: Strip correct answers before returning to client!
  const orderedClientQuestions = session.questionOrder.map(qId => {
    const q = examQuestions.find(item => item.questionId === qId);
    if (!q) return null;
    return {
      questionId: q.questionId,
      examId: q.examId,
      questionSet: q.questionSet || 'General',
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      marks: q.marks,
      timeLimitSeconds: q.timeLimitSeconds || (exam.enablePerQuestionTimer ? (exam.perQuestionTimerSeconds || 60) : 0)
    };
  }).filter(Boolean);

  res.json({
    success: true,
    session: {
      sessionId: session.sessionId,
      startTime: session.startTime,
      expiryTime: session.expiryTime,
      status: session.status,
      answers: session.answers,
      markedQuestions: session.markedQuestions
    },
    exam: {
      examId: exam.examId,
      title: exam.title,
      month: exam.month || '',
      durationMinutes: exam.durationMinutes,
      enablePerQuestionTimer: exam.enablePerQuestionTimer || false,
      perQuestionTimerSeconds: exam.perQuestionTimerSeconds || 0,
      totalQuestions: exam.totalQuestions,
      totalMarks: exam.totalMarks
    },
    questions: orderedClientQuestions,
    serverTimeNow: Date.now()
  });
});

// 6. Save Single Answer (Auto-save)
app.post('/api/save-answer', (req, res) => {
  const { sessionId, questionId, selectedOption } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, message: 'Active session not found' });
  }

  if (session.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: 'Session is no longer in progress' });
  }

  if (selectedOption === null) {
    delete session.answers[questionId];
  } else {
    session.answers[questionId] = selectedOption;
  }

  res.json({ success: true });
});

// 7. Submit Examination (Server-Authoritative Evaluation)
app.post('/api/submit-exam', async (req, res) => {
  const { sessionId, answers, isAutoExpired } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  const exam = exams.find(e => e.examId === session.examId);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }

  // Update session status
  session.status = isAutoExpired ? 'expired' : 'submitted';
  if (answers) {
    session.answers = { ...session.answers, ...answers };
  }

  // Server-side scoring against stored answer keys
  const examQuestions = questions.filter(q => q.examId === exam.examId);
  let totalScore = 0;
  let totalMaxMarks = 0;

  const breakdown = examQuestions.map(q => {
    const studentChoice = session.answers[q.questionId] || null;
    const isCorrect = studentChoice === q.correctAnswer;
    const marksAwarded = isCorrect ? q.marks : 0;

    totalScore += marksAwarded;
    totalMaxMarks += q.marks;

    return {
      questionId: q.questionId,
      questionText: q.questionText,
      selectedOption: studentChoice,
      correctAnswer: q.correctAnswer,
      isCorrect,
      marksAwarded
    };
  });

  const percentage = totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;
  const passed = percentage >= exam.passPercentage;
  const isResultsPublished = Boolean(exam.resultsPublished);

  const result: Result = {
    resultId: `res_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    sessionId: session.sessionId,
    examId: exam.examId,
    examTitle: exam.title,
    studentUid: session.studentUid,
    studentName: session.studentName,
    admissionNumber: session.admissionNumber,
    score: totalScore,
    totalMarks: totalMaxMarks,
    percentage,
    passed,
    submittedAt: Date.now(),
    isAutoExpired: Boolean(isAutoExpired),
    breakdown: breakdown // Always keep full breakdown on server for faculty!
  };

  results.push(result);

  // Persist result and session to Cloud Firestore
  await firestoreSave('results', result.resultId, result);
  await firestoreSave('examSessions', session.sessionId, {
    sessionId: session.sessionId,
    examId: session.examId,
    studentUid: session.studentUid,
    studentName: session.studentName,
    admissionNumber: session.admissionNumber,
    startTime: session.startTime,
    expiryTime: session.expiryTime,
    status: session.status,
    answers: session.answers,
    submittedAt: result.submittedAt,
    resultId: result.resultId
  });

  auditLogs.push({
    logId: `log_${Date.now()}`,
    sessionId: session.sessionId,
    studentUid: session.studentUid,
    examId: exam.examId,
    eventType: isAutoExpired ? 'EXAM_TIME_EXPIRED' : 'EXAM_SUBMITTED_SUCCESS',
    details: `Score: ${totalScore}/${totalMaxMarks} (${percentage}%) - ${passed ? 'PASSED' : 'FAILED'} (Results Released: ${isResultsPublished})`,
    timestamp: Date.now()
  });

  // If teacher has not released results, do NOT leak marks to student!
  if (!isResultsPublished) {
    return res.json({
      success: true,
      result: {
        resultId: result.resultId,
        examId: exam.examId,
        examTitle: exam.title,
        studentName: session.studentName,
        admissionNumber: session.admissionNumber,
        submittedAt: result.submittedAt,
        resultsPublished: false,
        message: 'পরীক্ষা সফলভাবে জমা হয়েছে। ফলাফল শিক্ষক/কর্তৃপক্ষ কর্তৃক পরে প্রকাশ করা হবে।'
      }
    });
  }

  res.json({
    success: true,
    result: {
      resultId: result.resultId,
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      passed: result.passed,
      resultsPublished: true
    }
  });
});

// 8. Early Exit with Teacher Authorization Password
app.post('/api/verify-exit', (req, res) => {
  const { sessionId, exitPassword, reason } = req.body;
  if (!exitPassword) {
    return res.status(400).json({ success: false, message: 'Teacher password required' });
  }

  if (exitPassword !== settings.exitPassword) {
    return res.status(403).json({ success: false, message: 'Invalid Teacher Exit Password' });
  }

  const session = sessions.get(sessionId);
  if (session) {
    session.status = 'terminated';
    session.terminatedReason = reason || 'Authorized Early Exit';

    auditLogs.push({
      logId: `log_${Date.now()}`,
      sessionId: session.sessionId,
      studentUid: session.studentUid,
      examId: session.examId,
      eventType: 'EARLY_EXIT_AUTHORIZED',
      details: `Teacher authorized early exit. Reason: ${reason}`,
      timestamp: Date.now()
    });
  }

  res.json({ success: true, message: 'Exit authorized' });
});

// 9. Security Event Logging
app.post('/api/log-event', (req, res) => {
  const { sessionId, studentUid, examId, eventType, details } = req.body;
  auditLogs.push({
    logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    sessionId: sessionId || 'N/A',
    studentUid: studentUid || 'N/A',
    examId: examId || 'N/A',
    eventType: eventType || 'SECURITY_EVENT',
    details: details || '',
    timestamp: Date.now()
  });
  res.json({ success: true });
});

// 10. Student Scorecard (Respects Teacher Publication Release)
app.get('/api/student-result', (req, res) => {
  const { studentUid, resultId, examId } = req.query;

  let r = results.find(item => item.resultId === resultId);
  if (!r && studentUid && examId) {
    r = results.find(item => item.studentUid === studentUid && item.examId === examId);
  }

  if (!r) {
    return res.status(404).json({ success: false, message: 'Result not found' });
  }

  const exam = exams.find(e => e.examId === r.examId);
  const isResultsPublished = Boolean(exam?.resultsPublished);

  // If teacher has not released results, return official receipt without score
  if (!isResultsPublished) {
    return res.json({
      success: true,
      result: {
        resultId: r.resultId,
        examId: r.examId,
        examTitle: r.examTitle,
        studentName: r.studentName,
        admissionNumber: r.admissionNumber,
        submittedAt: r.submittedAt,
        resultsPublished: false,
        notice: 'আপনার উত্তরপত্র পরীক্ষক সিস্টেমে নিরাপদে রেকর্ড করা হয়েছে। এই পরীক্ষার ফলাফল শিক্ষক/ইনস্টিটিউট কর্তৃপক্ষ কর্তৃক পরবর্তীতে প্রকাশ করা হবে।'
      }
    });
  }

  // If released, return full scorecard & breakdown
  res.json({
    success: true,
    result: {
      ...r,
      resultsPublished: true
    }
  });
});

// ----------------------------------------------------
// TEACHER / ADMIN ENDPOINTS
// ----------------------------------------------------

app.get('/api/teacher/exams', (req, res) => {
  res.json({ success: true, exams });
});

app.post('/api/teacher/exams/:examId/toggle-results-publish', (req, res) => {
  const { examId } = req.params;
  const exam = exams.find(e => e.examId === examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  exam.resultsPublished = !exam.resultsPublished;
  firestoreSave('exams', exam.examId, exam);

  auditLogs.push({
    logId: `log_${Date.now()}`,
    sessionId: 'SYSTEM',
    studentUid: 'FACULTY',
    examId: exam.examId,
    eventType: exam.resultsPublished ? 'RESULTS_RELEASED_TO_STUDENTS' : 'RESULTS_HIDDEN_FROM_STUDENTS',
    details: `Exam '${exam.title}' results published state changed to: ${exam.resultsPublished}`,
    timestamp: Date.now()
  });

  res.json({
    success: true,
    resultsPublished: exam.resultsPublished,
    message: exam.resultsPublished ? 'Results published to students' : 'Results hidden from students'
  });
});

app.post('/api/teacher/exams', (req, res) => {
  const { 
    title, 
    month, 
    description, 
    trade, 
    durationMinutes, 
    enablePerQuestionTimer, 
    perQuestionTimerSeconds, 
    passPercentage, 
    published, 
    showResultImmediately, 
    resultsPublished 
  } = req.body;
  const examId = `exam_${Date.now()}`;

  const newExam: Exam = {
    examId,
    title: title || 'Untitled Examination',
    month: month || '',
    description: description || '',
    trade: trade || 'All Trades',
    durationMinutes: Number(durationMinutes) || 30,
    enablePerQuestionTimer: Boolean(enablePerQuestionTimer),
    perQuestionTimerSeconds: Number(perQuestionTimerSeconds) || 60,
    passPercentage: Number(passPercentage) || 40,
    totalQuestions: 0,
    totalMarks: 0,
    published: Boolean(published),
    showResultImmediately: Boolean(showResultImmediately),
    resultsPublished: Boolean(resultsPublished),
    createdAt: Date.now()
  };

  exams.push(newExam);
  firestoreSave('exams', newExam.examId, newExam);

  res.json({ success: true, exam: newExam });
});

app.put('/api/teacher/exams/:examId', (req, res) => {
  const { examId } = req.params;
  const exam = exams.find(e => e.examId === examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  Object.assign(exam, req.body);
  firestoreSave('exams', exam.examId, exam);

  res.json({ success: true, exam });
});

app.delete('/api/teacher/exams/:examId', (req, res) => {
  const { examId } = req.params;
  const idx = exams.findIndex(e => e.examId === examId);
  if (idx !== -1) exams.splice(idx, 1);
  firestoreDelete('exams', examId);

  res.json({ success: true });
});

app.get('/api/teacher/exams/:examId/questions', (req, res) => {
  const { examId } = req.params;
  const exam = exams.find(e => e.examId === examId);
  const qList = questions.filter(q => q.examId === examId);
  res.json({ success: true, exam, questions: qList });
});

app.post('/api/teacher/exams/:examId/questions', (req, res) => {
  const { examId } = req.params;
  const exam = exams.find(e => e.examId === examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  const { questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, questionSet, timeLimitSeconds } = req.body;
  const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  const newQ: Question = {
    questionId,
    examId,
    questionSet: questionSet || 'Set A',
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer: correctAnswer || 'A',
    marks: Number(marks) || 1,
    timeLimitSeconds: Number(timeLimitSeconds) || 0
  };

  questions.push(newQ);

  // Update exam totals
  const allForExam = questions.filter(q => q.examId === examId);
  exam.totalQuestions = allForExam.length;
  exam.totalMarks = allForExam.reduce((sum, q) => sum + q.marks, 0);

  // Persist to Firestore
  firestoreSave('questions', newQ.questionId, newQ);
  firestoreSave('exams', exam.examId, exam);

  res.json({ success: true, question: newQ });
});

app.delete('/api/teacher/exams/:examId/questions/:questionId', (req, res) => {
  const { examId, questionId } = req.params;
  const qIdx = questions.findIndex(q => q.questionId === questionId && q.examId === examId);
  if (qIdx !== -1) questions.splice(qIdx, 1);
  firestoreDelete('questions', questionId);

  const exam = exams.find(e => e.examId === examId);
  if (exam) {
    const allForExam = questions.filter(q => q.examId === examId);
    exam.totalQuestions = allForExam.length;
    exam.totalMarks = allForExam.reduce((sum, q) => sum + q.marks, 0);
    firestoreSave('exams', exam.examId, exam);
  }

  res.json({ success: true });
});

app.get('/api/teacher/results', (req, res) => {
  res.json({ success: true, results });
});

// Download / Export results as Excel (.CSV with UTF-8 BOM) directly from Render server
app.get('/api/teacher/results/export', (req, res) => {
  const { month, trade, q } = req.query;
  const searchQ = typeof q === 'string' ? q.toLowerCase().trim() : '';
  const selMonth = typeof month === 'string' ? month : 'ALL';
  const selTrade = typeof trade === 'string' ? trade : 'ALL';

  const dataToExport = results.filter(r => {
    const matchesQuery = !searchQ ||
      (r.studentName && r.studentName.toLowerCase().includes(searchQ)) ||
      (r.admissionNumber && r.admissionNumber.toLowerCase().includes(searchQ)) ||
      (r.examTitle && r.examTitle.toLowerCase().includes(searchQ));

    const matchesMonth = (selMonth === 'ALL') ||
      (r.examTitle && r.examTitle.toLowerCase().includes(selMonth.toLowerCase()));

    const matchesTrade = (selTrade === 'ALL') ||
      (r.examTitle && r.examTitle.toLowerCase().includes(selTrade.toLowerCase()));

    return matchesQuery && matchesMonth && matchesTrade;
  });

  const headers = [
    "Student Name (ছাত্র/ছাত্রীর নাম)",
    "Admission Form Number (পাসওয়ার্ড)",
    "Exam Title (পরীক্ষার বিষয়)",
    "Score (প্রাপ্ত নম্বর)",
    "Total Marks (মোট নম্বর)",
    "Percentage (শতাংশ)",
    "Status (ফলাফল)",
    "Auto Expired",
    "Submitted At (জমার তারিখ ও সময়)"
  ];

  const rows = dataToExport.map(r => [
    `"${(r.studentName || '').replace(/"/g, '""')}"`,
    `"${(r.admissionNumber || '').replace(/"/g, '""')}"`,
    `"${(r.examTitle || '').replace(/"/g, '""')}"`,
    r.score,
    r.totalMarks,
    `"${r.percentage}%"`,
    r.passed ? 'PASS' : 'FAIL',
    r.isAutoExpired ? 'YES' : 'NO',
    `"${new Date(r.submittedAt).toLocaleString()}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.join(","))].join("\r\n");

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="XEENA_Results_Export_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvContent);
});

app.get('/api/teacher/students', (req, res) => {
  res.json({ success: true, students });
});

app.post('/api/teacher/students', (req, res) => {
  const { name, username, admissionNumber, trade, batch, rollNumber } = req.body;
  const cleanName = String(name || '').trim();
  const cleanAdm = String(admissionNumber || '').toUpperCase().trim();
  const cleanUser = username ? String(username).toLowerCase().trim() : cleanName.toLowerCase().replace(/\s+/g, '.');

  const newStudent: Student = {
    uid: `std_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    username: cleanUser,
    admissionNumber: cleanAdm,
    trade: trade || 'General',
    batch: batch || '2024-2026',
    rollNumber: rollNumber || '',
    role: 'student'
  };
  students.push(newStudent);
  firestoreSave('students', newStudent.uid, newStudent);

  res.json({ success: true, student: newStudent });
});

// Bulk Import Students from Excel / CSV Data
app.post('/api/teacher/students/bulk-import', (req, res) => {
  const { students: importedList } = req.body;
  if (!Array.isArray(importedList) || importedList.length === 0) {
    return res.status(400).json({ success: false, message: 'No student data received for bulk import.' });
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const s of importedList) {
    if (!s.name || !s.admissionNumber) continue;
    const cleanAdm = String(s.admissionNumber).trim().toUpperCase();
    const cleanName = String(s.name).trim();
    const cleanUser = s.username ? String(s.username).trim().toLowerCase() : cleanName.toLowerCase().replace(/\s+/g, '.');

    const existingIdx = students.findIndex(e => e.admissionNumber.toUpperCase() === cleanAdm);
    if (existingIdx !== -1) {
      students[existingIdx] = {
        ...students[existingIdx],
        name: cleanName,
        username: cleanUser,
        trade: s.trade || students[existingIdx].trade || 'General',
        batch: s.batch || students[existingIdx].batch || '2024-2026',
        rollNumber: s.rollNumber || students[existingIdx].rollNumber || ''
      };
      firestoreSave('students', students[existingIdx].uid, students[existingIdx]);
      updatedCount++;
    } else {
      const newSt: Student = {
        uid: `std_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        name: cleanName,
        username: cleanUser,
        admissionNumber: cleanAdm,
        trade: s.trade || 'General',
        batch: s.batch || '2024-2026',
        rollNumber: s.rollNumber || '',
        role: 'student'
      };
      students.push(newSt);
      firestoreSave('students', newSt.uid, newSt);
      addedCount++;
    }
  }

  auditLogs.push({
    logId: `log_${Date.now()}`,
    sessionId: 'SYSTEM',
    studentUid: 'FACULTY',
    examId: 'GENERAL',
    eventType: 'BULK_STUDENT_IMPORT',
    details: `Imported ${addedCount} student(s), updated ${updatedCount} existing candidate(s).`,
    timestamp: Date.now()
  });

  res.json({
    success: true,
    message: `সফলভাবে ${addedCount} জন নতুন ছাত্রছাত্রী যুক্ত হয়েছে (${updatedCount} জন আপডেট হয়েছে)।`,
    addedCount,
    updatedCount,
    totalStudents: students.length,
    students
  });
});

app.delete('/api/teacher/students/:uid', (req, res) => {
  const { uid } = req.params;
  const idx = students.findIndex(s => s.uid === uid);
  if (idx !== -1) students.splice(idx, 1);
  firestoreDelete('students', uid);
  res.json({ success: true });
});

app.get('/api/teacher/audit-logs', (req, res) => {
  res.json({ success: true, logs: auditLogs.slice().reverse() });
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ITI College CBT Server running at http://0.0.0.0:${PORT}`);
});
