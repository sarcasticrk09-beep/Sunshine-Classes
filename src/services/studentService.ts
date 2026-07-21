import { doc, getDoc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student } from '../types';

export const studentService = {
  /**
   * Fetches all students as individual documents from the 'students' collection.
   */
  async fetchStudents(): Promise<Student[]> {
    const colRef = collection(db, 'students');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
  },

  /**
   * Adds or updates a single student document in the 'students' collection.
   */
  async addStudent(student: Student): Promise<void> {
    const docRef = doc(db, 'students', student.id);
    await setDoc(docRef, student, { merge: true });
  },

  /**
   * Updates an existing student's document properties.
   */
  async updateStudent(studentId: string, updates: Partial<Student>): Promise<void> {
    const docRef = doc(db, 'students', studentId);
    await setDoc(docRef, updates, { merge: true });
  },

  /**
   * Deletes a single student document from the 'students' collection.
   */
  async deleteStudent(studentId: string): Promise<void> {
    const docRef = doc(db, 'students', studentId);
    await deleteDoc(docRef);
  }
};
