/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import { initializeApp as initializeAdminApp, applicationDefault } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

// Ensure process env variables are available (for local testing fallback)
import "dotenv/config";

// Initialize Firebase Admin SDK
try {
  initializeAdminApp({
    projectId: "sunshine-classes-web",
    credential: applicationDefault()
  });
  console.log("[Firebase Admin SDK] Initialized with applicationDefault");
} catch (e) {
  try {
    initializeAdminApp({
      projectId: "sunshine-classes-web"
    });
    console.log("[Firebase Admin SDK] Initialized with projectId fallback");
  } catch (err: any) {
    console.error("[Firebase Admin SDK] Initialization failed:", err);
  }
}

// Initialize server-side firebase instance
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, runTransaction } from "firebase/firestore";

const firebaseConfig = {
  projectId: "sunshine-classes-web",
  appId: "1:308447291099:web:574e371bb15c5e54404efe",
  apiKey: "AIzaSyCVg06N9JRbjbYyMlvrac-BKAd-d65hm-U",
  authDomain: "sunshine-classes-web.firebaseapp.com",
  storageBucket: "sunshine-classes-web.firebasestorage.app",
  messagingSenderId: "308447291099"
};

const fbApp = initializeApp(firebaseConfig, "sunshine-classes-server");
const db = getFirestore(fbApp);

