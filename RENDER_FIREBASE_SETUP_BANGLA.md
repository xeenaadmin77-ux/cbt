# 🚀 Render & Firebase সম্পূর্ণ সেটআপ গাইড (A to Z বাংলায়)
## XEENA INSTITUTE OF SKILL DEVELOPMENT - CBT Examination System

এই গাইডে বিস্তারিতভাবে ব্যাখ্যা করা হয়েছে কীভাবে আপনি আপনার পরীক্ষা সিস্টেমের **Node.js সার্ভার Render.com-এ হোস্ট করবেন** এবং ডাটাবেস ও অথেন্টিকেশনের জন্য **Firebase (Cloud Firestore & Auth)** সম্পূর্ণভাবে কনফিগার করবেন।

---

## 📌 সূচিপত্র
1. [ধাপ ১: Firebase প্রজেক্ট তৈরি ও কনফিগারেশন](#ধাপ-১-firebase-প্রজেক্ট-তৈরি)
2. [ধাপ ২: Firestore ডাটাবেস স্কিমা ও ফিল্ডের নাম (A to Z)](#ধাপ-২-firestore-ডাটাবেসের-সব-ফিল্ডের-নাম-ও-টাইপ)
3. [ধাপ ৩: Firebase Service Account কী ডাউনলোড](#ধাপ-৩-firebase-service-account-key-তৈরি)
4. [ধাপ ৪: Render.com-এ সার্ভার ডিপ্লয় ও রান করা](#ধাপ-৪-rendercom-এ-সার্ভার-হোস্টিং)
5. [ধাপ ৫: স্বয়ংক্রিয়ভাবে ডাটাবেসে ডাটা আপলোড (1-Click Seed)](#ধাপ-৫-স্বয়ংক্রিয়-ডাটাবেস-সিড)
6. [ধাপ ৬: ফ্রন্টএন্ড কানেকশন ও সিকিউরিটি রুলস](#ধাপ-৬-ফ্রন্টএন্ড-কানেকশন)

---

## ধাপ ১: Firebase প্রজেক্ট তৈরি

1. ব্রাউজারে যান: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. **"Add project"** (বা Create a project)-এ ক্লিক করুন।
3. প্রজেক্টের নাম দিন (যেমন: `xeena-cbt-system`) এবং Continue করুন।
4. Google Analytics অন বা অফ রেখে **"Create project"**-এ ক্লিক করুন।

### ক) Cloud Firestore ডাটাবেস অন করুন:
1. বাম পাশের মেনু থেকে **Build > Firestore Database**-এ ক্লিক করুন।
2. **"Create database"** বাটনে ক্লিক করুন।
3. **Database location**: সিলেক্ট করুন `asia-south1 (Mumbai)` (ভারতের কাছাকাছি সবচেয়ে দ্রুতগতির জন্য)।
4. সিকিউরিটি রুলসের জায়গায় **"Start in production mode"** সিলেক্ট করে **Create** করুন।

### খ) Firebase Authentication অন করুন:
1. বাম পাশের মেনু থেকে **Build > Authentication**-এ যান।
2. **"Get started"**-এ ক্লিক করুন।
3. **Sign-in method** ট্যাবে গিয়ে **Email/Password** এনেবল (Enable) করে Save করুন।

---

## ধাপ ২: Firestore ডাটাবেসের সব ফিল্ডের নাম ও টাইপ (A to Z Schema)

Firebase Cloud Firestore-এ নিচের কালেকশনগুলো (Collections) থাকবে। প্রতিটির ফিল্ডের নাম, ডাটা টাইপ এবং বিবরণ নিচে নিখুঁতভাবে দেওয়া হলো:

---

### ১. কালেকশন: `settings` (কলেজ ও ল্যাব সেটিংস)

এই কালেকশনে ২টি ডকুমেন্ট থাকবে:

#### ডকুমেন্ট ১: `public_config` (সবার জন্য দৃশ্যমান ব্র্যান্ডিং)
* **`collegeName`** (string): কলেজের নাম (যেমন: `"XEENA INSTITUTE OF SKILL DEVELOPMENT"`)
* **`tagline`** (string): স্লোগান (যেমন: `"Centre of Excellence in Vocational & Technical Training"`)
* **`labName`** (string): ল্যাবের নাম (যেমন: `"Main Computer Examination Lab"`)
* **`updatedAt`** (number): শেষ আপডেটের টাইমস্ট্যাম্প (যেমন: `1725580800000`)

#### ডকুমেন্ট ২: `invigilator_secret` (শুধুমাত্র সার্ভার ও শিক্ষকের জন্য গোপনীয়)
* **`exitPassword`** (string): পরীক্ষা চলাকালীন ইমার্জেন্সি প্রস্থান পাসওয়ার্ড (যেমন: `"admin"` বা `"Xeena@2026Lab"`)
* **`updatedAt`** (number): আপডেটের টাইমস্ট্যাম্প

---

### ২. কালেকশন: `teachers` (শিক্ষক ও এক্সাম কন্ট্রোলার তালিকা)
ডকুমেন্ট ID হবে শিক্ষকের UID (যেমন: `teacher_admin`)

* **`uid`** (string): শিক্ষকের ইউনিক আইডি (যেমন: `"teacher_admin"`)
* **`name`** (string): শিক্ষকের নাম (যেমন: `"Controller of Examinations"`)
* **`email`** (string): ইমেইল আইডি (যেমন: `"teamscartino07@gmail.com"`)
* **`role`** (string): ভূমিকা, মান হবে `"teacher"` অথবা `"admin"`
* **`active`** (boolean): অ্যাকাউন্ট চালু আছে কিনা (`true` / `false`)
* **`createdAt`** (number): তৈরির সময় (যেমন: `1725580800000`)

---

### ৩. কালেকশন: `students` (ছাত্রছাত্রীদের তালিকা ও এডমিশন নম্বর)
ডকুমেন্ট ID হবে ছাত্রের UID (যেমন: `std_ranit_01`)

* **`uid`** (string): শিক্ষার্থীর ইউনিক আইডি (যেমন: `"std_ranit_01"`)
* **`name`** (string): ছাত্রের পূর্ণ নাম (যেমন: `"Ranit Biswas"`)
* **`username`** (string): ইউজারনেম (যেমন: `"ranit.biswas"`)
* **`admissionNumber`** (string): কলেজের এডমিশন ফর্ম নম্বর - যা পাসওয়ার্ড হিসেবে ব্যবহৃত হয় (যেমন: `"XEENA2025010"`)
* **`trade`** (string): কোর্সের নাম (যেমন: `"COPA (Computer Operator)"`, `"Electrician"`, `"Fitter"`)
* **`batch`** (string): ব্যাচ বছর (যেমন: `"2024-2025"`)
* **`rollNumber`** (string): রোল নম্বর (যেমন: `"ROLL-10"`)
* **`role`** (string): ফিক্সড ভ্যালু `"student"`
* **`active`** (boolean): পরীক্ষা দেওয়ার অনুমতি আছে কিনা (`true` / `false`)
* **`createdAt`** (number): তৈরির টাইমস্ট্যাম্প

---

### ৪. কালেকশন: `exams` (পরীক্ষার বিস্তারিত কনফিগারেশন)
ডকুমেন্ট ID হবে পরীক্ষার ইউনিক আইডি (যেমন: `exam_copa_01`)

* **`examId`** (string): পরীক্ষার আইডি (যেমন: `"exam_copa_01"`)
* **`title`** (string): পরীক্ষার শিরোনাম (যেমন: `"COPA Theory & Computer Fundamentals"`)
* **`month`** (string): মাস ও সেশন (যেমন: `"September 2026"`)
* **`description`** (string): সিলেবাস ও বিবরণ (যেমন: `"Hardware, OS, Networking Fundamentals"`)
* **`trade`** (string): প্রযোজ্য ট্রেড (যেমন: `"COPA (Computer Operator)"` বা `"All ITI Trades"`)
* **`durationMinutes`** (number): মোট সময় মিনিটে (যেমন: `30`)
* **`totalQuestions`** (number): মোট প্রশ্নের সংখ্যা (যেমন: `5` বা `50`)
* **`totalMarks`** (number): মোট নম্বর (যেমন: `50`)
* **`passPercentage`** (number): পাসের শতাংশ (যেমন: `40`)
* **`enablePerQuestionTimer`** (boolean): প্রতি প্রশ্নে আলাদা টাইমার থাকবে কিনা (`true` / `false`)
* **`perQuestionTimerSeconds`** (number): প্রতি প্রশ্নের সময় সেকেন্ডে (যেমন: `60`)
* **`published`** (boolean): ছাত্রদের স্ক্রিনে পরীক্ষাটি দৃশ্যমান কিনা (`true` / `false`)
* **`showResultImmediately`** (boolean): জমা দেওয়ার সাথে সাথে ফলাফল দেখাবে কিনা (`false`)
* **`resultsPublished`** (boolean): শিক্ষক কর্তৃক ফলাফল প্রকাশ করা হয়েছে কিনা (`false`)
* **`createdBy`** (string): তৈরিকারীর আইডি (যেমন: `"teacher_admin"`)
* **`createdAt`** (number): পরীক্ষার তৈরির টাইমস্ট্যাম্প

---

### ৫. কালেকশন: `questions` (প্রশ্নব্যাংক ও ৪টি অপশন)
ডকুমেন্ট ID হবে প্রশ্নের আইডি (যেমন: `q_copa_1`)

* **`questionId`** (string): প্রশ্নের ইউনিক আইডি (যেমন: `"q_copa_1"`)
* **`examId`** (string): কোন পরীক্ষার প্রশ্ন তার আইডি (যেমন: `"exam_copa_01"`)
* **`questionSet`** (string): প্রশ্ন সেট (যেমন: `"Set A"`, `"Set B"`)
* **`questionText`** (string): মূল প্রশ্নটি বাংলায় বা ইংরেজিতে (যেমন: `"Which component is known as the Brain of Computer?"`)
* **`optionA`** (string): প্রথম বিকল্প (যেমন: `"RAM"`)
* **`optionB`** (string): দ্বিতীয় বিকল্প (যেমন: `"CPU"`)
* **`optionC`** (string): তৃতীয় বিকল্প (যেমন: `"Hard Disk"`)
* **`optionD`** (string): চতুর্থ বিকল্প (যেমন: `"Motherboard"`)
* **`correctAnswer`** (string): সঠিক উত্তর: `"A"`, `"B"`, `"C"`, বা `"D"` (এটি শুধুমাত্র সার্ভার জানে, ছাত্রদের পাঠানো হয় না!)
* **`marks`** (number): প্রশ্নের পূর্ণমান (যেমন: `10` বা `1`)
* **`timeLimitSeconds`** (number): প্রশ্নটির জন্য বরাদ্দ সময় সেকেন্ডে (যেমন: `60`)

---

### ৬. কালেকশন: `examSessions` (লাইভ পরীক্ষার চলমান সেশন)
ছাত্র যখন পরীক্ষা শুরু করে, সার্ভার স্বয়ংক্রিয়ভাবে এই ডকুমেন্ট তৈরি করে।
ডকুমেন্ট ID: `sess_<timestamp>_<random>`

* **`sessionId`** (string): সেশন আইডি
* **`examId`** (string): পরীক্ষার আইডি
* **`studentUid`** (string): ছাত্রের UID
* **`studentName`** (string): ছাত্রের নাম
* **`admissionNumber`** (string): এডমিশন নম্বর
* **`startTime`** (number): পরীক্ষা শুরুর আসল সার্ভার টাইমস্ট্যাম্প
* **`expiryTime`** (number): পরীক্ষা শেষ হওয়ার সঠিক সার্ভার টাইমস্ট্যাম্প
* **`status`** (string): সেশনের অবস্থা (`"in_progress"`, `"submitted"`, `"expired"`, বা `"terminated"`)
* **`questionOrder`** (array of strings): প্রশ্ন এলোমেলো (Shuffle) করে সাজানো আইডিগুলো (যেমন: `["q_copa_3", "q_copa_1", "q_copa_2"]`)
* **`answers`** (map / object): ছাত্রের সেভ করা উত্তরসমূহ (যেমন: `{"q_copa_1": "B", "q_copa_3": "A"}`)
* **`markedQuestions`** (array of strings): রিভিউয়ের জন্য মার্ক করা প্রশ্নসমূহ

---

### ৭. কালেকশন: `results` (ফলাফল ও মার্কশীট)
পরীক্ষা জমা দেওয়ার সাথে সাথে সার্ভার নিজে খাতা মূল্যায়ন করে এটি রেকর্ড করে।
ডকুমেন্ট ID: `res_<timestamp>_<random>`

* **`resultId`** (string): রেজাল্ট আইডি
* **`sessionId`** (string): সংশ্লিষ্ট সেশন আইডি
* **`examId`** (string): পরীক্ষার আইডি
* **`examTitle`** (string): পরীক্ষার নাম
* **`studentUid`** (string): ছাত্রের UID
* **`studentName`** (string): ছাত্রের নাম
* **`admissionNumber`** (string): এডমিশন নম্বর
* **`score`** (number): ছাত্রের প্রাপ্ত মোট নম্বর (যেমন: `40`)
* **`totalMarks`** (number): পরীক্ষার মোট নম্বর (যেমন: `50`)
* **`percentage`** (number): শতকরা নম্বর (যেমন: `80`)
* **`passed`** (boolean): পাস করেছে কিনা (`true` / `false`)
* **`submittedAt`** (number): জমা দেওয়ার সময়
* **`isAutoExpired`** (boolean): সময় শেষ হয়ে অটো-সাবমিট হয়েছে কিনা (`true` / `false`)
* **`breakdown`** (array of objects): প্রতিটি প্রশ্নের বিস্তারিত মূল্যায়ন:
  * `questionId`, `questionText`, `selectedOption`, `correctAnswer`, `isCorrect`, `marksAwarded`

---

### ৮. কালেকশন: `auditLogs` (নিরাপত্তা ও চিটিং প্রতিরোধ লগ)
ডকুমেন্ট ID: `log_<timestamp>`

* **`logId`** (string): লগের আইডি
* **`sessionId`** (string): সংশ্লিষ্ট সেশনের আইডি
* **`studentUid`** (string): ছাত্রের UID
* **`examId`** (string): পরীক্ষার আইডি
* **`eventType`** (string): ঘটনার ধরন (যেমন: `"EXAM_SESSION_STARTED"`, `"TAB_SWITCH_WARNING"`, `"EARLY_EXIT_AUTHORIZED"`)
* **`details`** (string): ঘটনার বিস্তারিত বিবরণ
* **`timestamp`** (number): ঘটনার সঠিক সময়

---

## ধাপ ৩: Firebase Service Account Key তৈরি

Render সার্ভার যাতে Firebase ডাটাবেস এক্সেস করতে পারে, তার জন্য একটি সিক্রেট কী লাগবে:

1. Firebase Console-এ যান: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. বাম পাশের গিয়ার আইকন (⚙️) থেকে **Project settings**-এ ক্লিক করুন।
3. উপরে **Service accounts** ট্যাবে যান।
4. **"Generate new private key"** বাটনে ক্লিক করুন এবং কনফার্ম করুন।
5. একটি JSON ফাইল ডাউনলোড হবে (যেমন: `xeena-cbt-firebase-adminsdk-xxxx.json`)।
6. এই ফাইলের নাম পরিবর্তন করে `serviceAccountKey.json` রাখুন।

---

## ধাপ ৪: Render.com-এ সার্ভার হোস্টিং

Render.com হলো একটি দুর্দান্ত ক্লাউড প্ল্যাটফর্ম যা বিনামূল্যে Node.js ব্যাকএন্ড চালাতে দেয়।

### ১. GitHub-এ কোড পুশ করুন:
আপনার প্রজেক্টটি GitHub-এর একটি প্রাইভেট বা পাবলিক রিপোজিটরিতে আপলোড করুন।

### ২. Render-এ নতুন Web Service তৈরি করুন:
1. যান: [https://dashboard.render.com/](https://dashboard.render.com/)
2. **"New +"** বাটনে ক্লিক করে **"Web Service"** সিলেক্ট করুন।
3. আপনার GitHub রিপোজিটরিটি সিলেক্ট করুন।
4. নিচের সেটিংসগুলো পূরণ করুন:
   * **Name**: `xeena-cbt-server`
   * **Region**: `Singapore` (ভারত ও বাংলাদেশের জন্য সবচেয়ে দ্রুত পিং)
   * **Branch**: `main`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`

### ৩. Render-এ Environment Variables যোগ করুন:
নিচে **Environment Variables** সেকশনে গিয়ে নিচের ভেরিয়েবলগুলো যোগ করুন:

| Key | Value | বিবরণ |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | প্রোডাকশন মোড |
| `PORT` | `3000` | সার্ভার পোর্ট |
| `FIREBASE_SERVICE_ACCOUNT` | *(সম্পূর্ণ JSON পেস্ট করুন)* | আপনার ডাউনলোড করা `serviceAccountKey.json` ফাইলটি ওপেন করে ভেতরের সব লেখা কপি করে এখানে পেস্ট করুন |
| `EXAM_EXIT_PASSWORD` | `admin` | ইনভিজিলেটর প্রস্থান পাসওয়ার্ড |

5. নিচে **"Create Web Service"**-এ ক্লিক করুন!
6. Render আপনার কোড বিল্ড করবে এবং কয়েক মিনিটের মধ্যে আপনাকে একটি লাইভ URL দেবে (যেমন: `https://xeena-cbt-server.onrender.com`)।

---

## ধাপ ৫: স্বয়ংক্রিয় ডাটাবেস সিড (1-Click Database Setup)

আপনার হাতে Firebase-এর সব কালেকশন এবং ফিল্ড একটা একটা করে ম্যানুয়ালি টাইপ করার দরকার নেই! আমরা একটি স্ক্রিপ্ট তৈরি করে রেখেছি:

১. আপনার কম্পিউটারে টার্মিনাল ওপেন করুন।
২. আপনার প্রজেক্ট ফোল্ডারে `serviceAccountKey.json` ফাইলটি রাখুন।
৩. নিচের কমান্ডটি চালান:
```bash
npm run seed
```

**ফলাফল:**
স্ক্রিপ্টটি নিজে নিজেই ফায়ারবেস ক্লাউডে কানেক্ট হবে এবং কয়েক সেকেন্ডের মধ্যে:
* `settings` কালেকশন
* `teachers` একাউন্ট
* `students` তালিকা (Ranit Biswas, Ramesh Kumar, ইত্যাদি)
* `exams` (COPA Computer Fundamentals Exam)
* `questions` (সকল অপশন ও উত্তরসহ প্রশ্নব্যাংক)

সবকিছু স্বয়ংক্রিয়ভাবে তৈরি করে দেবে! এরপর আপনি Firebase Console-এ গিয়ে রিফ্রেশ করলেই সব দেখতে পাবেন।

---

## ধাপ ৬: ফ্রন্টএন্ড কানেকশন

১. Firebase Console > Project settings > General-এ নিচে **"Your apps"** থেকে **Web (</>)** আইকনে ক্লিক করে একটি ওয়েব অ্যাপ রেজিস্টার করুন।
২. সেখানে প্রদর্শিত কনফিগ কপি করে আপনার প্রজেক্টের `public/js/firebase-config.js` ফাইলে বসিয়ে দিন:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "xeena-cbt.firebaseapp.com",
  projectId: "xeena-cbt",
  storageBucket: "xeena-cbt.appspot.com",
  messagingSenderId: "...",
  appId: "1:...:web:..."
};
```
৩. `firestore.rules` ফাইলটি Firebase Console > Firestore Database > Rules ট্যাবে গিয়ে পেস্ট করে **Publish** করে দিন।

---

## 🎯 সংক্ষেপে আপনার আর্কিটেকচার:
```
[পরীক্ষার্থী কম্পিউটার (Student Browser)]
         │ (UI, টাইমার, ক্যামেরা সিকিউরিটি)
         ▼
[Render.com সার্ভার (Node.js/Express API)]
         │ (সুরক্ষিত Admin SDK ও অথেনটিকেশন)
         ▼
[Google Cloud Firebase (Firestore DB & Auth)]
```

ছাত্রছাত্রীরা কোনো অবস্থাতেই সঠিক উত্তর বা সিক্রেট পাসওয়ার্ড দেখতে পারবে না। সব মূল্যায়ন এবং টাইমার সার্ভার থেকে কঠোরভাবে নিয়ন্ত্রিত হবে।
