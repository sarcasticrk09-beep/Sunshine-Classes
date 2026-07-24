import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { SyncService } from "./SyncService";

export { SyncService };

// ==========================================
// 1. Helper Functions
// ==========================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string | undefined): boolean {
  if (!email) return true;
  return emailRegex.test(email);
}

export function validatePhone(phone: string | undefined): boolean {
  if (!phone) return true;
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10;
}

export function toFirestoreTimestamp(dateInput?: string | Date | number): Timestamp {
  if (!dateInput) return Timestamp.now();
  if (dateInput instanceof Timestamp) return dateInput;
  if (dateInput instanceof Date) return Timestamp.fromDate(dateInput);
  if (typeof dateInput === 'number') return Timestamp.fromMillis(dateInput);
  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? Timestamp.now() : Timestamp.fromDate(parsed);
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function parseFeeMonth(monthInput: any, yearInput?: number) {
  const currentYear = yearInput || new Date().getFullYear();
  let monthNum = new Date().getMonth() + 1;
  let monthStr = MONTH_NAMES[monthNum - 1];

  if (typeof monthInput === "number" && monthInput >= 1 && monthInput <= 12) {
    monthNum = monthInput;
    monthStr = MONTH_NAMES[monthNum - 1];
  } else if (typeof monthInput === "string") {
    const trimmed = monthInput.trim();
    const parts = trimmed.split(/\s+/);
    const foundIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
    if (foundIdx !== -1) {
      monthNum = foundIdx + 1;
      monthStr = MONTH_NAMES[foundIdx];
    }
  }

  const padMonth = String(monthNum).padStart(2, '0');
  const billingPeriod = `${currentYear}-${padMonth}`;

  return {
    billingPeriod,
    month: monthNum,
    year: currentYear,
    monthDisplay: `${monthStr} ${currentYear}`
  };
}

// ==========================================
// 2. Auto-Increment Sequential Generators
// ==========================================

export async function generateNextSequence(field: "admission" | "receipt"): Promise<string> {
  const counterDocRef = doc(db, "settings", "counters");
  const year = new Date().getFullYear();

  return await SyncService.runTransactionBlock(async (transaction) => {
    const counterDoc = await transaction.get(counterDocRef);
    let nextVal = 100;

    if (counterDoc.exists()) {
      const data = counterDoc.data();
      const currentVal = data[field] || 100;
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
// 3. Unified Audit Log Service ('audit_logs')
// ==========================================

export const auditLogsService = {
  async fetchAll(limitCount: number = 100): Promise<any[]> {
    const items = await SyncService.list<any>("audit_logs");
    return items.sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime()).slice(0, limitCount);
  },

  async create(logData: any): Promise<string> {
    try {
      const logId = logData.id || logData.logId || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const payload = {
        logId,
        ...logData,
        createdAt: new Date().toISOString()
      };
      const res = await SyncService.set<any>("audit_logs", logId, payload);
      return res.data?.id || logId;
    } catch (error) {
      console.error("Failed to create audit log:", error);
      return "";
    }
  },

  async log(userId: string, username: string, action: string, details: string, targetId?: string): Promise<string> {
    try {
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const payload = {
        logId,
        userId: userId || "SYSTEM",
        performedBy: username || "system",
        username: username || "system",
        action,
        targetId: targetId || "SYSTEM",
        details,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      const res = await SyncService.set<any>("audit_logs", logId, payload);
      return res.data?.id || logId;
    } catch (error) {
      console.error("Failed to log system audit event:", error);
      return "";
    }
  }
};

// ==========================================
// 4. Normalized Collections Services
// ==========================================

// --- USERS ('users') ---
export const usersService = {
  async fetchUser(uid: string): Promise<any | null> {
    if (!uid) return null;
    return await SyncService.get<any>("users", uid);
  },

  async fetchAll(): Promise<any[]> {
    return await SyncService.list<any>("users");
  },

  async create(uid: string, data: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    if (!uid) throw new Error("User UID is required");
    if (data.email && !validateEmail(data.email)) throw new Error("Invalid email format");

    const payload = {
      userId: uid,
      ...data,
      active: data.active ?? true,
      status: data.status || "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await SyncService.set("users", uid, payload);

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

    const payload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await SyncService.update("users", uid, payload);

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
    await SyncService.delete("users", uid);

    await auditLogsService.log(
      operatorId || "SYSTEM",
      operatorUsername || "system",
      "User Deleted",
      `User with UID ${uid} was removed`
    );
  }
};

// --- STUDENTS ('students') ---
export const studentsService = {
  async fetchAll(): Promise<any[]> {
    const list = await SyncService.list<any>("students");
    return list.filter(s => s.status !== "DELETED");
  },

  async fetchById(id: string): Promise<any | null> {
    return await SyncService.get<any>("students", id);
  },

  async create(studentData: any, operatorId: string, operatorUsername: string): Promise<string> {
    if (!studentData.name) throw new Error("Student Name is required");
    if (studentData.email && !validateEmail(studentData.email)) throw new Error("Invalid email format");
    if (studentData.mobile && !validatePhone(studentData.mobile)) throw new Error("Invalid student mobile format");

    let admissionNo = studentData.admissionNumber || studentData.rollNumber || studentData.rollNo;
    if (!admissionNo) {
      admissionNo = await generateNextSequence("admission");
    }

    const payload = {
      studentId: studentData.id || `std-${Date.now()}`,
      rollNumber: studentData.rollNo || studentData.rollNumber || admissionNo,
      rollNo: studentData.rollNo || studentData.rollNumber || admissionNo,
      userId: studentData.userId || "",
      name: studentData.name,
      fatherName: studentData.fatherName || "",
      motherName: studentData.motherName || "",
      phone: studentData.mobile || studentData.phone || "",
      mobile: studentData.mobile || studentData.phone || "",
      alternatePhone: studentData.parentMobile || studentData.alternatePhone || "",
      parentMobile: studentData.parentMobile || studentData.alternatePhone || "",
      address: studentData.address || "",
      classId: studentData.classId || studentData.class || "class-1",
      class: studentData.class || studentData.classId || "Class 1",
      teacherId: studentData.teacherId || "",
      preferredBatch: studentData.preferredBatch || studentData.class || "Class 1",
      status: studentData.status || "ACTIVE",
      joiningDate: studentData.admissionDate || studentData.joiningDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const targetId = studentData.id || payload.studentId;
    const res = await SyncService.set<any>("students", targetId, payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Student Created",
      `Student ${studentData.name} enrolled with Roll No: ${payload.rollNumber}`,
      targetId
    );

    return res.data?.id || targetId;
  },

  async update(id: string, updates: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await SyncService.update("students", id, payload);

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Student Updated",
        `Student ID ${id} details updated`,
        id
      );
    }
  },

  async delete(id: string, operatorId?: string, operatorUsername?: string): Promise<void> {
    await SyncService.update("students", id, { 
      status: "DELETED",
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString() 
    });

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Student Deleted",
        `Student ID ${id} marked as soft-deleted`,
        id
      );
    }
  }
};

// --- TEACHERS ('teachers') ---
export const teachersService = {
  async fetchAll(): Promise<any[]> {
    return await SyncService.list<any>("teachers");
  },

  async fetchById(id: string): Promise<any | null> {
    return await SyncService.get<any>("teachers", id);
  },

  async create(teacherData: any, operatorId: string, operatorUsername: string): Promise<string> {
    if (!teacherData.name) throw new Error("Teacher Name is required");
    if (teacherData.email && !validateEmail(teacherData.email)) throw new Error("Invalid email format");

    const teacherId = teacherData.id || teacherData.teacherId || `tch-${Date.now()}`;
    const payload = {
      teacherId,
      userId: teacherData.userId || "",
      name: teacherData.name,
      phone: teacherData.phone || "",
      email: teacherData.email || "",
      qualification: teacherData.qualification || "",
      specialty: Array.isArray(teacherData.specialty) ? teacherData.specialty : (teacherData.specialty ? [teacherData.specialty] : []),
      assignedClasses: Array.isArray(teacherData.assignedClasses) ? teacherData.assignedClasses : (teacherData.batches || []),
      status: teacherData.status || "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await SyncService.set<any>("teachers", teacherId, payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Teacher Created",
      `Teacher ${teacherData.name} registered successfully`,
      teacherId
    );

    return res.data?.id || teacherId;
  },

  async update(id: string, updates: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await SyncService.update("teachers", id, payload);

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Teacher Updated",
        `Teacher ID ${id} updated`,
        id
      );
    }
  },

  async delete(id: string, operatorId?: string, operatorUsername?: string): Promise<void> {
    await SyncService.delete("teachers", id);

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Teacher Deleted",
        `Teacher ID ${id} deleted`,
        id
      );
    }
  }
};

