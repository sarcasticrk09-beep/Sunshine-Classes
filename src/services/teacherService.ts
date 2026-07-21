import { doc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Teacher } from '../types';

export const teacherService = {
  /**
   * Fetches all teachers as individual documents from the 'teachers' collection.
   */
  async fetchTeachers(): Promise<Teacher[]> {
    const colRef = collection(db, 'teachers');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
  },

  /**
   * Adds or updates a single teacher document in the 'teachers' collection.
   */
  async addTeacher(teacher: Teacher): Promise<void> {
    const docRef = doc(db, 'teachers', teacher.id);
    await setDoc(docRef, teacher, { merge: true });
  },

  /**
   * Updates an existing teacher profile document.
   */
  async updateTeacher(teacherId: string, updates: Partial<Teacher>): Promise<void> {
    const docRef = doc(db, 'teachers', teacherId);
    await setDoc(docRef, updates, { merge: true });
  },

  /**
   * Deletes a single teacher document from the 'teachers' collection.
   */
  async deleteTeacher(teacherId: string): Promise<void> {
    const docRef = doc(db, 'teachers', teacherId);
    await deleteDoc(docRef);
  }
};
