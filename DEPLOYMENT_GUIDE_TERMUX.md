# Deploying ITI College CBT System from an Android Phone (Termux & Acode)

This guide walks you through maintaining, testing, and deploying the complete ITI Computer Based Test (CBT) Examination web system entirely using an **Android smartphone** without requiring a PC or laptop.

---

## 1. Prerequisites (Android Phone Apps)

Install the following free, open-source apps on your Android phone:

1. **Termux**: Terminal emulator for Android (Download from **F-Droid** or GitHub releases. *Avoid Google Play Store version as it is deprecated*).
2. **Acode** or **SPCK Editor**: High-performance mobile code editor with syntax highlighting and file tree navigation.
3. **Google Chrome / Kiwi Browser**: Mobile browser for local testing.

---

## 2. Setting Up Termux Environment

Open Termux on your Android phone and run the following command sequence:

### Step 2.1: Update Termux Package Repositories
```bash
pkg update -y && pkg upgrade -y
```

### Step 2.2: Install Node.js and Git
Termux provides official builds of Node.js LTS and Git:
```bash
pkg install nodejs-lts git openssh -y
```

Verify the installation:
```bash
node -v
npm -v
git --version
```
*(Node.js 18.x or 20.x+ will be installed)*.

### Step 2.3: Grant Storage Permission
Allow Termux to access your phone's internal storage:
```bash
termux-setup-storage
```
*Tap "Allow" when prompted.* Your internal storage is now accessible under `~/storage/shared/`.

---

## 3. Cloning or Accessing the Project in Termux

You can either navigate to a folder edited by Acode or clone your repository directly:

```bash
cd ~/storage/shared/
mkdir -p ITI-CBT-System
cd ITI-CBT-System
```

If copying the files from this project:
```bash
# Verify files in project directory
ls -la
```

---

## 4. Installing Project Dependencies & Running Locally on Android

In Termux inside the project folder:

```bash
# Install root dependencies
npm install

# Test run local dev server
npm run dev
```

The terminal will display:
```
Server running on http://localhost:3000
```

Open your phone's browser and visit:
`http://localhost:3000`

You can test both the Student and Faculty portals right on your mobile screen! To edit code, open the folder in **Acode**.

---

## 5. Installing Firebase CLI on Termux (Android)

Firebase CLI runs directly on Node.js in Termux:

```bash
npm install -g firebase-tools
```

Verify:
```bash
firebase --version
```

---

## 6. Authenticating with Firebase from an Android Phone

Because Termux cannot automatically launch a desktop browser window on your phone for Google OAuth callback, use Firebase's headless login flag:

```bash
firebase login --no-localhost
```

### How to complete the login on your phone:
1. Termux will output a long Google authentication URL.
2. Copy the URL, switch to Chrome, and paste it into the URL bar.
3. Log in with your Google / Firebase account.
4. Chrome will display an authorization code.
5. Copy the code, switch back to Termux, paste it into the prompt, and press **Enter**.
6. You will see: `✔ Success! Logged in as your_email@gmail.com`.

---

## 7. Initializing & Deploying to Firebase

### Step 7.1: Set Your Firebase Project
```bash
# List your Firebase projects
firebase projects:list

# Select your ITI CBT project
firebase use <YOUR_PROJECT_ID>
```

### Step 7.2: Deploy Security Rules & Firestore
```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules
```

### Step 7.3: Deploy Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Step 7.4: Deploy Static Hosting (Frontend)
```bash
firebase deploy --only hosting
```

### Step 7.5: One-Command Full Deployment
Whenever you update exam questions, student rosters, or styles from your phone:
```bash
firebase deploy
```

Termux will provide your live URL:
`https://<YOUR_PROJECT_ID>.web.app`

---

## 8. Mobile Workflow Tips for Teachers / Administrators

- **Adding 50+ Questions on Mobile**: You don't need to write code. Simply open `https://<YOUR_PROJECT_ID>.web.app/teacher-login.html` on your phone browser, log in to the Faculty Portal, tap **Question Bank**, and use the mobile-optimized question creator form!
- **Publishing Monthly Tests**: Open the Faculty dashboard, locate the exam card, and tap **Publish**. Lab computers will instantly see the new exam when students log in.
- **Exporting Marksheets**: In the Teacher Portal, tap **Results** -> **Export All to CSV** to download standard Excel/CSV spreadsheets to your phone.
