import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Teacher } from '../types';

export const teacherService = {
  /**
   * Fetches the array of teachers from the synchronized Firestore document.
   */
  async fetchTeachers(): Promise<Teacher[]> {
    const docRef = doc(db, 'sunshine_erp_state', 'teachers');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().data || [] : [];
  },

  /**
   * Overwrites or updates the list of teachers in Firestore.
   */
  async saveTeachers(teachers: Teacher[]): Promise<void> {
    const docRef = doc(db, 'sunshine_erp_state', 'teachers');
    await setDoc(docRef, { data: teachers }, { merge: false });
  },

  /**
   * Adds a new teacher to the array.
   */
  async addTeacher(teacher: Teacher): Promise<void> {
    const teachers = await this.fetchTeachers();
    teachers.push(teacher);
    await this.saveTeachers(teachers);
  },

  /**
   * Updates an existing teacher profile in the array.
   */
  async updateTeacher(teacherId: string, updates: Partial<Teacher>): Promise<void> {
    const teachers = await this.fetchTeachers();
    const index = teachers.findIndex(t => t.id === teacherId);
    if (index !== -1) {
      teachers[index] = { ...teachers[index], ...updates };
      await this.saveTeachers(teachers);
    }
  },

  /**
   * Deletes a teacher from the array.
   */
  async deleteTeacher(teacherId: string): Promise<void> {
    const teachers = await this.fetchTeachers();
    const updated = teachers.filter(t => t.id !== teacherId);
    await this.saveTeachers(updated);
  }
};
