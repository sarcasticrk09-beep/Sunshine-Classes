import { teachersService } from './firestoreDbService';
import { Teacher } from '../types';

/**
 * Unified Teacher Service - Delegates to firestoreDbService as single repository source
 */
export const teacherService = {
  async fetchTeachers(): Promise<Teacher[]> {
    return (await teachersService.fetchAll()) as Teacher[];
  },

  async addTeacher(teacher: Teacher): Promise<void> {
    await teachersService.update(teacher.id, teacher, 'SYSTEM', 'system');
  },

  async updateTeacher(teacherId: string, updates: Partial<Teacher>): Promise<void> {
    await teachersService.update(teacherId, updates, 'SYSTEM', 'system');
  },

  async deleteTeacher(teacherId: string): Promise<void> {
    await teachersService.delete(teacherId, 'SYSTEM', 'system');
  }
};
