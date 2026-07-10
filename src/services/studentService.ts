import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student } from '../types';

export const studentService = {
  /**
   * Fetches the array of students from the synchronized Firestore document.
   */
  async fetchStudents(): Promise<Student[]> {
    const docRef = doc(db, 'sunshine_erp_state', 'students');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().data || [] : [];
  },

  /**
   * Overwrites or updates the list of students in Firestore.
   */
  async saveStudents(students: Student[]): Promise<void> {
    const docRef = doc(db, 'sunshine_erp_state', 'students');
    await setDoc(docRef, { data: students }, { merge: false });
  },

  /**
   * Adds a new student to the array.
   */
  async addStudent(student: Student): Promise<void> {
    const students = await this.fetchStudents();
    students.push(student);
    await this.saveStudents(students);
  },

  /**
   * Updates an existing student's properties in the array.
   */
  async updateStudent(studentId: string, updates: Partial<Student>): Promise<void> {
    const students = await this.fetchStudents();
    const index = students.findIndex(s => s.id === studentId);
    if (index !== -1) {
      students[index] = { ...students[index], ...updates };
      await this.saveStudents(students);
    }
  },

  /**
   * Deletes a student from the array.
   */
  async deleteStudent(studentId: string): Promise<void> {
    const students = await this.fetchStudents();
    const updated = students.filter(s => s.id !== studentId);
    await this.saveStudents(updated);
  }
};
