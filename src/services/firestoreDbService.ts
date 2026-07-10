import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  runTransaction,
  serverTimestamp,
  orderBy,
  limit,
  DocumentReference
} from "firebase/firestore";
import { db } from "../lib/firebase";

// ==========================================
// 1. Validation Helpers
// ==========================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string | undefined): boolean {
  if (!email) return true; // Optional
  return emailRegex.test(email);
}

export function validatePhone(phone: string | undefined): boolean {
  if (!phone) return true; // Optional
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10;
}

// ==========================================
// 2. Auto-Increment Sequential Generators
// ==========================================

/**
 * Generates sequential admission or receipt numbers using a transaction.
 * Ensures strict concurrency safety and prevents duplicate numbers.
 */
export async function generateNextSequence(field: "admission" | "receipt"): Promise<string> {
  const counterDocRef = doc(db, "settings", "counters");
  const year = new Date().getFullYear();

  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterDocRef);
    let nextVal = 1;

    if (counterDoc.exists()) {
      const data = counterDoc.data();
      const currentVal = data[field] || 0;
      nextVal = currentVal + 1;
      transaction.update(counterDocRef, { [field]: nextVal });
    } else {
      transaction.set(counterDocRef, { [field]: nextVal });
    }

    if (field === "admission") {
      return `ADM-${year}-${String(nextVal).padStart(4, "0")}`;
    } else {
      return `REC-${year}-${String(nextVal).padStart(4, "0")}`;
    }
  });
}

// ==========================================
// 3. Unified Audit Log Service
// ==========================================

export const auditLogsService = {
  async fetchAll(limitCount: number = 100): Promise<any[]> {
    const colRef = collection(db, "auditLogs");
    const q = query(colRef, orderBy("timestamp", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async log(userId: string, username: string, action: string, details: string): Promise<string> {
    try {
      const colRef = collection(db, "auditLogs");
      const docRef = await addDoc(colRef, {
        userId: userId || "SYSTEM",
        username: username || "system",
        action,
        details,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Failed to log system audit event:", error);
      return "";
    }
  }
};

// ==========================================
// 4. Individual Collection Services
// ==========================================

// --- USERS ---
export const usersService = {
  async fetchUser(uid: string): Promise<any | null> {
    if (!uid) return null;
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "users");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async create(uid: string, data: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    if (!uid) throw new Error("User UID is required");
    if (data.email && !validateEmail(data.email)) throw new Error("Invalid email format");
    
    const docRef = doc(db, "users", uid);
    const payload = {
      ...data,
      active: data.active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload);
    
    await auditLogsService.log(
      operatorId || uid,
      operatorUsername || data.username || "system",
      "User Created",
      `User ${data.username || uid} has been provisioned with role: ${data.role || "unknown"}`
    );
  },

  async update(uid: string, updates: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    if (!uid) throw new Error("User UID is required");
    if (updates.email && !validateEmail(updates.email)) throw new Error("Invalid email format");

    const docRef = doc(db, "users", uid);
    const payload = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, payload);

    if (updates.role) {
      await auditLogsService.log(
        operatorId || "SYSTEM",
        operatorUsername || "system",
        "Role Changes",
        `User ${uid} role modified to ${updates.role}`
      );
    }
  },

  async delete(uid: string, operatorId?: string, operatorUsername?: string): Promise<void> {
    if (!uid) throw new Error("User UID is required");
    const docRef = doc(db, "users", uid);
    await deleteDoc(docRef);

    await auditLogsService.log(
      operatorId || "SYSTEM",
      operatorUsername || "system",
      "User Deleted",
      `User with UID ${uid} was removed`
    );
  }
};

// --- STUDENTS ---
export const studentsService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "students");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "students", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(studentData: any, operatorId: string, operatorUsername: string): Promise<string> {
    if (!studentData.name) throw new Error("Student Name is required");
    if (studentData.email && !validateEmail(studentData.email)) throw new Error("Invalid email format");
    if (studentData.mobile && !validatePhone(studentData.mobile)) throw new Error("Invalid student mobile format");

    // Sequential Admission Number Generation
    let admissionNo = studentData.admissionNumber;
    if (!admissionNo) {
      admissionNo = await generateNextSequence("admission");
    } else {
      // Uniqueness validation check
      const colRef = collection(db, "students");
      const q = query(colRef, where("admissionNumber", "==", admissionNo));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        throw new Error(`Admission number ${admissionNo} already exists in database.`);
      }
    }

    const payload = {
      ...studentData,
      admissionNumber: admissionNo,
      active: studentData.active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "students"), payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Student Creation",
      `Student ${studentData.name} enrolled with Admission No: ${admissionNo}`
    );

    return docRef.id;
  },

  async update(id: string, updates: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    const docRef = doc(db, "students", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Student Updated",
        `Student ID ${id} details updated`
      );
    }
  },

  async delete(id: string, operatorId?: string, operatorUsername?: string): Promise<void> {
    const docRef = doc(db, "students", id);
    await deleteDoc(docRef);

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Student Deleted",
        `Student ID ${id} removed from records`
      );
    }
  }
};