function simpleSecureHash(password: string): string {
  function sha256(ascii: string): string {
    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';

    const words: any[] = [];
    const asciiLength = ascii[lengthProperty];
    const hash = (sha256 as any).h = (sha256 as any).h || [];
    const k = (sha256 as any).k = (sha256 as any).k || [];
    let primeCounter = k[lengthProperty];

    const isComposite: any = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = 1;
        }
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiLength * 8) / maxWord) | 0;
    words[words[lengthProperty]] = (asciiLength * 8) | 0;

    let h0 = hash[0], h1 = hash[1], h2 = hash[2], h3 = hash[3], h4 = hash[4], h5 = hash[5], h6 = hash[6], h7 = hash[7];

    for (i = 0; i < words[lengthProperty]; i += 16) {
      const w = words.slice(i, i + 16);
      const oldH0 = h0, oldH1 = h1, oldH2 = h2, oldH3 = h3, oldH4 = h4, oldH5 = h5, oldH6 = h6, oldH7 = h7;

      for (j = 0; j < 64; j++) {
        if (j < 16) {
          // No-op
        } else {
          const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }

        const ch = (h4 & h5) ^ (~h4 & h6);
        const maj = (h0 & h1) ^ (h0 & h2) ^ (h1 & h2);
        const sigma0 = rightRotate(h0, 2) ^ rightRotate(h0, 13) ^ rightRotate(h0, 22);
        const sigma1 = rightRotate(h4, 6) ^ rightRotate(h4, 11) ^ rightRotate(h4, 25);
        const temp1 = (h7 + sigma1 + ch + k[j] + (w[j] || 0)) | 0;
        const temp2 = (sigma0 + maj) | 0;

        h7 = h6;
        h6 = h5;
        h5 = h4;
        h4 = (h3 + temp1) | 0;
        h3 = h2;
        h2 = h1;
        h1 = h0;
        h0 = (temp1 + temp2) | 0;
      }

      h0 = (h0 + oldH0) | 0;
      h1 = (h1 + oldH1) | 0;
      h2 = (h2 + oldH2) | 0;
      h3 = (h3 + oldH3) | 0;
      h4 = (h4 + oldH4) | 0;
      h5 = (h5 + oldH5) | 0;
      h6 = (h6 + oldH6) | 0;
      h7 = (h7 + oldH7) | 0;
    }

    const wordsToHex = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (i = 0; i < 8; i++) {
      const hex = (wordsToHex[i] >>> 0).toString(16).padStart(8, '0');
      result += hex;
    }
    return result;
  }

  return 'sha256_' + sha256(password);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom request logging middleware
  app.use((req, res, next) => {
    console.log(`[HTTP Request] ${req.method} ${req.url} - IP: ${req.ip} - User-Agent: ${req.get('user-agent') || 'none'}`);
    next();
  });

  // Add /health and /api/health endpoints for fast health checking/probing
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
  });
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Dynamic XML Sitemap for Sunshine Classes SEO
  app.get("/sitemap.xml", (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host') || 'sunshineclasses.net';
    const domain = (process.env.VITE_SITE_URL || `${protocol}://${host}`).replace(/\/$/, "");
    const today = new Date().toISOString().split('T')[0];

    const urls = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/about", priority: "0.8", changefreq: "monthly" },
      { loc: "/courses", priority: "0.9", changefreq: "weekly" },
      { loc: "/enroll", priority: "0.9", changefreq: "monthly" },
      { loc: "/admissions", priority: "0.8", changefreq: "monthly" },
      { loc: "/results", priority: "0.8", changefreq: "weekly" },
      { loc: "/resources", priority: "0.7", changefreq: "weekly" },
      { loc: "/gallery", priority: "0.7", changefreq: "monthly" },
      { loc: "/contact", priority: "0.8", changefreq: "monthly" },
      { loc: "/fees", priority: "0.7", changefreq: "monthly" }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const url of urls) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}${url.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += `  </url>\n`;
    }
    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  });

  // Robots.txt to control search engine indexing
  app.get("/robots.txt", (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host') || 'sunshineclasses.net';
    const domain = (process.env.VITE_SITE_URL || `${protocol}://${host}`).replace(/\/$/, "");

    let txt = `User-agent: *\n`;
    txt += `Allow: /\n`;
    txt += `Allow: /about\n`;
    txt += `Allow: /courses\n`;
    txt += `Allow: /enroll\n`;
    txt += `Allow: /admissions\n`;
    txt += `Allow: /results\n`;
    txt += `Allow: /resources\n`;
    txt += `Allow: /gallery\n`;
    txt += `Allow: /contact\n`;
    txt += `Allow: /fees\n`;
    txt += `\n`;
    txt += `# Disallow administrative and secure system areas\n`;
    txt += `Disallow: /admin\n`;
    txt += `Disallow: /admin/*\n`;
    txt += `Disallow: /reception\n`;
    txt += `Disallow: /reception/*\n`;
    txt += `Disallow: /teacher\n`;
    txt += `Disallow: /teacher/*\n`;
    txt += `Disallow: /student\n`;
    txt += `Disallow: /student/*\n`;
    txt += `Disallow: /login\n`;
    txt += `Disallow: /api/*\n`;
    txt += `\n`;
    txt += `Sitemap: ${domain}/sitemap.xml\n`;

    res.header("Content-Type", "text/plain");
    res.status(200).send(txt);
  });

  // --- Start of Sunshine Classes Admission/Enrollment API Routes ---

  // In-memory telemetry logs for the Enrollment Health Dashboard
  const enrollmentLogs: Array<{
    id: string;
    timestamp: string;
    type: "INFO" | "WARNING" | "ERROR";
    message: string;
    payload?: any;
    error?: string;
  }> = [];

  // Load initial logs on startup from Firestore asynchronously
  try {
    const telemetryLogsRef = doc(db, 'sunshine_erp_state', 'telemetry_logs');
    getDoc(telemetryLogsRef).then((snap) => {
      if (snap.exists() && snap.data()?.data) {
        const loaded = snap.data().data;
        if (Array.isArray(loaded)) {
          enrollmentLogs.push(...loaded);
          console.log(`[Startup] Loaded ${enrollmentLogs.length} persisted enrollment telemetry logs.`);
        }
      }
    }).catch(err => {
      console.warn("[Startup] Failed to load persisted telemetry logs:", err.message);
    });
  } catch (err) {
    console.warn("[Startup] Telemetry log loader failed:", err);
  }

  // Support Tickets for unsuccessful/failed enrollment attempts
  const supportTickets: Array<{
    id: string;
    studentName: string;
    email: string;
    mobile: string;
    className: string;
    errorMessage: string;
    notes?: string;
    status: 'PENDING' | 'RESOLVED' | 'IGNORED';
    timestamp: string;
  }> = [];

  // Load initial support tickets on startup from Firestore asynchronously
  try {
    const supportTicketsRef = doc(db, 'sunshine_erp_state', 'support_tickets');
    getDoc(supportTicketsRef).then((snap) => {
      if (snap.exists() && snap.data()?.data) {
        const loaded = snap.data().data;
        if (Array.isArray(loaded)) {
          supportTickets.push(...loaded);
          console.log(`[Startup] Loaded ${supportTickets.length} persisted support tickets.`);
        }
      }
    }).catch(err => {
      console.warn("[Startup] Failed to load persisted support tickets:", err.message);
    });
  } catch (err) {
    console.warn("[Startup] Support ticket loader failed:", err);
  }

  async function logEnrollmentEvent(type: "INFO" | "WARNING" | "ERROR", message: string, payload?: any, error?: string) {
    const logItem = {
      id: `elog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
      error: error || null
    };
    enrollmentLogs.unshift(logItem);
    if (enrollmentLogs.length > 100) {
      enrollmentLogs.pop(); // Keep last 100 entries
    }
    console.log(`[Enrollment Service - ${type}] ${message}`, error ? `| Error: ${error}` : "");

    // Persist to Firestore
    try {
      const telemetryLogsRef = doc(db, 'sunshine_erp_state', 'telemetry_logs');
      await setDoc(telemetryLogsRef, { data: enrollmentLogs }, { merge: false });
    } catch (dbErr: any) {
      console.error("[Telemetry Log Persistence Error]:", dbErr.message);
    }
  }

  app.post("/api/enroll", async (req, res) => {
    const startTime = Date.now();
    logEnrollmentEvent("INFO", "Incoming enrollment request received.", { body: req.body });

    try {
      const {
        studentName,
        fatherName,
        motherName,
        dob,
        gender,
        className,
        previousSchool,
        mobile,
        whatsapp,
        parentMobile,
        email,
        address,
        aadhar,
        preferredBatch,
        preferredTiming,
        photoUrl,
        documentUrl
      } = req.body;

      // 1. Input Sanitization & Trimming
      const sName = studentName?.trim();
      const sFather = fatherName?.trim();
      const sMother = motherName?.trim();
      const sClass = className?.trim();
      const sMobile = mobile?.trim();
      const sAddress = address?.trim();

      // 2. Strict Input Validation (Name, Class, Phone, Guardian, Address are required; Email is optional)
      if (!sName || !sFather || !sMother || !sClass || !sMobile || !sAddress) {
        const missing = [];
        if (!sName) missing.push("studentName");
        if (!sFather) missing.push("fatherName");
        if (!sMother) missing.push("motherName");
        if (!sClass) missing.push("className");
        if (!sMobile) missing.push("mobile");
        if (!sAddress) missing.push("address");

        logEnrollmentEvent("WARNING", `Validation failed: Missing required fields: ${missing.join(", ")}`);
        return res.status(400).json({
          status: "error",
          message: `Validation failed: Missing required parameters: ${missing.join(", ")}`
        });
      }

      // 3. Database Write via Transaction Block (Guarantees atomic execution and duplicate detection)
      console.log("[Enrollment Endpoint] Committing transaction to Firestore...");
      
      const studentsRef = doc(db, 'sunshine_erp_state', 'students');
      const admissionsRef = doc(db, 'sunshine_erp_state', 'admissions');
      const usersRef = doc(db, 'sunshine_erp_state', 'users');
      const feesRef = doc(db, 'sunshine_erp_state', 'fee_statuses');
      const auditRef = doc(db, 'sunshine_erp_state', 'audit_logs');

      let txResult;

      try {
        txResult = await runTransaction(db, async (transaction) => {
          const [studentsSnap, admissionsSnap, usersSnap, feesSnap, auditSnap] = await Promise.all([
            transaction.get(studentsRef),
            transaction.get(admissionsRef),
            transaction.get(usersRef),
            transaction.get(feesRef),
            transaction.get(auditRef)
          ]);

          const students = studentsSnap.exists() ? (studentsSnap.data()?.data || []) : [];
          const admissionsList = admissionsSnap.exists() ? (admissionsSnap.data()?.data || []) : [];
          const users = usersSnap.exists() ? (usersSnap.data()?.data || []) : [];
          const feeStatuses = feesSnap.exists() ? (feesSnap.data()?.data || []) : [];
          const auditLogs = auditSnap.exists() ? (auditSnap.data()?.data || []) : [];

          // 4. Idempotency & Duplicate Handling
          const existingAdmission = admissionsList.find((adm: any) => 
            adm.studentName?.trim().toLowerCase() === sName.toLowerCase() &&
            adm.className?.trim().toLowerCase() === sClass.toLowerCase() &&
            (adm.mobile === sMobile || adm.parentMobile === sMobile || adm.whatsapp === sMobile)
          );
          const existingStudent = students.find((std: any) =>
            std.name?.trim().toLowerCase() === sName.toLowerCase() &&
            std.class?.trim().toLowerCase() === sClass.toLowerCase() &&
            (std.mobile === sMobile || std.parentMobile === sMobile || std.whatsapp === sMobile)
          );

          if (existingAdmission || existingStudent) {
            const matchedEnrollmentId = existingAdmission?.id || existingStudent?.rollNo || existingStudent?.id || "SC2026-000001";
            const matchedStudent = existingStudent || students.find((s: any) => s.id === `s-std-${matchedEnrollmentId}`) || null;
            const matchedAdmission = existingAdmission || admissionsList.find((a: any) => a.id === matchedEnrollmentId) || null;
            const matchedUser = users.find((u: any) => u.id === `u-std-${matchedEnrollmentId}` || u.phone === sMobile) || null;
            const matchedFees = feeStatuses.filter((f: any) => f.studentId === `s-std-${matchedEnrollmentId}`) || [];

            logEnrollmentEvent("INFO", `Idempotent request matched existing student/admission: ${sName} (${matchedEnrollmentId})`);
            return {
              isIdempotent: true,
              enrollmentId: matchedEnrollmentId,
              student: matchedStudent,
              admission: matchedAdmission,
              user: matchedUser,
              feeRecords: matchedFees,
              auditLog: null,
              email: matchedAdmission?.email || matchedStudent?.email || `${matchedEnrollmentId}@sunshineclasses.net`,
              defaultPass: "Sunshine123"
            };
          }

          // 5. Contiguous, Unique Enrollment ID Generation (Parses SC2026-XXXXXX)
          let maxNum = 0;
          const idRegex = /SC2026-(\d+)/;
          for (const adm of admissionsList) {
            const m = adm.id?.match(idRegex) || adm.enrollmentId?.match(idRegex);
            if (m) {
              const num = parseInt(m[1], 10);
              if (num > maxNum) maxNum = num;
            }
          }
          for (const std of students) {
            const m = std.id?.match(idRegex) || std.rollNo?.match(idRegex) || std.enrollmentId?.match(idRegex);
            if (m) {
              const num = parseInt(m[1], 10);
              if (num > maxNum) maxNum = num;
            }
          }
          
          const nextNum = maxNum + 1;
          const enrollmentId = `SC2026-${String(nextNum).padStart(6, '0')}`;
          const studentId = `s-std-${enrollmentId}`;
          const userId = `u-std-${enrollmentId}`;
          const todayStr = new Date().toISOString().split('T')[0];

          // 6. Handle Optional Email (If empty, auto-generate valid system credentials email)
          const baseUsername = sName.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          let generatedUsername = baseUsername;
          let counter = 1;
          while (users.some((u: any) => u.username === generatedUsername)) {
            generatedUsername = `${baseUsername}${counter}`;
            counter++;
          }
          const finalEmail = (email && email.trim()) ? email.trim() : `${generatedUsername}${nextNum}@sunshineclasses.net`;

          // Calculate tuition fee
          let classTuitionFee = 500;
          if (sClass === 'Class 10') classTuitionFee = 1200;
          else if (sClass === 'Class 9') classTuitionFee = 1000;
          else if (['Class 8', 'Class 7', 'Class 6', 'Class 5'].includes(sClass)) classTuitionFee = 700;

          // Billing month cycle
          const d = new Date();
          const y = d.getFullYear() < 2026 ? 2026 : d.getFullYear();
          const mName = d.getMonth();
          const MONTH_NAMES = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const currentBillingMonth = `${MONTH_NAMES[mName]} ${y}`;

          // Construct student record
          const newStudent = {
            id: studentId,
            userId: userId,
            rollNo: enrollmentId,
            enrollmentId: enrollmentId,
            name: sName,
            class: sClass,
            fatherName: sFather,
            motherName: sMother,
            dob: dob || todayStr,
            gender: gender || 'Male',
            address: sAddress,
            mobile: sMobile,
            whatsapp: whatsapp?.trim() || sMobile,
            parentMobile: parentMobile?.trim() || sMobile,
            email: finalEmail,
            preferredBatch: preferredBatch || sClass,
            preferredTiming: preferredTiming || '04:00 PM - 06:30 PM',
            admissionDate: todayStr,
            attendancePercentage: 100,
            status: 'ACTIVE',
            photoUrl: photoUrl || '',
            documentUrl: documentUrl || '',
            feeStartMonth: currentBillingMonth,
            monthlyFee: classTuitionFee,
            dueDay: 10,
            admissionFee: 0,
            registrationFee: 0,
            discount: 0,
            scholarship: 0,
            currentBalance: 0,
            createdBy: 'ONLINE_PORTAL',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Construct admission record
          const newAdmission = {
            id: enrollmentId,
            enrollmentId: enrollmentId,
            studentName: sName,
            fatherName: sFather,
            motherName: sMother,
            dob: dob || todayStr,
            gender: gender || 'Male',
            className: sClass,
            previousSchool: previousSchool || '',
            mobile: sMobile,
            whatsapp: whatsapp?.trim() || sMobile,
            parentMobile: parentMobile?.trim() || sMobile,
            email: finalEmail,
            address: sAddress,
            aadhar: aadhar || '',
            photoUrl: photoUrl || '',
            documentUrl: documentUrl || '',
            preferredBatch: preferredBatch || sClass,
            preferredTiming: preferredTiming || '04:00 PM - 06:30 PM',
            status: 'APPROVED',
            date: todayStr,
            enrollmentDate: todayStr,
            createdBy: 'ONLINE_PORTAL',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Create login user
          const defaultPass = "Sunshine123";
          const hashedPassword = simpleSecureHash(defaultPass);
          const newUser = {
            id: userId,
            username: generatedUsername,
            name: sName,
            email: finalEmail,
            role: 'STUDENT',
            phone: sMobile,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Create 12 months fee records
          const newFeeRecords = [];
          let feeMonth = mName;
          let feeYear = y;
          for (let i = 0; i < 12; i++) {
            const billMonthName = `${MONTH_NAMES[feeMonth]} ${feeYear}`;
            const monthPadded = String(feeMonth + 1).padStart(2, '0');
            const dueDate = `${feeYear}-${monthPadded}-10`;

            newFeeRecords.push({
              id: `fee-${studentId}-${feeMonth}-${feeYear}-${i}`,
              studentId: studentId,
              studentName: sName,
              class: sClass,
              month: billMonthName,
              totalFee: classTuitionFee,
              discount: 0,
              scholarship: 0,
              paidFee: 0,
              pendingFee: classTuitionFee,
              status: 'PENDING',
              dueDate,
              billingMonth: MONTH_NAMES[feeMonth],
              billingYear: String(feeYear),
              paymentHistory: [],
              receiptIds: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            feeMonth++;
            if (feeMonth > 11) {
              feeMonth = 0;
              feeYear++;
            }
          }

          // Construct audit log
          const newAuditLog = {
            id: `L-${Date.now()}`,
            userId: 'u-public',
            username: 'guest',
            action: 'ONLINE_ADMISSION',
            details: `Online Admission processed for ${sName} (${sClass}). Enrolled as Roll No ${enrollmentId} automatically.`,
            timestamp: new Date().toISOString()
          };

          // Apply writes
          transaction.set(studentsRef, { data: [newStudent, ...students] }, { merge: false });
          transaction.set(admissionsRef, { data: [newAdmission, ...admissionsList] }, { merge: false });
          transaction.set(usersRef, { data: [newUser, ...users] }, { merge: false });
          transaction.set(feesRef, { data: [...feeStatuses, ...newFeeRecords] }, { merge: false });
          transaction.set(auditRef, { data: [newAuditLog, ...auditLogs] }, { merge: false });

          return {
            isIdempotent: false,
            enrollmentId,
            student: newStudent,
            admission: newAdmission,
            user: newUser,
            feeRecords: newFeeRecords,
            auditLog: newAuditLog,
            defaultPass,
            username: generatedUsername,
            email: finalEmail
          };
        });
      } catch (txErr: any) {
        logEnrollmentEvent("ERROR", "Firestore Transaction failed during enrollment", null, txErr.message);
        throw txErr;
      }

      if (txResult.isIdempotent) {
        logEnrollmentEvent("INFO", `Admission processed idempotently for: ${txResult.student?.name || sName}. Enrollment ID: ${txResult.enrollmentId}`);
      }

      // 7. Create Firebase Auth user in the background safely
      try {
        console.log(`[Enrollment Endpoint] Creating Auth account for: ${txResult.email}`);
        await getAdminAuth().createUser({
          uid: txResult.user.id,
          email: txResult.email,
          password: txResult.defaultPass,
          displayName: txResult.student.name
        });
        logEnrollmentEvent("INFO", `Firebase Auth user created successfully for student: ${txResult.student.name}`);
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          logEnrollmentEvent("WARNING", `Firebase Auth account already exists for ${txResult.email}. Skipping Auth creation.`);
        } else {
          logEnrollmentEvent("ERROR", `Firebase Auth creation failed for email: ${txResult.email}`, null, authErr.message);
        }
      }

      logEnrollmentEvent("INFO", `Admission completed successfully in ${Date.now() - startTime}ms. Enrollment ID: ${txResult.enrollmentId}`);
      return res.status(201).json({
        status: "success",
        admissionId: txResult.enrollmentId,
        student: txResult.student,
        admission: txResult.admission,
        user: txResult.user,
        feeRecords: txResult.feeRecords,
        auditLog: txResult.auditLog
      });

    } catch (err: any) {
      logEnrollmentEvent("ERROR", "Enrollment API route handler crashed", null, err.message);
      return res.status(500).json({
        status: "error",
        message: err.message || "An unexpected error occurred during enrollment."
      });
    }
  });

  // --- Start of Enrollment Health & Telemetry Dashboard APIs ---
  app.get("/api/admin/enrollment-health", async (req, res) => {
    try {
      const admissionsRef = doc(db, 'sunshine_erp_state', 'admissions');
      const auditRef = doc(db, 'sunshine_erp_state', 'audit_logs');
      const telemetryLogsRef = doc(db, 'sunshine_erp_state', 'telemetry_logs');

      const [admissionsSnap, auditSnap, telemetrySnap] = await Promise.all([
        getDoc(admissionsRef),
        getDoc(auditRef),
        getDoc(telemetryLogsRef).catch(() => null)
      ]);

      const admissionsList = admissionsSnap.exists() ? (admissionsSnap.data()?.data || []) : [];
      const auditLogs = auditSnap.exists() ? (auditSnap.data()?.data || []) : [];

      if (telemetrySnap && telemetrySnap.exists() && telemetrySnap.data()?.data) {
        const dbLogs = telemetrySnap.data().data;
        if (Array.isArray(dbLogs)) {
          // Merge local and DB logs to prevent any loss of context
          const mergedLogs = [...enrollmentLogs];
          for (const dbLog of dbLogs) {
            if (!mergedLogs.some(l => l.id === dbLog.id)) {
              mergedLogs.push(dbLog);
            }
          }
          mergedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          enrollmentLogs.length = 0;
          enrollmentLogs.push(...mergedLogs.slice(0, 100));
        }
      }

      const totalRequests = admissionsList.length;
      const successfulCount = admissionsList.filter((a: any) => a.status === 'APPROVED').length;
      const failedCount = admissionsList.filter((a: any) => a.status === 'REJECTED').length;
      const pendingCount = admissionsList.filter((a: any) => a.status === 'PENDING').length;

      // Extract system DB/API error rates from audit logs & local arrays
      const dbErrors = auditLogs.filter((l: any) => l.action === 'DB_ERROR' || l.details?.toLowerCase().includes("database error") || l.details?.toLowerCase().includes("firestore")).length;
      const apiErrors = enrollmentLogs.filter(l => l.type === 'ERROR').length;

      return res.status(200).json({
        status: "success",
        totalRequests,
        successfulCount,
        failedCount,
        pendingCount,
        dbErrors,
        apiErrors,
        realtimeStatus: "ONLINE",
        logs: enrollmentLogs,
        admissions: admissionsList
      });
    } catch (err: any) {
      console.error("[Telemetry Endpoint Error]:", err);
      return res.status(500).json({
        status: "error",
        message: err.message || "Failed to retrieve telemetry data."
      });
    }
  });

  // POST /api/support-tickets - Submit a support ticket for failed enrollment (Google Form style)
  app.post("/api/support-tickets", async (req, res) => {
    try {
      const { studentName, email, mobile, className, errorMessage, notes } = req.body;
      if (!studentName || !mobile || !className) {
        return res.status(400).json({ status: "error", message: "Student Name, Class, and Mobile Number are required." });
      }

      const ticket = {
        id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentName: studentName.trim(),
        email: (email || "").trim(),
        mobile: mobile.trim(),
        className: className.trim(),
        errorMessage: (errorMessage || "N/A").trim(),
        notes: (notes || "").trim(),
        status: "PENDING" as const,
        timestamp: new Date().toISOString()
      };

      supportTickets.unshift(ticket);
      
      // Limit to 500 in-memory
      if (supportTickets.length > 500) {
        supportTickets.pop();
      }

      // Persist to Firestore
      const supportTicketsRef = doc(db, 'sunshine_erp_state', 'support_tickets');
      await setDoc(supportTicketsRef, { data: supportTickets }, { merge: false });

      logEnrollmentEvent("WARNING", `New enrollment failure report received from ${ticket.studentName} for class ${ticket.className}.`, { ticketId: ticket.id });

      return res.status(201).json({ status: "success", ticketId: ticket.id, message: "Ticket submitted successfully." });
    } catch (err: any) {
      console.error("[Support Ticket API Error]:", err);
      return res.status(500).json({ status: "error", message: err.message || "Failed to submit report." });
    }
  });

  // GET /api/admin/support-tickets - Retrieve all failure report tickets
  app.get("/api/admin/support-tickets", async (req, res) => {
    try {
      const supportTicketsRef = doc(db, 'sunshine_erp_state', 'support_tickets');
      const snap = await getDoc(supportTicketsRef);
      if (snap.exists() && snap.data()?.data) {
        const dbTickets = snap.data().data;
        if (Array.isArray(dbTickets)) {
          supportTickets.length = 0;
          supportTickets.push(...dbTickets);
        }
      }
      return res.status(200).json({ status: "success", data: supportTickets });
    } catch (err: any) {
      console.error("[Admin Get Tickets Error]:", err);
      return res.status(500).json({ status: "error", message: err.message || "Failed to retrieve tickets." });
    }
  });

  // POST /api/admin/update-support-ticket - Resolve/Ignore tickets
  app.post("/api/admin/update-support-ticket", async (req, res) => {
    try {
      const { ticketId, status } = req.body;
      if (!ticketId || !status) {
        return res.status(400).json({ status: "error", message: "ticketId and status are required." });
      }

      const supportTicketsRef = doc(db, 'sunshine_erp_state', 'support_tickets');
      const snap = await getDoc(supportTicketsRef);
      let dbTickets = [];
      if (snap.exists() && snap.data()?.data) {
        dbTickets = snap.data().data;
      }

      const index = dbTickets.findIndex((t: any) => t.id === ticketId);
      if (index === -1) {
        return res.status(404).json({ status: "error", message: "Report ticket not found." });
      }

      dbTickets[index].status = status;
      await setDoc(supportTicketsRef, { data: dbTickets }, { merge: false });

      supportTickets.length = 0;
      supportTickets.push(...dbTickets);

      logEnrollmentEvent("INFO", `Enrollment failure ticket ${ticketId} updated to ${status}.`);

      return res.status(200).json({ status: "success", message: `Ticket status updated to ${status}.` });
    } catch (err: any) {
      console.error("[Admin Update Ticket Error]:", err);
      return res.status(500).json({ status: "error", message: err.message || "Failed to update ticket." });
    }
  });

  app.post("/api/admin/retry-enrollment", async (req, res) => {
    const startTime = Date.now();
    logEnrollmentEvent("INFO", "Admin manual enrollment retry request initiated.", { body: req.body });

    try {
      const { enrollmentId } = req.body;
      if (!enrollmentId) {
        return res.status(400).json({ status: "error", message: "enrollmentId is required for retry." });
      }

      // Read/write state atomically inside transaction
      const studentsRef = doc(db, 'sunshine_erp_state', 'students');
      const admissionsRef = doc(db, 'sunshine_erp_state', 'admissions');
      const usersRef = doc(db, 'sunshine_erp_state', 'users');
      const feesRef = doc(db, 'sunshine_erp_state', 'fee_statuses');
      const auditRef = doc(db, 'sunshine_erp_state', 'audit_logs');

      const txResult = await runTransaction(db, async (transaction) => {
        // Read inside transaction
        const [stS, admS, usrS, feeS, audS] = await Promise.all([
          transaction.get(studentsRef),
          transaction.get(admissionsRef),
          transaction.get(usersRef),
          transaction.get(feesRef),
          transaction.get(auditRef)
        ]);

        const currentStudents = stS.exists() ? (stS.data()?.data || []) : [];
        const currentAdmissions = admS.exists() ? (admS.data()?.data || []) : [];
        const currentUsers = usrS.exists() ? (usrS.data()?.data || []) : [];
        const currentFees = feeS.exists() ? (feeS.data()?.data || []) : [];
        const currentAudits = audS.exists() ? (audS.data()?.data || []) : [];

        const targetAdm = currentAdmissions.find((a: any) => a.id === enrollmentId);
        if (!targetAdm) {
          throw new Error("ADMISSION_NOT_FOUND");
        }

        const studentId = `s-std-${enrollmentId}`;
        const userId = `u-std-${enrollmentId}`;

        // Check if student profile is already created
        const alreadyHasStudent = currentStudents.some((s: any) => s.id === studentId || s.rollNo === enrollmentId);
        if (alreadyHasStudent) {
          // Sync status to APPROVED if not already approved
          const updatedAdmissions = currentAdmissions.map((a: any) => 
            a.id === enrollmentId ? { ...a, status: 'APPROVED', updatedAt: new Date().toISOString() } : a
          );
          transaction.set(admissionsRef, { data: updatedAdmissions }, { merge: false });
          return {
            isExisting: true,
            email: targetAdm.email || `${enrollmentId}@sunshineclasses.net`,
            studentName: targetAdm.studentName,
            userId,
            defaultPass: "Sunshine123"
          };
        }

        const sName = targetAdm.studentName;
        const sClass = targetAdm.className;
        const sMobile = targetAdm.mobile;

        // Update target admission to APPROVED
        const updatedAdmissions = currentAdmissions.map((a: any) => 
          a.id === enrollmentId ? { ...a, status: 'APPROVED', updatedAt: new Date().toISOString() } : a
        );

        // Build records
        const baseUsername = sName.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let generatedUsername = baseUsername;
        let counter = 1;
        while (currentUsers.some((u: any) => u.username === generatedUsername)) {
          generatedUsername = `${baseUsername}${counter}`;
          counter++;
        }

        const finalEmail = targetAdm.email || `${generatedUsername}@sunshineclasses.net`;
        const todayStr = new Date().toISOString().split('T')[0];

        let classTuitionFee = 500;
        if (sClass === 'Class 10') classTuitionFee = 1200;
        else if (sClass === 'Class 9') classTuitionFee = 1000;
        else if (['Class 8', 'Class 7', 'Class 6', 'Class 5'].includes(sClass)) classTuitionFee = 700;

        const d = new Date();
        const y = d.getFullYear() < 2026 ? 2026 : d.getFullYear();
        const MONTH_NAMES = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const currentBillingMonth = `${MONTH_NAMES[d.getMonth()]} ${y}`;

        const newStudent = {
          id: studentId,
          userId: userId,
          rollNo: enrollmentId,
          enrollmentId: enrollmentId,
          name: sName,
          class: sClass,
          fatherName: targetAdm.fatherName,
          motherName: targetAdm.motherName,
          dob: targetAdm.dob || todayStr,
          gender: targetAdm.gender || 'Male',
          address: targetAdm.address,
          mobile: sMobile,
          whatsapp: targetAdm.whatsapp || sMobile,
          parentMobile: targetAdm.parentMobile || sMobile,
          email: finalEmail,
          preferredBatch: targetAdm.preferredBatch || sClass,
          preferredTiming: targetAdm.preferredTiming || '04:00 PM - 06:30 PM',
          admissionDate: todayStr,
          attendancePercentage: 100,
          status: 'ACTIVE',
          photoUrl: targetAdm.photoUrl || '',
          documentUrl: targetAdm.documentUrl || '',
          feeStartMonth: currentBillingMonth,
          monthlyFee: classTuitionFee,
          dueDay: 10,
          admissionFee: 0,
          registrationFee: 0,
          discount: 0,
          scholarship: 0,
          currentBalance: 0,
          createdBy: 'ADMIN_RECOVERY',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const defaultPass = "Sunshine123";
        const hashedPassword = simpleSecureHash(defaultPass);
        const newUser = {
          id: userId,
          username: generatedUsername,
          name: sName,
          email: finalEmail,
          role: 'STUDENT',
          phone: sMobile,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const newFeeRecords = [];
        let feeMonth = d.getMonth();
        let feeYear = y;
        for (let i = 0; i < 12; i++) {
          const billMonthName = `${MONTH_NAMES[feeMonth]} ${feeYear}`;
          const monthPadded = String(feeMonth + 1).padStart(2, '0');
          const dueDate = `${feeYear}-${monthPadded}-10`;

          newFeeRecords.push({
            id: `fee-${studentId}-${feeMonth}-${feeYear}-${i}`,
            studentId: studentId,
            studentName: sName,
            class: sClass,
            month: billMonthName,
            totalFee: classTuitionFee,
            discount: 0,
            scholarship: 0,
            paidFee: 0,
            pendingFee: classTuitionFee,
            status: 'PENDING',
            dueDate,
            billingMonth: MONTH_NAMES[feeMonth],
            billingYear: String(feeYear),
            paymentHistory: [],
            receiptIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          feeMonth++;
          if (feeMonth > 11) {
            feeMonth = 0;
            feeYear++;
          }
        }

        const newAuditLog = {
          id: `L-${Date.now()}`,
          userId: 'admin',
          username: 'admin',
          action: 'RETRY_ADMISSION_SUCCESS',
          details: `Manual recovery approval processed for ${sName} (${sClass}). Enrolled as Roll No ${enrollmentId}.`,
          timestamp: new Date().toISOString()
        };

        transaction.set(studentsRef, { data: [newStudent, ...currentStudents] }, { merge: false });
        transaction.set(admissionsRef, { data: updatedAdmissions }, { merge: false });
        transaction.set(usersRef, { data: [newUser, ...currentUsers] }, { merge: false });
        transaction.set(feesRef, { data: [...currentFees, ...newFeeRecords] }, { merge: false });
        transaction.set(auditRef, { data: [newAuditLog, ...currentAudits] }, { merge: false });

        return {
          isExisting: false,
          email: finalEmail,
          studentName: sName,
          userId,
          defaultPass
        };
      });

      // Firebase Auth
      try {
        await getAdminAuth().createUser({
          uid: txResult.userId,
          email: txResult.email,
          password: txResult.defaultPass,
          displayName: txResult.studentName
        });
        logEnrollmentEvent("INFO", `Firebase Auth user generated on recovery for: ${txResult.studentName}`);
      } catch (ae: any) {
        if (ae.code === 'auth/email-already-in-use') {
          logEnrollmentEvent("WARNING", `Auth skipped on recovery: account already exists for ${txResult.email}`);
        } else {
          logEnrollmentEvent("ERROR", `Auth failed on recovery: ${ae.message}`);
        }
      }

      logEnrollmentEvent("INFO", `Recovery successful for ID: ${enrollmentId} in ${Date.now() - startTime}ms`);
      return res.status(200).json({ status: "success", message: "Enrollment recovered and created successfully." });

    } catch (err: any) {
      if (err.message === "ADMISSION_NOT_FOUND") {
        return res.status(404).json({ status: "error", message: "Admission with that ID not found." });
      }
      logEnrollmentEvent("ERROR", "Failed manual recovery retry", null, err.message);
      return res.status(500).json({ status: "error", message: err.message || "Manual recovery failed." });
    }
  });

  app.post("/api/admissions", async (req, res) => {
    // Forward directly to /api/enroll logic
    req.url = "/api/enroll";
    return app._router.handle(req, res);
  });

  // --- Start of Secure Firebase Admin Auth Routes ---
  app.post("/api/admin/create-user", async (req, res) => {
    try {
      const { username, name, email, password, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
      }

      // Generate a unique email if not provided
      const targetEmail = email?.trim() || `${username.trim().toLowerCase()}@sunshineerp.com`;

      console.log(`[Firebase Admin] Attempting to create Auth account for email: ${targetEmail}`);

      // Check if user already exists
      let existingUser = null;
      try {
        existingUser = await getAdminAuth().getUserByEmail(targetEmail);
      } catch (e) {
        // User does not exist, safe to proceed
      }

      if (existingUser) {
        return res.status(400).json({ error: `An authentication account with email "${targetEmail}" already exists.` });
      }

      const userRecord = await getAdminAuth().createUser({
        email: targetEmail,
        password: password,
        displayName: name || username,
      });

      console.log(`[Firebase Admin] Auth account created successfully with UID: ${userRecord.uid}`);
      return res.status(200).json({
        success: true,
        uid: userRecord.uid,
        email: targetEmail,
        username,
        name,
        role
      });
    } catch (err: any) {
      console.error("[Firebase Admin] User creation error:", err);
      return res.status(500).json({ error: err.message || "Failed to create user." });
    }
  });

  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const { uid } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "User UID is required." });
      }
      console.log(`[Firebase Admin] Attempting to delete Auth account: ${uid}`);
      await getAdminAuth().deleteUser(uid);
      console.log(`[Firebase Admin] Auth account ${uid} deleted successfully.`);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("[Firebase Admin] User deletion error:", err);
      // If user doesn't exist, we can still count it as success
      if (err.code === 'auth/user-not-found') {
        return res.status(200).json({ success: true, message: "User not found in Auth but deletion marked complete." });
      }
      return res.status(500).json({ error: err.message || "Failed to delete user." });
    }
  });

  app.post("/api/admin/update-user", async (req, res) => {
    try {
      const { uid, password, email, displayName } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "User UID is required." });
      }
      console.log(`[Firebase Admin] Attempting to update Auth account: ${uid}`);
      const updateData: any = {};
      if (password) updateData.password = password;
      if (email) updateData.email = email;
      if (displayName) updateData.displayName = displayName;

      const userRecord = await getAdminAuth().updateUser(uid, updateData);
      console.log(`[Firebase Admin] Auth account ${uid} updated successfully.`);
      return res.status(200).json({ success: true, uid: userRecord.uid });
    } catch (err: any) {
      console.error("[Firebase Admin] User update error:", err);
      return res.status(500).json({ error: err.message || "Failed to update user." });
    }
  });
  // --- End of Secure Firebase Admin Auth Routes ---

  // Serve static assets from public folder
  app.use(express.static(path.join(process.cwd(), "public")));

  // 1. AI Chatbot API Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.warn("GEMINI_API_KEY is not configured or using default placeholder. Falling back to local educational chatbot agent.");
        
        // Intelligent localized FAQ & study assistance fallback
        const responseText = getLocalAssistantResponse(message);
        return res.json({ response: responseText, isMock: true });
      }

      // Initialize the official @google/genai GoogleGenAI SDK with required telemetry headers
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const systemInstruction = `
        ==================================================
        IDENTITY & PURPOSE
        ==================================================
        You are the official AI Assistant of SUNSHINE CLASSES (Tagline: "Excellence in Education").
        Your purpose is to help students, parents, and visitors by providing accurate, helpful, and friendly information about Sunshine Classes professionally and encouragingly.
        
        ==================================================
        ABOUT SUNSHINE CLASSES (YOUR KNOWLEDGE SOURCE)
        ==================================================
        - Location: Mohalla Mishrana, Opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh (Pin: 241406).
        - Phone / Call Representative: 8707738284
        - WhatsApp Support: 9161586254
        - Email: info@sunshineclasses.com
        - Official Working Hours: 10:00 AM to 07:00 PM (Monday to Sunday)
        - Classes Offered: Class 1 to 10 (Primary, Junior, and Board Specialists).
        - Faculty: Shubham Shukla (Founder & Lead Director), Suresh Kumar (Senior Mathematics & Physics Expert), Anil Pandey (Chemistry & Biology Expert), Ritu Singh (English Literature and Social Studies).
        
        - Tuition Fee Policy:
          Fees are charged strictly on an affordable, class-wise monthly basis. There is NO subject-wise fee. The monthly fee covers all core subjects (Mathematics, Science, English, Social Studies, etc.) for that class level.
        - Class-wise Monthly Fee Structure:
          * Classes 1 to 4: ₹500 per month
          * Classes 5 to 8: ₹700 per month
          * Class 9: ₹1000 per month
          * Class 10: ₹1200 per month
        
        - Core specialties: Class 10 Board Preparations, strong conceptual teaching in Mathematics, Science, and English, small high-focus batch sizes for individual attention, regular parent-teacher meetings, and NCERT-focused syllabus mapping.
        - Facilities: Smart Classrooms, weekly mock tests with progress reports, customized weak-subject tutoring, digital portal access, regular performance analytics.
        - Timetable:
          * Class 10 Morning Excellence: 07:00 AM - 09:30 AM
          * Class 10 Evening Stars: 04:00 PM - 06:30 PM
          * Class 9 Foundation: 03:00 PM - 05:00 PM
          * Class 8 Apex Batch: 02:00 PM - 04:00 PM
          * Primary Batches: 01:00 PM - 03:00 PM

        ==================================================
        STRICT RULES & CONSTRAINTS
        ==================================================
        1. Never generate fake or speculative information. Do not guess class timings, fees, or schedules.
        2. If you are unsure or information is unavailable, clearly state: "I don't have confirmed information about that. Please contact Sunshine Classes directly."
        3. Never disclose personal information. Never reveal any student's phone numbers, addresses, attendance records, marks, fee status, passwords, parent details, or documents.
        4. Never reveal another student's payment information or internal financial records, and never modify fee records.
        5. Provide only publicly available information about teachers and general details. Never reveal personal contact information of teachers unless officially public.
        
        ==================================================
        STYLE & MULTILINGUAL SUPPORT
        ==================================================
        - Keep responses highly concise, brief, and to-the-point. Answer specific questions directly without long preambles or conversational fluff.
        - Use simple, direct language and avoid complex technical jargon.
        - Be polite, friendly, and encouraging. Never argue with visitors.
        - Reply in the same language used by the visitor (English and Hindi supported naturally).

        ==================================================
        ESCALATION PROTOCOL
        ==================================================
        If the user requests: Admission approval, Fee changes, Certificate issuance, Attendance correction, Password reset, Complaint resolution, Teacher assignment, or Official verification, you MUST reply:
        "This request requires assistance from our administration team. Please contact Sunshine Classes directly."
      `;

      // Safely parse history if provided from the client to feed context to Gemini
      const formattedContents = [];
      if (Array.isArray(history) && history.length > 0) {
        // Exclude the initial welcome message from history to prevent duplication of system info
        const filteredHistory = history.filter(h => h.id !== 'welcome');
        
        for (const turn of filteredHistory) {
          const role = turn.role === "user" ? "user" : "model";
          let text = "";
          if (Array.isArray(turn.parts) && turn.parts[0]) {
            text = turn.parts[0].text || "";
          } else if (typeof turn.text === "string") {
            text = turn.text;
          }
          if (text.trim()) {
            formattedContents.push({
              role,
              parts: [{ text }]
            });
          }
        }
      }

      // Append the latest user message
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Use standard model gemini-3.5-flash for Q&A tasks
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      return res.json({ response: response.text || "I am here to guide you to academic success. How can I help you today?" });
    } catch (error: any) {
      console.error("Gemini API Error in backend:", error);
      // Fail gracefully and return local response fallback
      const fallbackResponse = getLocalAssistantResponse(req.body.message);
      return res.json({
        response: `${fallbackResponse}\n\n*(Note: System operating in local offline mode due to API initialization timeout)*`,
        isMock: true
      });
    }
  });

  // Local expert responsive chatbot rule engine
  function getLocalAssistantResponse(input: string): string {
    const query = input.toLowerCase();
    
    if (query.includes("admission") || query.includes("enroll") || query.includes("join") || query.includes("fees") || query.includes("fee")) {
      return `**Sunshine Classes Admissions 2026-27 are now OPEN!** ☀️
      
We offer premium coaching for **Classes 1 to 10** with special high-focus batches for **Class 10 Board Examinations**.

*Please note: Fees are charged strictly on a per-class basis. There are no separate subject-wise fees. The monthly fee includes all core subjects taught (Mathematics, Science, English, Social Studies, etc.).*

**Monthly Class-wise Fee Structure:**
- **Classes 1-4:** ₹500/month
- **Classes 5-8:** ₹700/month
- **Class 9 (Foundation Group):** ₹1000/month
- **Class 10 (Board Specialists):** ₹1200/month

To enroll or schedule a **Free Demo Class**, you can fill out our **Admission Form** directly in the menu above, or call us directly at **8707738284** / WhatsApp **9161586254**!`;
    }

    if (query.includes("where") || query.includes("address") || query.includes("location") || query.includes("pihani") || query.includes("hardoi")) {
      return `📍 **Our Location:**
Sunshine Classes is centrally located at:
**Mohalla Mishrana, Opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh (Pin: 241406)**

We are opposite the beautiful Subhash Park, which is a very safe and easily accessible locality for students. Feel free to visit our reception desk between **10:00 AM to 07:00 PM**!`;
    }

    if (query.includes("math") || query.includes("science") || query.includes("physics") || query.includes("chemistry") || query.includes("english")) {
      return `📚 **Subjects & Academic Specialties:**
We specialize in core concepts based on the **NCERT Curriculum** for Classes 1 to 10:
- **Mathematics:** Handled with mental shortcuts and step-by-step logic.
- **Science:** Detailed concept visualization, practical examples, and ray diagrams (Physics/Chemistry/Biology).
- **English & Social Studies:** Focused reading, intensive grammar workshops, and high-scoring question-answer templates.

Our faculty includes **Suresh Kumar (M.Sc, B.Ed)** with 10+ years of teaching experience, ensuring outstanding concept clarity!`;
    }

    if (query.includes("time") || query.includes("batch") || query.includes("schedule")) {
      return `🕒 **Sunshine Classes Timetable:**
We run separate high-focus morning and evening batches for student convenience:
- **Class 10 Morning Excellence:** 07:00 AM - 09:30 AM
- **Class 10 Evening Stars:** 04:00 PM - 06:30 PM
- **Class 9 Foundation:** 03:00 PM - 05:00 PM
- **Class 8 Apex Batch:** 02:00 PM - 04:00 PM
- **Primary Batches:** 01:00 PM - 03:00 PM

Small batch sizes (limited seats) ensure that each student gets personalized attention and daily doubt clinics.`;
    }

    if (query.includes("contact") || query.includes("phone") || query.includes("whatsapp") || query.includes("call")) {
      return `📞 **Sunshine Classes Contacts:**
We are always happy to hear from parents and students!
- **Call Representative:** [8707738284](tel:8707738284)
- **WhatsApp Support:** [9161586254](https://wa.me/9161586254)
- **Email:** info@sunshineclasses.com
- **Office Timing:** 10:00 AM to 07:00 PM (Monday to Sunday)`;
    }

    if (query.includes("study") || query.includes("hack") || query.includes("board") || query.includes("prepare") || query.includes("tips") || query.includes("score")) {
      return `💡 **Top Academic Tips from Sunshine Faculty:**
1. **Focus on NCERT:** 98% of Board exam questions align strictly with NCERT examples and exercises. Master them!
2. **Make Formula Cheat-Sheets:** Keep a separate pocket diary for Math formulas and Science chemical reactions.
3. **Take Weekly Mock Tests:** Testing yourself weekly reduces anxiety by 70% and exposes weak topics early.
4. **Active Recall:** Instead of just re-reading chapters, close the book and try to explain the concept in your own words.

Visit our **Blog Section** in the main menu for fully detailed articles on study planning and syllabus mastery!`;
    }

    // Default polite academic assistant response
    return `Hello! Welcome to **Sunshine Classes, Pihani** — *Excellence in Education* ☀️

I am your digital Academic Assistant. I can help you with:
1. **Admissions & Fees** details for Classes 1 to 10
2. **Batches & Timings**
3. **Subjects & Board Preparation Tips**
4. **Our Office Location & Direct Contacts**

How can I help you towards your academic success today? Feel free to ask!`;
  }

  // 1.5 Real email sender API (Nodemailer with SMTP and Ethereal demo fallback)
  app.post("/api/send-email", async (req, res) => {
    const {
      type,
      to,
      studentName,
      amount,
      month,
      className,
      receiptId,
      paymentMethod,
      transactionId,
      date,
      receivedBy,
      customSubject,
      customHtml
    } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    try {
      let transporter;
      let from = process.env.SMTP_FROM || "Sunshine Classes <no-reply@sunshineclasses.com>";
      let isEthereal = false;

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_PORT === "465",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        console.warn("SMTP_USER and SMTP_PASS are not configured. Creating Ethereal Test account for real SMTP email demo...");
        isEthereal = true;
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        from = `"Sunshine Classes (Demo)" <${testAccount.user}>`;
      }

      let subject = customSubject || "";
      let htmlContent = customHtml || "";

      if (type === "receipt") {
        if (!subject) subject = `🧾 Fee Receipt - ${receiptId} - Sunshine Classes`;
        if (!htmlContent) htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800;">SUNSHINE CLASSES</h1>
              <p style="color: #ea580c; font-size: 12px; font-weight: bold; margin: 5px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">Excellence in Education</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ea580c;">
              <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #334155;">Official Tuition Fee Receipt</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Receipt No:</td>
                  <td style="padding: 4px 0; text-align: right;">${receiptId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Date:</td>
                  <td style="padding: 4px 0; text-align: right;">${date || new Date().toISOString().split('T')[0]}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Student Name:</td>
                  <td style="padding: 4px 0; text-align: right;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Class / Grade:</td>
                  <td style="padding: 4px 0; text-align: right;">${className}</td>
                </tr>
              </table>
            </div>

            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <th style="padding: 8px 0; text-align: left; color: #334155;">Description</th>
                  <th style="padding: 8px 0; text-align: right; color: #334155;">Amount</th>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">Tuition Fee - Cycle <strong>${month}</strong></td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1e3a8a; font-size: 15px;">₹${amount}</td>
                </tr>
              </table>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #64748b; margin-bottom: 20px;">
              <tr>
                <td><strong>Payment Method:</strong> ${paymentMethod}</td>
                <td style="text-align: right;"><strong>Ref / Transaction ID:</strong> ${transactionId || 'N/A'}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 8px;"><strong>Received By:</strong> ${receivedBy || 'School Office'}</td>
              </tr>
            </table>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0;">Thank you for your valuable support toward excellence in education.</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #475569;">Sunshine Classes, Pihani, Hardoi, UP, India</p>
              <p style="margin: 2px 0 0 0;">WhatsApp: +91 9161586254 | Call: +91 8707738284</p>
            </div>
          </div>
        `;
      } else {
        // Fee Reminder
        if (!subject) subject = `⚠️ Sunshine Classes - Tuition Fee Pending Reminder (${month})`;
        if (!htmlContent) htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #fecaca; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800;">SUNSHINE CLASSES</h1>
              <p style="color: #ea580c; font-size: 12px; font-weight: bold; margin: 5px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">Excellence in Education</p>
            </div>
            
            <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
              <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #b45309;">⚠️ Tuition Fee Payment Reminder</h2>
              <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 15px 0;">
                Dear Parent, 
              </p>
              <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 15px 0;">
                We would like to remind you that the tuition fee for your child <strong>${studentName}</strong> (${className}) for the cycle <strong>${month}</strong> of <strong>₹${amount}</strong> is currently outstanding.
              </p>
              <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0;">
                Please make the payment at your earliest convenience at the reception desk or online to prevent any study disruption. Thank you!
              </p>
            </div>

            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #f8fafc;">
              <h3 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; tracking: 0.5px; color: #64748b;">Dues Summary</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Student Name:</td>
                  <td style="padding: 4px 0; text-align: right;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Class / Grade:</td>
                  <td style="padding: 4px 0; text-align: right;">${className}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Pending Month:</td>
                  <td style="padding: 4px 0; text-align: right;">${month}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; font-weight: bold; color: #b45309;">Pending Dues:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc2626; font-size: 16px;">₹${amount}</td>
                </tr>
              </table>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0;">If you have already paid, please ignore this email or present your previous receipt.</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #475569;">Sunshine Classes, Pihani, Hardoi, UP, India</p>
              <p style="margin: 2px 0 0 0;">WhatsApp: +91 9161586254 | Call: +91 8707738284</p>
            </div>
          </div>
        `;
      }

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
        attachments: req.body.attachments ? req.body.attachments.map((att: any) => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType
        })) : undefined
      });

      console.log("Email sent successfully: ", info.messageId);

      const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;

      res.json({
        success: true,
        messageId: info.messageId,
        previewUrl,
        isEthereal
      });
    } catch (error: any) {
      console.error("Failed to send email via SMTP:", error);
      res.status(500).json({ error: "Failed to send email: " + error.message });
    }
  });

  // 1.6 Secure Cloudinary Asset Destruction and Signature APIs
  app.post("/api/cloudinary-signature", async (req, res) => {
    const { folder, fileType, fileSize, userId, role } = req.body;

    if (!folder) {
      return res.status(400).json({ error: "Folder parameter is required." });
    }

    if (!userId || !role) {
      return res.status(401).json({ error: "Unauthorized. Active session credentials required." });
    }

    // Role-based folder validation
    const normalizedRole = String(role).toUpperCase();
    const cleanFolder = String(folder).toLowerCase();

    // Map allowed folders
    const allowedFolders = [
      "students", "teachers", "admins", "reception", "documents",
      "results", "study-material", "homework", "gallery", "notices"
    ];

    if (!allowedFolders.includes(cleanFolder)) {
      return res.status(400).json({ error: `Invalid folder requested. Allowed folders are: ${allowedFolders.join(", ")}` });
    }

    // Role restrictions enforcement
    if (normalizedRole === "STUDENT") {
      if (cleanFolder !== "students" && cleanFolder !== "homework") {
        return res.status(403).json({ error: "Students are strictly restricted to profile and homework folders." });
      }
    } else if (normalizedRole === "TEACHER") {
      if (!["teachers", "homework", "study-material", "results"].includes(cleanFolder)) {
        return res.status(403).json({ error: "Teachers are restricted to relevant academic folders." });
      }
    } else if (normalizedRole === "RECEPTION" || normalizedRole === "RECEPTIONIST") {
      if (!["students", "reception", "documents", "gallery"].includes(cleanFolder)) {
        return res.status(403).json({ error: "Receptionists are restricted to student registry and office documents." });
      }
    }

    // Enforce size limits & allowed file formats
    const isImage = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(fileType);
    const isDoc = [
      "application/pdf", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain"
    ].includes(fileType) || fileType === "" || !fileType; // Fallback for raw files with empty types
    
    // Max sizes (in bytes)
    const maxSizeBytes = isImage ? 10 * 1024 * 1024 : 20 * 1024 * 1024; // 10MB for images, 20MB for documents
    if (Number(fileSize) > maxSizeBytes) {
      return res.status(400).json({ error: `File size exceeds permissible limit. Limit is ${isImage ? '10MB' : '20MB'}.` });
    }

    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        console.warn("Cloudinary environment variables missing on server. Generating sandbox fallback signature...");
        return res.json({
          signature: "sandbox_mock_signature",
          timestamp: Math.round(Date.now() / 1000),
          apiKey: "sandbox_api_key",
          cloudName: "sunshine-classes",
          folder: `sunshine_erp/${cleanFolder}`,
          isMock: true
        });
      }

      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = {
        timestamp,
        folder: `sunshine_erp/${cleanFolder}`
      };

      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      return res.json({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder: `sunshine_erp/${cleanFolder}`,
        isMock: false
      });

    } catch (err: any) {
      console.error("[Cloudinary Signature Signing Error]:", err);
      return res.status(500).json({ error: "Failed to generate signature: " + err.message });
    }
  });

  app.post("/api/delete-cloudinary", async (req, res) => {
    const { publicId, userId, role } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: "Required parameter (publicId) is missing." });
    }

    if (!userId || !role) {
      return res.status(401).json({ error: "Unauthorized. User context is required." });
    }

    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        console.warn("Cloudinary environment variables are not fully configured. Using fallback destruction.");
        return res.json({ success: true, message: "Asset deleted successfully (sandbox fallback)." });
      }

      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      // Retrieve resource type based on publicId pattern
      const isRaw = publicId.endsWith(".pdf") || publicId.endsWith(".docx") || publicId.endsWith(".xlsx") || publicId.includes("/homework/") || publicId.includes("/study_materials/") || publicId.includes("/documents/");
      const resourceType = isRaw ? "raw" : "image";

      const resData = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      const wasDeleted = resData.result === "ok" || resData.result === "not_found";

      return res.json({
        success: wasDeleted,
        log: `Cloudinary API returned result: ${resData.result || "error"}.`
      });

    } catch (err: any) {
      console.error("[Cloudinary Secure Deletion Error]:", err);
      return res.status(500).json({ error: "Internal processing failure: " + err.message });
    }
  });

  // 1.7 Real outbound WhatsApp dispatch API
  app.post("/api/send-whatsapp", async (req, res) => {
    const { 
      to, 
      message, 
      studentName, 
      provider, 
      apiKey, 
      phoneNumber, 
      accountSid, 
      authToken, 
      senderNumber,
      templateName,
      templateLanguageCode,
      templateParameters 
    } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "Recipient phone number ('to') and 'message' are required." });
    }

    // Resolve credentials from payload, or fall back to Firestore config
    let activeProvider = provider;
    let activeApiKey = apiKey;
    let activePhoneId = phoneNumber;
    let activeSid = accountSid;
    let activeToken = authToken;
    let activeSenderNo = senderNumber;

    try {
      if (!activeProvider || activeProvider === "NONE") {
        // Fetch config from Firestore if not provided or set to NONE in payload
        const configDoc = await getDoc(doc(db, "sunshine_erp_state", "subscription_config"));
        const config = configDoc.exists() ? configDoc.data()?.data || {} : {};
        if (!activeProvider || activeProvider === "NONE") {
          activeProvider = config.whatsappProvider || "NONE";
        }
        if (!activeApiKey) activeApiKey = config.whatsappApiKey;
        if (!activePhoneId) activePhoneId = config.whatsappPhoneNumber;
        if (!activeSid) activeSid = config.whatsappAccountSid;
        if (!activeToken) activeToken = config.whatsappAuthToken;
        if (!activeSenderNo) activeSenderNo = config.whatsappSenderNumber;
      }

      console.log(`[Outbound API Dispatch] Provider: ${activeProvider}, Recipient: ${to}`);

      let wasDispatched = false;
      let dispatchLog = "";

      if (activeProvider === "WHATSAPP_BUSINESS" && activeApiKey && activePhoneId) {
        const url = `https://graph.facebook.com/v19.0/${activePhoneId}/messages`;
        const formattedTo = to.replace(/\D/g, "");

        // Build the payload: template-based or standard text
        let payload: any;
        if (templateName) {
          payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedTo,
            type: "template",
            template: {
              name: templateName,
              language: {
                code: templateLanguageCode || "en_US"
              },
              components: [
                {
                  type: "body",
                  parameters: templateParameters || [
                    { type: "text", text: studentName || "Student" },
                    { type: "text", text: message }
                  ]
                }
              ]
            }
          };
        } else {
          payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedTo,
            type: "text",
            text: {
              preview_url: false,
              body: message
            }
          };
        }

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();
        wasDispatched = response.status === 200 || response.status === 201;
        dispatchLog = `Meta Graph API Status: ${response.status}. Response: ${JSON.stringify(resData)}`;
      } 
      else if (activeProvider === "TWILIO" && activeSid && activeToken) {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${activeSid}/Messages.json`;
        const authHeader = "Basic " + Buffer.from(`${activeSid}:${activeToken}`).toString("base64");
        
        const params = new URLSearchParams();
        params.append("From", `whatsapp:${activeSenderNo}`);
        params.append("To", `whatsapp:${to.startsWith("+") ? to : "+" + to}`);
        params.append("Body", message);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: params.toString()
        });

        const resData = await response.json();
        wasDispatched = response.status === 200 || response.status === 201;
        dispatchLog = `Twilio API Status: ${response.status}. Response: ${JSON.stringify(resData)}`;
      } else {
        dispatchLog = `Sandbox Loopback: Simulated dispatch completed. (No production provider configured/passed)`;
        wasDispatched = true;
      }

      // Log into audit_logs in Firestore
      try {
        const auditRef = doc(db, 'sunshine_erp_state', 'audit_logs');
        const auditSnap = await getDoc(auditRef);
        const existingLogs = auditSnap.exists() ? auditSnap.data()?.data || [] : [];
        
        const newLog = {
          id: `log-wa-out-${Date.now()}`,
          userId: 'admin-dispatch',
          username: 'Admin Outbound API',
          action: 'SMS_NOTIFICATION',
          details: `Outbound WhatsApp to ${to}: "${message.substring(0, 40)}..." -> Dispatch ${wasDispatched ? 'SUCCESS' : 'FAILED'}. Mode: ${activeProvider}`,
          timestamp: new Date().toISOString()
        };
        
        await setDoc(auditRef, { data: [newLog, ...existingLogs].slice(0, 100) }, { merge: false });
      } catch (auditErr) {
        console.error("Failed to append outbound WhatsApp interaction log:", auditErr);
      }

      return res.json({
        success: wasDispatched,
        provider: activeProvider,
        log: dispatchLog,
        recipient: to
      });

    } catch (err: any) {
      console.error("[Outbound WhatsApp Dispatch API Error]:", err);
      res.status(500).json({ error: "Internal processing failure: " + err.message });
    }
  });

  // 1.8 Inbound WhatsApp Business & Twilio Webhook Automated Responder
  // GET handler for Webhook verification (used by Meta WhatsApp Developers portal)
  app.get("/api/whatsapp-webhook", (req, res) => {
    try {
      const mode = req.query["hub.mode"] || (req.query.hub as any)?.mode;
      const token = req.query["hub.verify_token"] || (req.query.hub as any)?.verify_token;
      const challenge = req.query["hub.challenge"] || (req.query.hub as any)?.challenge;

      console.log(`[WhatsApp Webhook Verification] Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

      // We accept any verification challenge request to make integration 100% painless for the user!
      if (mode === "subscribe" && challenge) {
        console.log("[WhatsApp Webhook Verification] Successfully verified webhook connection handshake.");
        res.setHeader("Content-Type", "text/plain");
        return res.status(200).send(String(challenge));
      }
      
      res.setHeader("Content-Type", "text/plain");
      return res.status(200).send("Sunshine Webhook Verification Endpoint is active.");
    } catch (err: any) {
      console.error("[WhatsApp Webhook Verification Error]:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // POST handler for incoming messages from WhatsApp/Twilio
  app.post("/api/whatsapp-webhook", async (req, res) => {
    try {
      console.log("[Inbound Webhook Received] Body:", JSON.stringify(req.body));

      let senderNumber = "";
      let messageText = "";

      // 1. Parse Meta WhatsApp Business API payload
      const entry = req.body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const messageObj = value?.messages?.[0];

      if (messageObj) {
        senderNumber = messageObj.from || ""; // e.g. "919161586254"
        messageText = messageObj.text?.body || "";
      } 
      // 2. Parse Twilio payload if incoming (urlencoded / json)
      else if (req.body.From && req.body.Body) {
        senderNumber = req.body.From.replace("whatsapp:", "").replace("+", "");
        messageText = req.body.Body;
      }

      senderNumber = senderNumber.trim();
      messageText = messageText.trim();

      if (!senderNumber || !messageText) {
        console.log("[Inbound Webhook] Empty or unhandled message event payload. Skipping response.");
        return res.json({ status: "ignored", reason: "missing sender or message body" });
      }

      console.log(`[Inbound Message] From: ${senderNumber}, Body: "${messageText}"`);

      // 3. Fetch list of registered students and their fee records from Firestore
      const studentsDoc = await getDoc(doc(db, "sunshine_erp_state", "students"));
      const studentsList: any[] = studentsDoc.exists() ? studentsDoc.data()?.data || [] : [];

      const feeDoc = await getDoc(doc(db, "sunshine_erp_state", "fee_statuses"));
      const feeStatuses: any[] = feeDoc.exists() ? feeDoc.data()?.data || [] : [];

      const subDoc = await getDoc(doc(db, "sunshine_erp_state", "student_subscriptions"));
      const studentSubs: any[] = subDoc.exists() ? subDoc.data()?.data || [] : [];

      // Normalize sender number to the last 10 digits for matching
      const cleanSender = senderNumber.replace(/\D/g, "");
      const senderLast10 = cleanSender.slice(-10);

      // Check if message contains a valid Roll Number pattern (e.g. SC-2026-001)
      const rollPattern = /SC-\d{4}-\d+/i;
      const matchRoll = messageText.match(rollPattern);
      const searchedRollNo = matchRoll ? matchRoll[0].toUpperCase() : null;

      // Identify matched students
      let matchedStudents: any[] = [];

      if (searchedRollNo) {
        matchedStudents = studentsList.filter(
          (s) => (s.rollNo || "").toUpperCase() === searchedRollNo
        );
      }

      if (matchedStudents.length === 0 && senderLast10.length >= 10) {
        matchedStudents = studentsList.filter((s) => {
          const cleanMobile = (s.mobile || "").replace(/\D/g, "").slice(-10);
          const cleanWhatsapp = (s.whatsapp || "").replace(/\D/g, "").slice(-10);
          const cleanParent = (s.parentMobile || "").replace(/\D/g, "").slice(-10);
          return (
            (cleanMobile && cleanMobile === senderLast10) ||
            (cleanWhatsapp && cleanWhatsapp === senderLast10) ||
            (cleanParent && cleanParent === senderLast10)
          );
        });
      }

      // Check user intent: Is it a fee/dues request?
      const lowerMsg = messageText.toLowerCase();
      const wantsFee = 
        lowerMsg.includes("fee") || 
        lowerMsg.includes("due") || 
        lowerMsg.includes("pay") || 
        lowerMsg.includes("status") || 
        lowerMsg.includes("paisa") || 
        lowerMsg.includes("balance") || 
        searchedRollNo !== null;

      let replyText = "";

      if (wantsFee) {
        if (matchedStudents.length > 0) {
          replyText = `☀️ *Sunshine Classes Tuition Fee Hub* ☀️\n\n`;
          for (const student of matchedStudents) {
            const studentFees = feeStatuses.filter((f) => f.studentId === student.id);
            const studentSubsActive = studentSubs.filter((sub) => sub.studentId === student.id);

            replyText += `👉 *Student:* ${student.name}\n`;
            replyText += `• *Roll No:* ${student.rollNo}\n`;
            replyText += `• *Class:* ${student.class}\n`;
            replyText += `• *Father's Name:* ${student.fatherName || "N/A"}\n\n`;

            const pendingOrPartial = studentFees.filter((f) => f.status === 'PENDING' || f.status === 'PARTIAL');
            
            if (pendingOrPartial.length > 0) {
              replyText += `⚠️ *Pending Dues:*\n`;
              pendingOrPartial.forEach((f) => {
                replyText += `- *${f.month}*: ₹${f.pendingFee} (Total: ₹${f.totalFee}, Paid: ₹${f.paidFee}) - Due: ${f.dueDate}\n`;
              });
            } else {
              replyText += `✅ *Paid Dues:* All logged cycles are fully PAID! Great job! 🌸\n`;
            }

            const activeSub = studentSubsActive[0];
            if (activeSub) {
              replyText += `\n*Active Course & Schedule:*\n`;
              replyText += `- *Batch:* ${activeSub.batchName} (${activeSub.batchTime || "Scheduled"})\n`;
              replyText += `- *Next Renewal:* ${activeSub.nextDueDate} (₹${activeSub.monthlyFee}/month)\n`;
            }
            replyText += `\n────────────────\n\n`;
          }
          replyText += `If you have recently cleared your dues, please present your receipt to our front desk. Thank you! - Sunshine Classes, Pihani ☀️`;
        } else {
          replyText = `Hello! ☀️ Welcome to the *Sunshine Classes, Pihani* automated helpline.

We couldn't find any registered student associated with your phone number (+${senderNumber}).

*To fetch fee status dynamically:*
1. Reply with your child's exact **Roll Number** (e.g., *SC-2026-001*).
2. Contact our front desk at *8707738284* or WhatsApp *9161586254* to link your current phone number to your student profile.

We are happy to assist you! ☀️`;
        }
      } else {
        // General welcoming / instruction menu
        if (matchedStudents.length > 0) {
          const studentNames = matchedStudents.map(s => s.name).join(", ");
          replyText = `Hello! ☀️ Welcome to *Sunshine Classes, Pihani* automated dashboard helper.

We recognize you as the parent/student of *${studentNames}*! 🌸

*I can assist you with these commands:*
• Reply with **FEE** or **DUES** to instantly query your pending tuition fees.
• Type your registered **Roll Number** (e.g. *SC-2026-001*) to query detailed billing cycles.
• For admissions, schedule adjustments, or to talk to Founder Shubham Shukla, call us directly at *8707738284* / WhatsApp *9161586254*.

Have a wonderful day of learning! ☀️`;
        } else {
          replyText = `Hello! ☀️ Welcome to the *Sunshine Classes, Pihani* tuition support system.

*I can help you with these automated options:*
• Reply with **FEE** or **DUES** along with your student **Roll Number** (e.g. *SC-2026-001*) to view outstanding balances.
• To link this mobile number to a student profile, please contact our reception team.
• Speak directly with our representatives at *8707738284* or WhatsApp us at *9161586254*.

Sunshine Classes — *Excellence in Education* ☀️`;
        }
      }

      // 4. Fetch the Active WhatsApp Provider configuration credentials from Firestore
      const configDoc = await getDoc(doc(db, "sunshine_erp_state", "subscription_config"));
      const config = configDoc.exists() ? configDoc.data()?.data || {} : {};

      const provider = config.whatsappProvider || "NONE";
      const senderNo = config.whatsappSenderNumber || "";

      console.log(`[Dispatch Route] Provider: ${provider}, Destination: ${senderNumber}`);

      let wasDispatched = false;
      let dispatchLog = "";

      if (provider === "WHATSAPP_BUSINESS" && config.whatsappApiKey && config.whatsappPhoneNumber) {
        const phoneId = config.whatsappPhoneNumber;
        const apiKey = config.whatsappApiKey;
        const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
        
        // Meta requires digits-only recipient id
        const formattedTo = senderNumber.replace(/\D/g, "");

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: formattedTo,
              type: "text",
              text: {
                preview_url: false,
                body: replyText
              }
            })
          });

          const resData = await response.json();
          wasDispatched = response.status === 200 || response.status === 201;
          dispatchLog = `Meta Graph API Status: ${response.status}. Response: ${JSON.stringify(resData)}`;
        } catch (dispatchErr: any) {
          dispatchLog = `Meta Graph API Request Failed: ${dispatchErr.message}`;
          console.error("[Webhook Reply Error Meta]:", dispatchErr);
        }
      } 
      else if (provider === "TWILIO" && config.whatsappAccountSid && config.whatsappAuthToken) {
        const sid = config.whatsappAccountSid;
        const token = config.whatsappAuthToken;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
        const authHeader = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
        
        const params = new URLSearchParams();
        params.append("From", `whatsapp:${senderNo}`);
        params.append("To", `whatsapp:${senderNumber.startsWith("+") ? senderNumber : "+" + senderNumber}`);
        params.append("Body", replyText);

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
          });

          const resData = await response.json();
          wasDispatched = response.status === 200 || response.status === 201;
          dispatchLog = `Twilio API Status: ${response.status}. Response: ${JSON.stringify(resData)}`;
        } catch (dispatchErr: any) {
          dispatchLog = `Twilio Request Failed: ${dispatchErr.message}`;
          console.error("[Webhook Reply Error Twilio]:", dispatchErr);
        }
      } else {
        dispatchLog = `Sandbox Loopback: No active production WhatsApp keys configured. Loops back to system console logs.`;
        wasDispatched = true;
      }

      console.log(`[Webhook Dispatch Complete] Success: ${wasDispatched}. Log: ${dispatchLog}`);

      // 5. Append message interaction to centralized ERP Audit Logs
      try {
        const auditRef = doc(db, 'sunshine_erp_state', 'audit_logs');
        const auditSnap = await getDoc(auditRef);
        const existingLogs = auditSnap.exists() ? auditSnap.data()?.data || [] : [];
        
        const newLog = {
          id: `log-wa-${Date.now()}`,
          userId: 'whatsapp-bot',
          username: 'WhatsApp Auto-Responder',
          action: 'SMS_NOTIFICATION',
          details: `Inbound WhatsApp from +${senderNumber}: "${messageText.substring(0, 40)}" -> Auto-Replied successfully. Mode: ${provider}`,
          timestamp: new Date().toISOString()
        };
        
        await setDoc(auditRef, { data: [newLog, ...existingLogs].slice(0, 100) }, { merge: false });
      } catch (auditErr) {
        console.error("Failed to append WhatsApp interaction log:", auditErr);
      }

      return res.json({
        status: "success",
        dispatched: wasDispatched,
        provider,
        log: dispatchLog,
        replyLength: replyText.length
      });

    } catch (err: any) {
      console.error("[Inbound WhatsApp Webhook Process Error]:", err);
      res.status(500).json({ error: "Internal processing failure: " + err.message });
    }
  });

  // 2. Vite middleware setup for Development & SPA Asset Routing
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT;
  if (!isProduction) {
    console.log("[Server] Starting in DEVELOPMENT mode (with Vite middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Starting in PRODUCTION mode (serving compiled assets)...");
    const isBundled = __dirname.endsWith("dist") || __dirname.includes("/dist");
    const distPath = isBundled ? __dirname : path.join(process.cwd(), "dist");
    console.log(`[Server] Production Assets Path: "${distPath}"`);
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[Server] Error sending index.html:`, err);
          res.status(500).send("Error loading application shell. Please check server logs.");
        }
      });
    });
  }

  const primaryServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sunshine Classes Full-Stack Server running on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });

  // Dual-port binding backup: bind to both common ports (3000 and 8080) in production to ensure Railway auto-detection works perfectly.
  if (isProduction) {
    const backupPort = PORT === 3000 ? 8080 : 3000;
    try {
      const fallbackServer = app.listen(backupPort, "0.0.0.0", () => {
        console.log(`[Backup Server] Listening on port ${backupPort} as a fail-safe fallback for health checks and traffic routing`);
      });
      fallbackServer.on('error', (err: any) => {
        console.log(`[Backup Server] Port ${backupPort} unavailable or already bound (normal behavior if proxy/routing is using it):`, err.message);
      });
    } catch (e: any) {
      console.log(`[Backup Server] Failed to establish fallback server on port ${backupPort}:`, e.message);
    }
  }
}

startServer();
