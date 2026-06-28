/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, BookOpen, Users, UserCheck, RefreshCw, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

interface QuickDemoPanelProps {
  onSelectRole: (role: UserRole) => void;
  currentRole: UserRole | null;
  onLogout: () => void;
}

export default function QuickDemoPanel({ onSelectRole, currentRole, onLogout }: QuickDemoPanelProps) {
  const roles = [
    { name: 'Admin', role: 'ADMIN' as UserRole, icon: Shield, desc: 'ERP Control, revenue reports & batch configurations', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    { name: 'Teacher', role: 'TEACHER' as UserRole, icon: BookOpen, desc: 'Submit marks, homework & student attendance status', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { name: 'Reception', role: 'RECEPTIONIST' as UserRole, icon: Users, desc: 'Manage admissions, record fee payments & generate receipts', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { name: 'Student', role: 'STUDENT' as UserRole, icon: UserCheck, desc: 'View grades, attendance charts, homework & digital ID card', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  ];

  return (
    <div id="quick-demo-panel" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-brand-orange animate-pulse" />
          <h3 className="font-display font-bold text-sm text-slate-800">1-Click ERP Role Demo Controller</h3>
        </div>
        {currentRole && (
          <button
            id="btn-demo-reset"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <RefreshCw size={12} /> Reset to Public Website
          </button>
        )}
      </div>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        Sunshine Classes has a unified database state inside this browser. Switch roles to see how actions immediately synchronize: e.g. record fees as receptionist, see it in admin revenue and student receipts instantly!
      </p>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {roles.map((item) => {
          const Icon = item.icon;
          const isActive = currentRole === item.role;
          return (
            <motion.button
              key={item.role}
              id={`btn-demo-role-${item.role.toLowerCase()}`}
              onClick={() => onSelectRole(item.role)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
                isActive
                  ? 'border-brand-blue bg-blue-50/70 ring-2 ring-brand-blue/30 shadow-md'
                  : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${item.color}`}>
                  <Icon size={12} /> {item.name}
                </span>
                {isActive && (
                  <span className="flex h-2 w-2 rounded-full bg-brand-blue"></span>
                )}
              </div>
              <p className="text-[11px] leading-snug text-slate-500">{item.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