// --- CLASSES ('classes') ---
export const classesService = {
  async fetchAll(): Promise<any[]> {
    const list = await SyncService.list<any>("classes");
    return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  },

  async fetchById(id: string): Promise<any | null> {
    return await SyncService.get<any>("classes", id);
  },

  async create(classData: any): Promise<string> {
    const classId = classData.id || classData.classId || `class-${Date.now()}`;
    const payload = {
      classId,
      className: classData.className || classData.name || "New Class",
      displayOrder: classData.displayOrder || 1,
      monthlyFee: classData.monthlyFee || 0,
      isActive: classData.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await SyncService.set<any>("classes", classId, payload);
    return res.data?.id || classId;
  },

  async update(id: string, updates: any): Promise<void> {
    await SyncService.update("classes", id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<void> {
    await SyncService.delete("classes", id);
  }
};

// --- ADMISSIONS ('admissions') ---
export const admissionsService = {
  async fetchAll(): Promise<any[]> {
    return await SyncService.list<any>("admissions");
  },

  async fetchById(id: string): Promise<any | null> {
    return await SyncService.get<any>("admissions", id);
  },

  async create(admissionData: any, operatorId: string, operatorUsername: string): Promise<string> {
    const admissionId = admissionData.id || admissionData.admissionId || `adm-${Date.now()}`;
    const payload = {
      admissionId,
      studentId: admissionData.studentId || "",
      admissionDate: admissionData.admissionDate || admissionData.date || new Date().toISOString().split('T')[0],
      session: admissionData.session || "2026-2027",
      discount: admissionData.discount || 0,
      remarks: admissionData.remarks || "",
      status: admissionData.status || "APPROVED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await SyncService.set<any>("admissions", admissionId, payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Admission Created",
      `Admission ${admissionId} registered for Student ID: ${admissionData.studentId}`,
      admissionId
    );

    return res.data?.id || admissionId;
  },

  async update(id: string, updates: any): Promise<void> {
    await SyncService.update("admissions", id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<void> {
    await SyncService.delete("admissions", id);
  }
};

// --- FEES ('fees') ---
export const feesService = {
  async fetchAll(): Promise<any[]> {
    return await SyncService.list<any>("fees");
  },

  async fetchById(id: string): Promise<any | null> {
    return await SyncService.get<any>("fees", id);
  },

  async create(feeData: any): Promise<string> {
    const feeId = feeData.id || feeData.feeId || `fee-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const parsed = parseFeeMonth(feeData.month || feeData.billingMonth, feeData.year || feeData.billingYear);

    const payload = {
      feeId,
      studentId: feeData.studentId || "",
      billingPeriod: parsed.billingPeriod,
      month: parsed.month,
      year: parsed.year,
      monthDisplay: parsed.monthDisplay,
      amount: feeData.amount || feeData.totalFee || 0,
      totalFee: feeData.totalFee || feeData.amount || 0,
      paidFee: feeData.paidFee || 0,
      pendingFee: feeData.pendingFee || (feeData.amount || feeData.totalFee || 0),
      dueDate: feeData.dueDate || "",
      status: feeData.status || "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await SyncService.set<any>("fees", feeId, payload);
    return res.data?.id || feeId;
  },

  async update(id: string, updates: any): Promise<void> {
    await SyncService.update("fees", id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<void> {
    await SyncService.delete("fees", id);
  }
};

// --- PAYMENTS ('payments') ---
export const paymentsService = {
  async fetchAll(): Promise<any[]> {
    return await SyncService.list<any>("payments");
  },

  async fetchById(id: string): Promise<any | null> {
    return await SyncService.get<any>("payments", id);
  },

  async collectPayment(paymentData: any, operatorId: string, operatorUsername: string): Promise<string> {
    const receiptNo = paymentData.receiptNumber || await generateNextSequence("receipt");
    const paymentId = paymentData.id || paymentData.paymentId || `pay-${Date.now()}`;

    const payload = {
      paymentId,
      studentId: paymentData.studentId || "",
      feeId: paymentData.feeId || "",
      amountPaid: paymentData.amountPaid || paymentData.amount || 0,
      paymentMode: paymentData.paymentMode || paymentData.paymentMethod || "CASH",
      transactionId: paymentData.transactionId || "",
      receiptNumber: receiptNo,
      receivedBy: paymentData.receivedBy || operatorUsername || "system",
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      remarks: paymentData.remarks || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await SyncService.set<any>("payments", paymentId, payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Fee Collected",
      `Payment collected: ₹${payload.amountPaid} via ${payload.paymentMode}. Receipt No: ${receiptNo}`,
      paymentId
    );

    return res.data?.id || paymentId;
  },

  async delete(id: string): Promise<void> {
    await SyncService.delete("payments", id);
  }
};

// --- ATTENDANCE ('attendance') ---
export const attendanceService = {
  async fetchAll(): Promise<any[]> {
    return await SyncService.list<any>("attendance");
  },

  async fetchById(id: string): Promise<any | null> {
    return await SyncService.get<any>("attendance", id);
  },

  async saveAttendance(attendanceData: any, operatorId: string, operatorUsername: string): Promise<string> {
    const attendanceId = attendanceData.id || attendanceData.attendanceId || `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const payload = {
      attendanceId,
      studentId: attendanceData.studentId || "",
      teacherId: attendanceData.teacherId || operatorId || "",
      date: attendanceData.date || new Date().toISOString().split('T')[0],
      status: attendanceData.status || "PRESENT",
      remarks: attendanceData.remarks || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await SyncService.set<any>("attendance", attendanceId, payload);

    await auditLogsService.log(
      operatorId,
      operatorUsername,
      "Attendance Marked",
      `Attendance marked '${payload.status}' for student ${payload.studentId} on ${payload.date}`,
      attendanceId
    );

    return res.data?.id || attendanceId;
  },

  async update(id: string, updates: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    await SyncService.update("attendance", id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Attendance Updated",
        `Attendance record ID ${id} updated`,
        id
      );
    }
  },

  async delete(id: string): Promise<void> {
    await SyncService.delete("attendance", id);
  }
};

// --- NOTIFICATIONS ('notifications') ---
export const notificationsService = {
  async fetchAll(): Promise<any[]> {
    return await SyncService.list<any>("notifications");
  },

  async create(notificationData: any, operatorId?: string, operatorUsername?: string): Promise<string> {
    const notificationId = notificationData.id || notificationData.notificationId || `notif-${Date.now()}`;
    const payload = {
      notificationId,
      type: notificationData.type || "WhatsApp",
      recipient: notificationData.recipient || "",
      status: notificationData.status || "SENT",
      sentBy: notificationData.sentBy || operatorUsername || "system",
      sentAt: notificationData.sentAt || new Date().toISOString(),
      title: notificationData.title || "",
      content: notificationData.content || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await SyncService.set<any>("notifications", notificationId, payload);

    if (operatorId && operatorUsername) {
      await auditLogsService.log(
        operatorId,
        operatorUsername,
        "Notification Logged",
        `Notification sent via ${payload.type} to ${payload.recipient}`,
        notificationId
      );
    }

    return res.data?.id || notificationId;
  },

  async delete(id: string): Promise<void> {
    await SyncService.delete("notifications", id);
  }
};

// --- SETTINGS ('settings') ---
export const settingsService = {
  async fetchSettings(configId: string = "institute"): Promise<any | null> {
    return await SyncService.get<any>("settings", configId);
  },

  async updateSettings(configId: string = "institute", configData: any, operatorId?: string, operatorUsername?: string): Promise<void> {
    await SyncService.set("settings", configId, {
      ...configData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await auditLogsService.log(
      operatorId || "SYSTEM",
      operatorUsername || "system",
      "Settings Updated",
      `Institute settings parameter '${configId}' updated`
    );
  }
};

// ==========================================
// 5. Backward Compatibility Services Aliases
// ==========================================

export const receptionService = {
  async fetchAll(): Promise<any[]> { return await SyncService.list<any>("users"); },
  async create(data: any): Promise<string> {
    const id = data.id || `rec-${Date.now()}`;
    await SyncService.set("users", id, { ...data, role: "RECEPTIONIST" });
    return id;
  },
  async update(id: string, updates: any): Promise<void> { await SyncService.update("users", id, updates); },
  async delete(id: string): Promise<void> { await SyncService.delete("users", id); }
};

export const adminsService = {
  async fetchAll(): Promise<any[]> { return await SyncService.list<any>("users"); },
  async create(data: any): Promise<string> {
    const id = data.id || `adm-${Date.now()}`;
    await SyncService.set("users", id, { ...data, role: "ADMIN" });
    return id;
  },
  async update(id: string, updates: any): Promise<void> { await SyncService.update("users", id, updates); },
  async delete(id: string): Promise<void> { await SyncService.delete("users", id); }
};

export const batchesService = classesService;
export const subjectsService = classesService;
export const examsService = {
  async fetchAll(): Promise<any[]> { return []; },
  async create(data: any): Promise<string> { return `exam-${Date.now()}`; }
};
export const resultsService = {
  async fetchAll(): Promise<any[]> { return []; },
  async saveResult(data: any): Promise<string> { return `res-${Date.now()}`; }
};
export const homeworkService = {
  async fetchAll(): Promise<any[]> { return []; },
  async create(data: any): Promise<string> { return `hw-${Date.now()}`; }
};
export const studyMaterialsService = {
  async fetchAll(): Promise<any[]> { return []; },
  async create(data: any): Promise<string> { return `mat-${Date.now()}`; }
};
export const noticesService = notificationsService;
export const enquiriesService = admissionsService;
