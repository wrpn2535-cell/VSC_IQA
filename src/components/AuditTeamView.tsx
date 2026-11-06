import React, { useState } from 'react';
import { Users, Search, Mail, Building2, Shield, UserCheck, CheckCircle2, Award } from 'lucide-react';
import { AppState, UserProfile, UserRole } from '../types';

interface AuditTeamViewProps {
  state: AppState;
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
}

export const AuditTeamView: React.FC<AuditTeamViewProps> = ({
  state,
  currentUser,
  onSwitchUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const filteredUsers = state.users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleCount = (role: UserRole) => state.users.filter((u) => u.role === role).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              Qualified Auditor Pool
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              รายชื่อบุคลากรที่ผ่านการรับรองและได้รับมอบหมาย (29 บัญชี)
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            ทำเนียบทีมผู้ตรวจประเมินคุณภาพภายใน (Audit Team Directory)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            บริษัท เวท ซุปพีเรีย คอนซัลแตนท์ จำกัด (โรงงาน: สมุทรสาคร)
          </p>
        </div>
      </div>

      {/* Role Counts Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div
          onClick={() => setFilterRole('ALL')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filterRole === 'ALL'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="text-slate-500">บุคลากรทั้งหมด</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {state.users.length} ท่าน
          </div>
        </div>

        <div
          onClick={() => setFilterRole('AUDITOR')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filterRole === 'AUDITOR'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="text-slate-500">Auditor</div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {roleCount('AUDITOR')} ท่าน
          </div>
        </div>

        <div
          onClick={() => setFilterRole('AUDITEE')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filterRole === 'AUDITEE'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="text-slate-500">Auditee</div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
            {roleCount('AUDITEE')} ท่าน
          </div>
        </div>

        <div
          onClick={() => setFilterRole('TECHNICAL_EXPERT')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filterRole === 'TECHNICAL_EXPERT'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="text-slate-500">Technical Expert</div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
            {roleCount('TECHNICAL_EXPERT')} ท่าน
          </div>
        </div>

        <div
          onClick={() => setFilterRole('QMR')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filterRole === 'QMR'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="text-slate-500">ตัวแทน QMR</div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {roleCount('QMR')} ท่าน
          </div>
        </div>

        <div
          onClick={() => setFilterRole('ADMIN')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filterRole === 'ADMIN'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="text-slate-500">System Admin</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {roleCount('ADMIN')} ท่าน
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ตรวจ, แผนก, ตำแหน่ง, หรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredUsers.map((u) => {
          const isCurrent = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-2xs transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                      {u.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {u.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {u.title}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                      u.role === 'ADMIN'
                        ? 'bg-slate-900 text-white dark:bg-slate-700'
                        : u.role === 'QMR'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : u.role === 'AUDITOR'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : u.role === 'TECHNICAL_EXPERT'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{u.departmentName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] truncate">{u.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    กำลังใช้งานบัญชีนี้
                  </span>
                ) : (
                  <button
                    onClick={() => onSwitchUser(u)}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    สลับใช้งานบัญชีนี้ →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
