# ITI Computer Lab Kiosk & Anti-Cheating Setup Guide

This guide explains how to prepare Windows computers in your college computer laboratory for secure Computer Based Testing (CBT).

---

## 1. Why Operating-System Kiosk Lockdown is Essential

While the CBT application enforces strict client-side browser events (full-screen enforcement, blur detection, context-menu disable, developer-tools blocking, and server-authoritative timer), **web browser JavaScript cannot physically disable Windows OS shortcuts** like `Alt + Tab`, `Win Key`, or `Ctrl + Alt + Delete`.

To achieve true examination security, lab computers must be launched in **Kiosk Mode**.

---

## 2. Fast Setup: Chrome & Microsoft Edge Kiosk Shortcuts

The simplest method without third-party software is creating a desktop shortcut that boots the browser in full-screen locked kiosk mode.

### Method A: Microsoft Edge Kiosk Mode (Recommended on Windows 10/11)

1. Right-click on the Windows Desktop -> **New** -> **Shortcut**.
2. For the target location, enter:
   ```cmd
   "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk https://your-iti-cbt-app.web.app/student-login.html --edge-kiosk-type=fullscreen --no-first-run
   ```
   *(Replace with your actual hosted CBT domain or local lab server IP address, e.g. `http://192.168.1.100:3000/student-login.html`)*
3. Name the shortcut: **ITI CBT Examination Terminal**.
4. Right-click the shortcut -> **Properties** -> Change Icon to a college or test icon.

**What this does:**
- Launches directly into full-screen without URL bar, tabs, navigation buttons, or developer console.
- Disables standard browser exit buttons.

---

### Method B: Google Chrome Kiosk Shortcut

1. Right-click on the Windows Desktop -> **New** -> **Shortcut**.
2. Target location:
   ```cmd
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --kiosk-printing --incognito --disable-pinch --overscroll-history-navigation=0 https://your-iti-cbt-app.web.app/student-login.html
   ```
3. Set the name to **Start ITI CBT Test**.

---

## 3. Dedicated Lab Account (Windows Assigned Access)

For zero-cheating lab environments, use Windows 10/11 built-in **Assigned Access**:

1. In Windows, go to **Settings** -> **Accounts** -> **Other users** -> **Set up a kiosk**.
2. Choose **Microsoft Edge** as the kiosk app.
3. Select **As a digital sign or interactive display (InPrivate full screen)**.
4. Set the URL to your CBT web address: `https://your-iti-cbt-app.web.app/student-login.html`.
5. Set restart time to 0 or 15 minutes of inactivity.

**Benefits:**
- The student cannot escape to the Windows desktop.
- Windows Key, Task Manager, Alt+F4, and Windows Explorer are physically blocked by Windows itself.
- Only the examination portal runs on the screen.

---

## 4. Local Group Policy Anti-Cheating Settings (Optional Lab Hardening)

On lab administrator terminals, run `gpedit.msc` to configure candidate security policies:

1. **Disable Task Manager**:
   - `User Configuration -> Administrative Templates -> System -> Ctrl+Alt+Del Options -> Remove Task Manager` -> Set to **Enabled**.
2. **Disable Command Prompt & PowerShell**:
   - `User Configuration -> Administrative Templates -> System -> Prevent access to the command prompt` -> Set to **Enabled**.
3. **Disable USB Storage (Prevents flash drive cheating)**:
   - `Computer Configuration -> Administrative Templates -> System -> Removable Storage Access -> All Removable Storage classes: Deny all access` -> Set to **Enabled**.

---

## 5. Lab Network Configuration (Offline Local Area Network)

If your college computer lab does not have constant high-speed internet:
1. One Windows computer (the Teacher's desk) can run the server on port 3000:
   ```bash
   npm run start
   ```
2. Note the Teacher's local IP address (e.g. `192.168.1.100`).
3. Point all student terminals to:
   `http://192.168.1.100:3000/student-login.html`
4. The entire lab runs lightning-fast over the local LAN switch with zero external bandwidth required!
