import { AppState, ChecklistAssessmentRecord, CapaRecord, UserRole, FormTemplateCustomizer, AnnualPlanDepartment, AuditScheduleItem, UserProfile } from '../types';
import { INITIAL_APP_STATE } from '../data/initialData';

const STORAGE_KEY = 'vet_superior_iqa_state_v1';
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('vet_superior_iqa_sync') : null;

type StateListener = (state: AppState) => void;
const listeners: Set<StateListener> = new Set();

let currentState: AppState = (() => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Could not read cached state from localStorage', e);
  }
  return INITIAL_APP_STATE;
})();

function notifyListeners(state: AppState) {
  currentState = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore quota errors
  }
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.error('Error notifying listener', err);
    }
  });
}

// Setup BroadcastChannel for multi-tab immediate sync
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'STATE_UPDATE' && event.data?.state) {
      notifyListeners(event.data.state);
    }
  };
}

// Setup Server-Sent Events (SSE) for centralized multi-user real-time sync
function initSSE() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

  try {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'STATE_UPDATE' && payload.state) {
          notifyListeners(payload.state);
        }
      } catch (err) {
        console.warn('Failed to parse SSE event data', err);
      }
    };

    eventSource.onerror = () => {
      // Reconnect handled automatically by EventSource
    };
  } catch (err) {
    console.warn('SSE not supported or failed to connect', err);
  }
}

// Auto init SSE
initSSE();

