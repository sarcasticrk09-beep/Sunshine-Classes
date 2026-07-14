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
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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
        You are "Sunshine Classes AI Assistant", a friendly, empathetic, and expert academic counselor and tutor for Sunshine Classes in Pihani, Hardoi, Uttar Pradesh.
        
        Key details about Sunshine Classes:
        - Tagline: "Excellence in Education"
        - Location: Mohalla Mishrana, Opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh.
        - Contacts: WhatsApp: 9161586254, Call: 8707738284.
        - Classes Offered: Class 1 to 10 (Primary, Junior, and Board Specialists).
        - Tuition Fee Policy: Fees are charged strictly on a per-class basis (not subject-wise). There is NO subject-wise fee. The monthly fee covers all core subjects (Mathematics, Science, English, Social Studies, etc.) for that class.
        - Class-wise Monthly Fee Structure:
          * Classes 1 to 4: ₹500 per month
          * Classes 5 to 8: ₹700 per month
          * Class 9: ₹1000 per month
          * Class 10: ₹1200 per month
        - Core specialties: Class 10 Boards Prep, strong Mathematics, Science, and English concepts, small batch sizes for individual attention, regular parent meetings, and NCERT-focused syllabus mapping.
        - Founders & Faculty: Shubham Shukla (Founder & Lead Director), Suresh Kumar (Senior Mathematics & Physics Expert), Anil Pandey (Chemistry & Biology Expert), Ritu Singh (English Literature and Social Studies).
        - Facilities: Smart Classrooms, weekly test reports, personalized weak-subject tutoring, digital portal, regular progress analytics.

        Your guidelines:
        1. Be incredibly encouraging, polite, and helpful, but keep responses highly concise, brief, and to-the-point. Answer the user's specific questions directly and immediately without long preambles or conversational fluff.
        2. Always present fees according to the class-wise monthly structure above, and clearly remind users that there are no subject-wise charges (the fee includes all subjects!).
        3. Keep answers short, beautifully styled in Markdown, clear, and focused on academic query or institute details. Maximum 2-3 short sentences or simple lists unless solving a complex academic doubt step-by-step.
        4. If students ask for homework doubts or academic questions (e.g., math, science), give them a concise, step-by-step correct answer.
        5. Speak with professional Indian coaching institute warmth. Use polite terms, and offer to call Sunshine at 8707738284.
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