// --- TEACHERS ---
export const teachersService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "teachers");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "teachers", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(teacherData: any, operatorId: string, operatorUsername: string): Promise<string> {
    if (!teacherData.name) throw new Error("Teacher Name is required");
    if (teacherData.email && !validateEmail(teacherData.email)) throw new Error("Invalid email format");

    const payload = {
      ...teacherData,
      active: teacherData.active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "teachers"), payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Teacher Creation",
      `Teacher ${teacherData.name} registered successfully`
    );

    return docRef.id;
  },

  async update(id: string, updates: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    const docRef = doc(db, "teachers", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Teacher Updated",
        `Teacher ID ${id} updated`
      );
    }
  },

  async delete(id: string, operatorId?: string, operatorUsername?: string): Promise<void> {
    const docRef = doc(db, "teachers", id);
    await deleteDoc(docRef);

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Teacher Deleted",
        `Teacher ID ${id} deleted`
      );
    }
  }
};

// --- RECEPTION ---
export const receptionService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "reception");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "reception", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(data: any): Promise<string> {
    const docRef = await addDoc(collection(db, "reception"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "reception", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "reception", id));
  }
};

// --- ADMINS ---
export const adminsService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "admins");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "admins", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(data: any): Promise<string> {
    const docRef = await addDoc(collection(db, "admins"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "admins", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "admins", id));
  }
};

// --- CLASSES ---
export const classesService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "classes");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "classes", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(classData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "classes"), {
      ...classData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "classes", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "classes", id));
  }
};

// --- BATCHES ---
export const batchesService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "batches");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "batches", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(batchData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "batches"), {
      ...batchData,
      active: batchData.active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "batches", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "batches", id));
  }
};

// --- SUBJECTS ---
export const subjectsService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "subjects");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "subjects", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(subjectData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "subjects"), {
      ...subjectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "subjects", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "subjects", id));
  }
};

// --- ATTENDANCE ---
export const attendanceService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "attendance");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "attendance", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async saveAttendance(attendanceData: any, operatorId: string, operatorUsername: string): Promise<string> {
    const payload = {
      ...attendanceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "attendance"), payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Attendance Update",
      `Attendance updated on ${attendanceData.date || "unknown date"} for student/class: ${attendanceData.class || ""}`
    );

    return docRef.id;
  },

  async update(id: string, updates: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    const docRef = doc(db, "attendance", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Attendance Update",
        `Attendance record ID ${id} details updated`
      );
    }
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "attendance", id));
  }
};

// --- FEES ---
export const feesService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "fees");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "fees", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(feeData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "fees"), {
      ...feeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "fees", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "fees", id));
  }
};

// --- PAYMENTS ---
export const paymentsService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "payments");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "payments", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async collectPayment(paymentData: any, operatorId: string, operatorUsername: string): Promise<string> {
    const receiptNo = await generateNextSequence("receipt");

    const payload = {
      ...paymentData,
      receiptNumber: receiptNo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "payments"), payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Fee Collection",
      `Fee/Payment Collected: ₹${paymentData.amount || 0} with Receipt No: ${receiptNo}`
    );

    return docRef.id;
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "payments", id));
  }
};

// --- EXAMS ---
export const examsService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "exams");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "exams", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(examData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "exams"), {
      ...examData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "exams", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "exams", id));
  }
};

// --- RESULTS ---
export const resultsService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "results");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "results", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async saveResult(resultData: any, operatorId: string, operatorUsername: string): Promise<string> {
    const payload = {
      ...resultData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "results"), payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Result Update",
      `Exam Results saved/updated for subject: ${resultData.subject || ""}`
    );

    return docRef.id;
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "results", id));
  }
};

// --- HOMEWORK ---
export const homeworkService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "homework");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "homework", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(homeworkData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "homework"), {
      ...homeworkData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "homework", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "homework", id));
  }
};

// --- STUDY MATERIALS ---
export const studyMaterialsService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "studyMaterials");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "studyMaterials", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(materialData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "studyMaterials"), {
      ...materialData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "studyMaterials", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "studyMaterials", id));
  }
};

// --- NOTICES ---
export const noticesService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "notices");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "notices", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(noticeData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "notices"), {
      ...noticeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "notices", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "notices", id));
  }
};

// --- ENQUIRIES ---
export const enquiriesService = {
  async fetchAll(): Promise<any[]> {
    const colRef = collection(db, "enquiries");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchById(id: string): Promise<any | null> {
    const docRef = doc(db, "enquiries", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(enquiryData: any): Promise<string> {
    const docRef = await addDoc(collection(db, "enquiries"), {
      ...enquiryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async update(id: string, updates: any): Promise<void> {
    const docRef = doc(db, "enquiries", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "enquiries", id));
  }
};

// --- SETTINGS ---
export const settingsService = {
  async fetchSettings(configId: string = "system_config"): Promise<any | null> {
    const docRef = doc(db, "settings", configId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  async updateSettings(configId: string = "system_config", configData: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    const docRef = doc(db, "settings", configId);
    await setDoc(docRef, {
      ...configData,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await auditLogsService.log(
      operatorId || "SYSTEM",
      operatorUsername || "system",
      "Settings Changes",
      `System configuration settings with ID '${configId}' updated`
    );
  }
};
