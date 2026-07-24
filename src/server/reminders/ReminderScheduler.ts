import { collection, doc, getDoc, getDocs, setDoc } from '../shared/db';
import { ReminderService, DEFAULT_TEMPLATES } from './ReminderService';
import { AuditService } from '../shared/AuditService';
import { TimelineService } from '../shared/TimelineService';
import { EventPublisher } from '../shared/EventPublisher';
import { FeeReminder } from '../../types';
import { NotificationProviderFactory } from '../notifications/NotificationProvider';

export interface SchedulerStageRule {
  offsetDays: number; // diff = today - dueDate in days
  type: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'FINAL_NOTICE';
}

export const REMINDER_STAGE_RULES: SchedulerStageRule[] = [
  { offsetDays: -5, type: 'UPCOMING' },
  { offsetDays: -1, type: 'UPCOMING' },
  { offsetDays: 0, type: 'DUE_TODAY' },
  { offsetDays: 3, type: 'OVERDUE' },
  { offsetDays: 7, type: 'OVERDUE' },
  { offsetDays: 15, type: 'OVERDUE' },
  { offsetDays: 30, type: 'FINAL_NOTICE' }
];

export interface SchedulerRunResult {
  feesScanned: number;
  remindersGenerated: number;
  remindersSkipped: number;
  remindersCancelledForInactive: number;
  errors: string[];
}

export class ReminderScheduler {
  /**
   * Main idempotent scheduler runner.
   * Scans monthly_fees, matches stage rules, prevents duplicates, handles inactive students.
   */
  public static async run(db: any, systemUser = 'SYSTEM_SCHEDULER'): Promise<SchedulerRunResult> {
    console.log('[ReminderScheduler] Starting automated fee reminder scan...');
    const result: SchedulerRunResult = {
      feesScanned: 0,
      remindersGenerated: 0,
      remindersSkipped: 0,
      remindersCancelledForInactive: 0,
      errors: []
    };

    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const todayMs = new Date(todayStr).getTime();

      // 1. Fetch templates
      const templates = await ReminderService.getTemplates(db);

      // 2. Fetch existing reminders to build deduplication map
      const existingRemindersSnap = await getDocs(collection(db, 'fee_reminders'));
      const existingStageKeys = new Set<string>();
      for (const d of existingRemindersSnap.docs) {
        const r = d.data() as FeeReminder;
        if (r.stageKey) {
          existingStageKeys.add(r.stageKey);
        }
      }

      // 3. Fetch all students for status checks
      const studentsSnap = await getDocs(collection(db, 'students'));
      const studentsMap = new Map<string, any>();
      for (const d of studentsSnap.docs) {
        const s = d.data();
        studentsMap.set(s.id, s);
      }

      // 4. Fetch pending or partial monthly fees
      const monthlyFeesSnap = await getDocs(collection(db, 'monthly_fees'));
      const pendingFees = monthlyFeesSnap.docs
        .map((d: any) => d.data())
        .filter((f: any) => f.status === 'PENDING' || f.status === 'PARTIAL');

      result.feesScanned = pendingFees.length;

      for (const fee of pendingFees) {
        try {
          const student = studentsMap.get(fee.studentId);

          // Rule: If student is Inactive, Transferred, or Left Institute -> delete / cancel pending reminders and skip
          if (student) {
            const statusUpper = (student.status || '').toUpperCase();
            if (statusUpper === 'INACTIVE' || statusUpper === 'TRANSFERRED' || statusUpper === 'LEFT' || statusUpper === 'DROPOUT') {
              const cancelledCount = await ReminderService.cancelPendingRemindersForFee(db, fee.id, `STUDENT_STATUS_${statusUpper}`);
              result.remindersCancelledForInactive += cancelledCount;
              result.remindersSkipped++;
              continue;
            }
          }

          if (!fee.dueDate) continue;

          // Calculate offset in days: (today - dueDate)
          const dueMs = new Date(fee.dueDate).getTime();
          const diffDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24));

          // Find matching rule
          const matchingRule = REMINDER_STAGE_RULES.find(r => r.offsetDays === diffDays);
          if (!matchingRule) {
            result.remindersSkipped++;
            continue;
          }

          const stageKey = `${fee.id}_${matchingRule.type}_${matchingRule.offsetDays}`;

          // Idempotency check: Never send duplicate reminder for same stage!
          if (existingStageKeys.has(stageKey)) {
            result.remindersSkipped++;
            continue;
          }

          // Generate Reminder
          const reminderId = `REM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const nowIso = new Date().toISOString();
          
          const tpl = templates.find(t => t.templateType === matchingRule.type) || DEFAULT_TEMPLATES[0];
          const studentName = student ? student.name : fee.studentName;
          const rollNumber = student ? (student.rollNo || student.id) : (fee.rollNo || '');
          const className = student ? student.class : (fee.class || '');
          const amount = fee.pendingFee || fee.totalFee || 0;
          const billingMonth = fee.month || 'Current Month';
          
          let billingYear = String(new Date().getFullYear());
          if (fee.month) {
            const match = fee.month.match(/\d{4}/);
            if (match) billingYear = match[0];
          }

          const messageText = ReminderService.renderTemplate(tpl.templateText, {
            studentName,
            rollNumber,
            amount,
            dueDate: fee.dueDate,
            className,
            billingMonth
          });

          const reminderRecord: FeeReminder = {
            id: reminderId,
            reminderId,
            studentId: fee.studentId,
            studentName,
            rollNumber,
            className,
            feeRecordId: fee.id,
            billingMonth,
            billingYear,
            amount,
            dueDate: fee.dueDate,
            reminderType: matchingRule.type,
            channel: 'MANUAL',
            status: 'SENT',
            scheduledAt: nowIso,
            sentAt: nowIso,
            createdBy: systemUser,
            createdAt: nowIso,
            stageKey,
            message: messageText
          };

          await setDoc(doc(db, 'fee_reminders', reminderId), reminderRecord);
          existingStageKeys.add(stageKey);

          // Send via Notification Provider
          const provider = NotificationProviderFactory.getProvider('MANUAL');
          await provider.send(reminderRecord, messageText);

          // Audit & Events
          await AuditService.log(
            db,
            'SYSTEM',
            systemUser,
            'REMINDER_GENERATED',
            `Auto-generated ${matchingRule.type} reminder for student ${studentName} (${fee.studentId}), Fee: ${fee.id}`
          );

          await TimelineService.record(
            db,
            fee.studentId,
            'REMINDER_SENT',
            `Auto Fee Reminder (${matchingRule.type})`,
            `Scheduled notification generated for ${billingMonth} (Amount: ₹${amount}, Due: ${fee.dueDate})`,
            systemUser,
            'SYSTEM'
          );

          await EventPublisher.publish(db, 'ReminderCreated', reminderRecord);
          await EventPublisher.publish(db, 'ReminderSent', reminderRecord);

          result.remindersGenerated++;

        } catch (feeErr: any) {
          console.error(`[ReminderScheduler] Error processing fee ${fee.id}:`, feeErr);
          result.errors.push(`Fee ${fee.id}: ${feeErr.message}`);
        }
      }

      console.log('[ReminderScheduler] Scan complete:', result);
      return result;

    } catch (err: any) {
      console.error('[ReminderScheduler] Scheduler execution failed:', err);
      result.errors.push(`Global Scheduler Error: ${err.message}`);
      return result;
    }
  }
}
