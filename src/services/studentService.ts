import { studentsService } from './firestoreDbService';
import { Student } from '../types';

/**
 * Unified Student Service - Delegates to firestoreDbService as single repository source
 */
export const studentService = {
  async fetchStudents(): Promise<Student[]> {
    return (await studentsService.fetchAll()) as Student[];
  },

  async addStudent(student: Student): Promise<void> {
    await studentsService.update(student.id, student, 'SYSTEM', 'system');
  },

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<void> {
    await studentsService.update(studentId, updates, 'SYSTEM', 'system');
  },

  async deleteStudent(studentId: string): Promise<void> {
    await studentsService.delete(studentId, 'SYSTEM', 'system');
  }
};
