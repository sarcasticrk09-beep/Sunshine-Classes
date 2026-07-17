import { GoogleGenAI } from "@google/genai";

// Local expert responsive chatbot rule engine
function getLocalAssistantResponse(input: string): string {
  const query = input.toLowerCase();
  
  if (query.includes("admission") || query.includes("enroll") || query.includes("join") || query.includes("fees") || query.includes("fee")) {
    return `**Admissions for Sunshine Classes are now OPEN!** ☀️
    
We offer premium coaching for **Classes 1 to 10** with special high-focus batches for **Class 10 Board Examinations**.

*Please note: Fees are charged strictly on an affordable class-wise monthly basis. There are no subject-wise fees. The monthly fee covers all core subjects (Mathematics, Science, English, Social Studies, etc.).*

**Affordable Monthly Class-wise Fee Structure:**
- **Classes 1-4:** ₹500/month
- **Classes 5-8:** ₹700/month
- **Class 9 (Foundation):** ₹1000/month
- **Class 10 (Board Specialists):** ₹1200/month

To enroll or schedule a **Free Demo Class**, you can fill out our **Admission Form** directly in the menu above, or call us directly at **8707738284** / WhatsApp **9161586254**!`;
  }

  if (query.includes("where") || query.includes("address") || query.includes("location") || query.includes("pihani") || query.includes("hardoi")) {
    return `📍 **Our Location:**
Sunshine Classes is centrally located at:
**Mohalla Mishrana, Opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh (Pin: 241406)**

We are located opposite the beautiful Subhash Park, which is a very safe and easily accessible locality for students. Feel free to visit our reception desk between **10:00 AM to 07:00 PM**!`;
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

  return `Hello! Welcome to **Sunshine Classes, Pihani** — *Excellence in Education* ☀️

I am your digital Academic Assistant. I can help you with:
1. **Admissions & Fees** details for Classes 1 to 10
2. **Batches & Timings**
3. **Subjects & Board Preparation Tips**
4. **Our Office Location & Direct Contacts**

How can I help you towards your academic success today? Feel free to ask!`;
}

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not configured or using default placeholder. Falling back to local educational chatbot agent.");
      const responseText = getLocalAssistantResponse(message || "");
      return res.status(200).json({ response: responseText, isMock: true });
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
      - Keep responses concise, helpful, and beautifully styled in Markdown.
      - Use simple, direct language and avoid complex technical jargon.
      - Be polite, friendly, and encouraging. Never argue with visitors.
      - Reply in the same language used by the visitor (English and Hindi supported naturally).

      ==================================================
      ESCALATION PROTOCOL
      ==================================================
      If the user requests: Admission approval, Fee changes, Certificate issuance, Attendance correction, Password reset, Complaint resolution, Teacher assignment, or Official verification, you MUST reply:
      "This request requires assistance from our administration team. Please contact Sunshine Classes directly."
    `;

    // Generate content using gemini-3.5-flash for Q&A tasks
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}\n\nUser message: ${message}` }] }
      ],
    });

    return res.status(200).json({
      response: response.text || "I am here to guide you to academic success. How can I help you today?"
    });
  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    const fallbackResponse = getLocalAssistantResponse(req.body?.message || "");
    return res.status(200).json({
      response: `${fallbackResponse}\n\n*(Note: System operating in local offline mode due to API initialization timeout)*`,
      isMock: true
    });
  }
}
