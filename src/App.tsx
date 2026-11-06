/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AnnualPlanView } from './components/AnnualPlanView';
import { AuditScheduleView } from './components/AuditScheduleView';
import { ChecklistView } from './components/ChecklistView';
import { IqaReportView } from './components/IqaReportView';
import { CapaWorkflowView } from './components/CapaWorkflowView';
import { QuestionBankView } from './components/QuestionBankView';
import { StandardsDatabaseView } from './components/StandardsDatabaseView';
import { AuditTeamView } from './components/AuditTeamView';
import { AdminCustomizerView } from './components/AdminCustomizerView';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { PrintModal } from './components/PrintModal';
import { ApiService } from './services/api';
import { AppState, AuditScheduleItem, CapaRecord, UserProfile } from './types';
import { INITIAL_APP_STATE } from './data/initialData';
import { ShieldCheck, LogIn, CheckCircle, Users, Shield, ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_APP_STATE);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printDocType, setPrintDocType] = useState<
    'FM-QM-013' | 'FM-QM-018' | 'FM-QM-014' | 'FM-QM-021' | 'CAR-PAR'
  >('FM-QM-013');
  const [printChecklistId, setPrintChecklistId] = useState<string | undefined>();
  const [printCapaId, setPrintCapaId] = useState<string | undefined>();
  const [activeScheduleForChecklist, setActiveScheduleForChecklist] = useState<AuditScheduleItem | null>(null);
  const [activeCapaForWorkflow, setActiveCapaForWorkflow] = useState<CapaRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Subscribe to real-time central updates
  useEffect(() => {
    const unsubscribe = ApiService.subscribe((updatedState) => {
      setState(updatedState);
    });

    // Initial fetch from backend
    ApiService.fetchRemoteState();

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync dark class on document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleRefreshSync = async () => {
    setIsSyncing(true);
    await ApiService.fetchRemoteState();
    setTimeout(() => setIsSyncing(false), 500);
  };

  const handleSelectUser = async (user: UserProfile) => {
    await ApiService.loginUser(user);
  };

  const handleLogout = async () => {
    await ApiService.logoutUser();
  };

  const handleStartChecklist = (schedule: AuditScheduleItem) => {
    setActiveScheduleForChecklist(schedule);
    setActiveTab('checklist');
  };

  const handleOpenCapaDetail = (capa: CapaRecord) => {
    setActiveCapaForWorkflow(capa);
    setActiveTab('capa');
  };

  const handleOpenPrint = (
    type: 'FM-QM-013' | 'FM-QM-018' | 'FM-QM-014' | 'FM-QM-021' | 'CAR-PAR',
    checklistId?: string,
    capaId?: string
  ) => {
    setPrintDocType(type);
    setPrintChecklistId(checklistId);
    setPrintCapaId(capaId);
    setIsPrintModalOpen(true);
  };

  const pendingScheduleAcks = state.schedules.filter(
    (s) => !s.leadAuditorAck || !s.auditeeAck
  ).length;

  const openCapasCount = state.capas.filter((c) => c.status !== 'CLOSED').length;
  const unreadNotifsCount = state.notifications.filter((n) => !n.read).length;

  // Key Quick Personnel for Quick Login
  const keyQuickUsers = [
    { title: 'ผู้ดูแลระบบ (Admin)', user: state.users.find(u => u.role === 'ADMIN') || state.users[0] },
    { title: 'ตัวแทนฝ่ายบริหาร (QMR)', user: state.users.find(u => u.role === 'QMR') || state.users[21] },
    { title: 'ผู้จัดการ QA (Lead Auditor)', user: state.users.find(u => u.id === 'usr-21') || state.users[20] },
    { title: 'หัวหน้างานผลิต (Line 1)', user: state.users.find(u => u.id === 'usr-09') || state.users[9] },
    { title: 'หัวหน้าคลังวัตถุดิบ (WH)', user: state.users.find(u => u.id === 'usr-29') || state.users[28] },
    { title: 'เจ้าหน้าที่ควบคุมเอกสาร (DC)', user: state.users.find(u => u.id === 'usr-02') || state.users[2] },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Sarabun'] antialiased">
      {/* If logged out, show Login Gate */}
      {!state.isAuthenticated ? (
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 bg-radial from-slate-900 via-slate-950 to-black text-white overflow-y-auto">
          <div className="max-w-xl w-full my-auto space-y-6 text-center">
            {/* Brand Logo & Plant Name */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 shadow-xl shadow-indigo-950/60 ring-2 ring-indigo-500/30">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
                <span>โรงงาน : สมุทรสาคร</span>
                <span>•</span>
                <span>ระบบบริหารคุณภาพภายใน (IQA System)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                บริษัท เวท ซุปพีเรีย คอนซัลแตนท์ จำกัด
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Vet Superior Consultant Co., Ltd. (Samut Sakhon Plant)
              </p>
            </div>

            {/* Standards Badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                ISO 9001:2015
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                GHPs & HACCP กรมปศุสัตว์
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-indigo-300">
                FAMI-QS Code of Practice V.6
              </span>
            </div>

            {/* Primary Login Card */}
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 text-left">
              <div className="text-center pb-2 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">
                  เข้าสู่ระบบเพื่อเริ่มการตรวจประเมินหรือจัดการเอกสาร
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  เลือกบัญชีผู้ปฏิบัติงานที่ได้รับการแต่งตั้ง หรือเข้าสู่ระบบด้วย Google Account
                </p>
              </div>

              {/* Big Google Login Button */}
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>เข้าสู่ระบบด้วย Google Account (เลือกจาก 29 พนักงาน)</span>
              </button>

              {/* Quick Login Options */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  หรือเลือกเข้าสู่ระบบด่วนตามตำแหน่ง (Quick Selection):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {keyQuickUsers.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectUser(item.user)}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="text-[10px] text-indigo-400 font-bold">{item.title}</div>
                        <div className="text-xs font-semibold text-white truncate">{item.user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{item.user.email}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Read Only / Guest Option */}
              <div className="pt-2 text-center border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSelectUser(state.users[0])}
                  className="text-xs text-slate-400 hover:text-white transition-colors underline"
                >
                  เข้าชมแดชบอร์ดในโหมดผู้สังเกตการณ์ (View Only / Guest)
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              ระบบเชื่อมโยงคลังคำถาม Binder 1, แผน FM-QM-013, FM-QM-018, FM-QM-014, FM-QM-021 และ CAR/PAR แบบเรียลไทม์
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 10. Sidebar Navigation (Side Menu) */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            currentUser={state.currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            unreadNotificationCount={unreadNotifsCount}
            openCapaCount={openCapasCount}
            pendingScheduleAckCount={pendingScheduleAcks}
          />

          {/* Main View Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Header */}
            <Header
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              currentUser={state.currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
              onOpenPrint={(type) => handleOpenPrint(type)}
              state={state}
              onRefreshSync={handleRefreshSync}
              isSyncing={isSyncing}
            />

            {/* Content Viewport */}
            <main className="flex-1 overflow-y-auto">
              {activeTab === 'dashboard' && (
                <DashboardView
                  state={state}
                  onSelectTab={setActiveTab}
                  onStartChecklist={handleStartChecklist}
                  onOpenCapaDetail={handleOpenCapaDetail}
                />
              )}

              {activeTab === 'annual-plan' && (
                <AnnualPlanView
                  state={state}
                  onOpenPrint={() => handleOpenPrint('FM-QM-013')}
                />
              )}

              {activeTab === 'schedule' && (
                <AuditScheduleView
                  state={state}
                  currentUser={state.currentUser}
                  onOpenPrint={() => handleOpenPrint('FM-QM-018')}
                  onStartChecklist={handleStartChecklist}
                />
              )}

              {activeTab === 'checklist' && (
                <ChecklistView
                  state={state}
                  currentUser={state.currentUser}
                  initialSchedule={activeScheduleForChecklist}
                  onOpenPrint={(id) => handleOpenPrint('FM-QM-014', id)}
                  onNavigateToCapa={(capaId) => {
                    const target = state.capas.find((c) => c.id === capaId);
                    if (target) handleOpenCapaDetail(target);
                  }}
                />
              )}

              {activeTab === 'iqa-report' && (
                <IqaReportView
                  state={state}
                  onOpenPrint={() => handleOpenPrint('FM-QM-021')}
                  onOpenCapaDetail={handleOpenCapaDetail}
                />
              )}

              {activeTab === 'capa' && (
                <CapaWorkflowView
                  state={state}
                  currentUser={state.currentUser}
                  selectedCapaId={activeCapaForWorkflow?.id}
                  onOpenPrint={(capaId) => handleOpenPrint('CAR-PAR', undefined, capaId)}
                />
              )}

              {activeTab === 'question-bank' && (
                <QuestionBankView state={state} />
              )}

              {activeTab === 'standards' && (
                <StandardsDatabaseView state={state} />
              )}

              {activeTab === 'audit-team' && (
                <AuditTeamView
                  state={state}
                  currentUser={state.currentUser}
                  onSwitchUser={handleSelectUser}
                />
              )}

              {activeTab === 'admin' && (
                <AdminCustomizerView
                  state={state}
                  currentUser={state.currentUser}
                />
              )}
            </main>
          </div>
        </>
      )}

      {/* Google Login & User Switcher Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        users={state.users}
        currentUser={state.currentUser}
        onSelectUser={handleSelectUser}
      />

      {/* Print Document Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentType={printDocType}
        state={state}
        activeChecklistId={printChecklistId}
        activeCapaId={printCapaId}
      />
    </div>
  );
}
