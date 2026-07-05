import { GoogleGenAI } from "@google/genai";

// Local expert responsive chatbot rule engine
function getLocalAssistantResponse(input: string): string {
  const query = input.toLowerCase();
  
  if (query.includes("admission") || query.includes("enroll") || query.includes("join") || query.includes("fees") || query.includes("fee")) {
    return `**Sunshine Classes Admissions 2026-27 are now OPEN!** ☀️
    
We offer premium coaching for **Classes 1 to 10** with special high-focus batches for **Class 10 Board Examinations**.

**Fee Structure (Affordable Monthly Basis):**
- Classes 1-5 (Junior Sunshine): ₹600/month
- Classes 6-7 (Standard Path): ₹800/month
- Class 8 (Apex Batch): ₹1000/month
- Class 9 (Foundation): ₹1200/month
- Class 10 (Board Specialists): ₹1500/month

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

    // Initialize the official @google/genai GoogleGenAI SDK
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
      You are "Sunshine Classes AI Assistant", a friendly, empathetic, and expert academic counselor and tutor for Sunshine Classes in Pihani, Hardoi, Uttar Pradesh.
      
      Key details about Sunshine Classes:
      - Tagline: "Excellence in Education"
      - Location: Mohalla Mishrana, Opposite Subhash Park, Pihani, Hardoi, Uttar Pradesh.
      - Contacts: WhatsApp: 9161586254, Call: 8707738284.
      - Classes Offered: Class 1 to 10 (Primary, Junior, and Board Specialists).
      - Core specialties: Class 10 Boards Prep, strong Mathematics, Science, and English concepts, small batch sizes for individual attention, regular parent meetings, and NCERT-focused syllabus mapping.
      - Founders & Faculty: Shubham Shukla (Founder & Lead Director), Suresh Kumar (Senior Mathematics & Physics Expert), Anil Pandey (Chemistry & Biology Expert), Ritu Singh (English Literature and Social Studies).
      - Facilities: Smart Classrooms, weekly test reports, personalized weak-subject tutoring, digital portal, regular progress analytics.

      Your guidelines:
      1. Be incredibly encouraging, polite, and helpful.
      2. Keep answers relatively short, beautifully styled in Markdown, clear, and focused on academics or institute details.
      3. If students ask for homework doubts, explain the mathematical or scientific concept conceptually instead of just giving a direct direct solution.
      4. If parents ask, explain about batches, affordable fee structures, and weekly reports.
      5. Speak with professional Indian coaching institute warmth. Use polite terms, and offer to book a "Free Demo Class" or call Sunshine at 8707738284.
    `;

    // Generate content using gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