export const ApiService = {
  subscribe(listener: StateListener): () => void {
    listeners.add(listener);
    // Call immediately with current state
    listener(currentState);
    return () => {
      listeners.delete(listener);
    };
  },

  getCurrentState(): AppState {
    return currentState;
  },

  async fetchRemoteState(): Promise<AppState> {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        notifyListeners(data);
        return data;
      }
    } catch (err) {
      console.warn('Backend /api/state not reached, using local state', err);
    }
    return currentState;
  },

  async updateState(newState: AppState): Promise<void> {
    notifyListeners(newState);

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'STATE_UPDATE', state: newState });
    }

    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });
    } catch (err) {
      console.warn('Could not persist to server /api/state', err);
    }
  },

  async patchState(patch: Partial<AppState>): Promise<void> {
    const updated: AppState = {
      ...currentState,
      ...patch,
      lastUpdated: new Date().toISOString()
    };
    return this.updateState(updated);
  },

  async toggleAnnualPlan(departmentCode: string, month: number, type: 'plan' | 'actual'): Promise<void> {
    const newRows = currentState.annualPlanRows.map((row) => {
      if (row.departmentCode === departmentCode) {
        const currentMonthData = row.months[month] || { plan: false, actual: false };
        return {
          ...row,
          months: {
            ...row.months,
            [month]: {
              ...currentMonthData,
              [type]: !currentMonthData[type]
            }
          }
        };
      }
      return row;
    });

    return this.patchState({ annualPlanRows: newRows });
  },

  async updateAnnualPlanRow(departmentCode: string, updated: Partial<AnnualPlanDepartment>): Promise<void> {
    const newRows = currentState.annualPlanRows.map((row) => {
      if (row.departmentCode === departmentCode) {
        return { ...row, ...updated };
      }
      return row;
    });
    return this.patchState({ annualPlanRows: newRows });
  },

  async addAnnualPlanRow(newRow: AnnualPlanDepartment): Promise<void> {
    const existing = currentState.annualPlanRows.some((r) => r.departmentCode === newRow.departmentCode);
    if (existing) {
      return this.updateAnnualPlanRow(newRow.departmentCode, newRow);
    }
    return this.patchState({ annualPlanRows: [...currentState.annualPlanRows, newRow] });
  },

  async deleteAnnualPlanRow(departmentCode: string): Promise<void> {
    const newRows = currentState.annualPlanRows.filter((r) => r.departmentCode !== departmentCode);
    return this.patchState({ annualPlanRows: newRows });
  },

  async updateSchedule(scheduleId: string, updated: Partial<AuditScheduleItem>): Promise<void> {
    const updatedSchedules = currentState.schedules.map((sch) => {
      if (sch.id === scheduleId) {
        return { ...sch, ...updated };
      }
      return sch;
    });
    return this.patchState({ schedules: updatedSchedules });
  },

  async deleteSchedule(scheduleId: string): Promise<void> {
    const updatedSchedules = currentState.schedules.filter((s) => s.id !== scheduleId);
    return this.patchState({ schedules: updatedSchedules });
  },

  async loginUser(user: UserProfile): Promise<void> {
    const nowStr = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
    return this.patchState({
      currentUser: user,
      isAuthenticated: true,
      loginTimestamp: nowStr,
    });
  },

  async logoutUser(): Promise<void> {
    return this.patchState({
      isAuthenticated: false,
    });
  },

  async acknowledgeSchedule(scheduleId: string, roleType: 'lead' | 'auditee', userName: string): Promise<void> {
    const nowStr = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
    const updatedSchedules = currentState.schedules.map((sch) => {
      if (sch.id === scheduleId) {
        if (roleType === 'lead') {
          return {
            ...sch,
            leadAuditorAck: true,
            leadAuditorAckDate: nowStr
          };
        } else {
          return {
            ...sch,
            auditeeAck: true,
            auditeeAckDate: nowStr
          };
        }
      }
      return sch;
    });

    return this.patchState({ schedules: updatedSchedules });
  },

  async saveChecklistAssessment(record: ChecklistAssessmentRecord): Promise<void> {
    const existingIndex = currentState.checklistAssessments.findIndex((a) => a.id === record.id);
    let newAssessments = [...currentState.checklistAssessments];
    if (existingIndex >= 0) {
      newAssessments[existingIndex] = record;
    } else {
      newAssessments.push(record);
    }

    // Auto-generate CAPAs for any items marked NC_MAJOR, NC_MINOR, or OBS if not already linked
    let newCapas = [...currentState.capas];
    let capaCounter = newCapas.length + 1;

    const updatedItems = record.items.map((item) => {
      if (['NC_MAJOR', 'NC_MINOR', 'OBS'].includes(item.rating) && !item.linkedCapaId) {
        const isNC = item.rating === 'NC_MAJOR' || item.rating === 'NC_MINOR';
        const prefix = isNC ? 'CAR' : 'PAR';
        const capaId = `${prefix}-2569-${String(capaCounter++).padStart(3, '0')}`;

        const newCapa: CapaRecord = {
          id: capaId,
          type: isNC ? 'CAR' : 'PAR',
          severity: item.rating === 'NC_MAJOR' ? 'MAJOR' : item.rating === 'NC_MINOR' ? 'MINOR' : 'OBSERVATION',
          departmentCode: record.departmentCode,
          departmentName: currentState.departments.find(d => d.code === record.departmentCode)?.nameTh || record.departmentCode,
          sourceItemCode: item.itemCode,
          sourceClause: item.clause,
          findingDescription: item.findings || 'พบข้อบกพร่องจากการตรวจประเมินภายใน',
          causeCategory: 'Practice',
          sixM: 'Method',
          fiveWhy: {
            why1: '',
            why2: '',
            why3: '',
            why4: '',
            why5: '',
            rootCause: ''
          },
          containment: '',
          correctiveAction: '',
          assignedAuditee: record.auditeeName,
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], // 14 days later
          leadAuditor: record.auditorName,
          qmrName: 'คุณชวิน พาพิทักษ์',
          status: 'OPEN',
          createdAt: new Date().toISOString().split('T')[0]
        };

        newCapas.push(newCapa);
        return { ...item, linkedCapaId: capaId };
      }
      return item;
    });

    const finalRecord = { ...record, items: updatedItems, updatedAt: new Date().toISOString() };
    if (existingIndex >= 0) {
      newAssessments[existingIndex] = finalRecord;
    } else {
      newAssessments[newAssessments.length - 1] = finalRecord;
    }

    return this.patchState({
      checklistAssessments: newAssessments,
      capas: newCapas
    });
  },

  async saveCapa(capa: CapaRecord): Promise<void> {
    const existingIndex = currentState.capas.findIndex(c => c.id === capa.id);
    let updatedCapas = [...currentState.capas];
    if (existingIndex >= 0) {
      updatedCapas[existingIndex] = capa;
    } else {
      updatedCapas.unshift(capa);
    }
    return this.patchState({ capas: updatedCapas });
  },

  async updateUserRole(userId: string, newRole: UserRole, departmentCode?: string): Promise<void> {
    const updatedUsers = currentState.users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
          ...(departmentCode ? {
            departmentCode,
            departmentName: currentState.departments.find(d => d.code === departmentCode)?.nameTh || u.departmentName
          } : {})
        };
      }
      return u;
    });

    const currentUpdated = updatedUsers.find(u => u.id === currentState.currentUser.id) || currentState.currentUser;

    return this.patchState({
      users: updatedUsers,
      currentUser: currentUpdated
    });
  },

  async updateTemplateConfig(config: FormTemplateCustomizer): Promise<void> {
    return this.patchState({ templateConfig: config });
  },

  async resetToSeed(): Promise<void> {
    try {
      const res = await fetch('/api/state/reset', { method: 'POST' });
      if (res.ok) {
        const data = await fetch('/api/state');
        if (data.ok) {
          const fresh = await data.json();
          notifyListeners(fresh);
          return;
        }
      }
    } catch (e) {
      console.warn('Reset error, falling back to local initial state', e);
    }
    notifyListeners(INITIAL_APP_STATE);
  }
};
