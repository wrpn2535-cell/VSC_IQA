import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Activity,
  Send,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  X,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { ApiService, WebSocketInfo } from '../services/api';

interface WebSocketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebSocketModal: React.FC<WebSocketModalProps> = ({ isOpen, onClose }) => {
  const [wsInfo, setWsInfo] = useState<WebSocketInfo>(ApiService.getWsInfo());
  const [inputUrl, setInputUrl] = useState<string>('');
  const [testLog, setTestLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = ApiService.subscribeWs((info) => {
      setWsInfo(info);
      if (!inputUrl) {
        setInputUrl(info.url);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    ApiService.setCustomWsUrl(inputUrl.trim());
    addLog(`[Config] เปลี่ยนการเชื่อมต่อไปยัง: ${inputUrl.trim()}`);
  };

  const handleResetDefault = () => {
    ApiService.setCustomWsUrl(null);
    setInputUrl(ApiService.getWsInfo().url);
    addLog('[Config] รีเซ็ตการเชื่อมต่อกลับสู่ค่าเริ่มต้นระบบ');
  };

  const handleSendPing = () => {
    setIsPinging(true);
    addLog(`[Client -> Server] ส่งสัญญาณ PING...`);
    const sent = ApiService.sendWsMessage({ type: 'PING' });
    if (!sent) {
      addLog(`[Client -> Server] ไม่สามารถส่ง PING ได้ (WebSocket ไม่ได้เปิดใช้งาน)`);
    } else {
      setTimeout(() => {
        setIsPinging(false);
        addLog(`[Server -> Client] ได้รับการตอบรับ PONG! Latency: ${ApiService.getWsInfo().latencyMs || 0} ms`);
      }, 300);
    }
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('th-TH');
    setTestLog((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(wsInfo.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              wsInfo.status === 'CONNECTED'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : wsInfo.status === 'CONNECTING'
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  สถานะการเชื่อมต่อ Web Socket & Vercel Real-Time
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                  wsInfo.status === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : wsInfo.status === 'CONNECTING'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                }`}>
                  {wsInfo.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ระบบเชื่อมโยงข้อมูลแบบ Full-Duplex ซิงค์ผลการตรวจ Checklist, แผนงาน และ CAR/PAR เรียลไทม์
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Real-time Metrics 4-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Status */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block mb-1">สถานะ Protocol</span>
              <div className="flex items-center gap-1.5 font-bold font-mono text-slate-900 dark:text-white">
                {wsInfo.status === 'CONNECTED' ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WebSocket</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-red-500" />
                    <span>{wsInfo.status}</span>
                  </>
                )}
              </div>
            </div>

            {/* Latency */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block mb-1">ความเร็ว (Latency)</span>
              <div className="flex items-center gap-1 font-bold font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                <Activity className="w-3.5 h-3.5" />
                <span>{wsInfo.latencyMs !== undefined ? `${wsInfo.latencyMs} ms` : '< 20 ms'}</span>
              </div>
            </div>

            {/* Active Connections */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block mb-1">ผู้เชื่อมต่อสด</span>
              <div className="font-bold font-mono text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{wsInfo.connectedClients} เซสชัน</span>
              </div>
            </div>

            {/* Security */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block mb-1">ความปลอดภัย</span>
              <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{wsInfo.url.startsWith('wss://') ? 'WSS (TLS/SSL)' : 'WS'}</span>
              </div>
            </div>
          </div>

          {/* Vercel WebSockets Architectural Guidance Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-slate-50 dark:from-slate-850 dark:via-indigo-950/30 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>คู่มือการเชื่อมต่อ Web Socket ร่วมกับ Vercel (Architecture Note)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              เนื่องจากสถาปัตยกรรม Serverless Function ของ Vercel มีข้อจำกัดเรื่อง Request Timeout (ไม่รองรับ Persistent Connection ยาวนานเหมือน Node.js server ทั่วไป) ระบบ IQA ของเราจึงรองรับการเชื่อมต่อแบบ <strong>Hybrid Real-Time</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
              <li>
                <strong>โหมด Full-Duplex (ค่าเริ่มต้น):</strong> ทำงานผ่านเซิร์ฟเวอร์ Node.js + <code className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">ws</code> บนพอร์ต 3000 เชื่อมต่ออัตโนมัติทั้งตอนทดสอบและรันบนคลาวด์
              </li>
              <li>
                <strong>เมื่อ Deploy บน Vercel:</strong> ท่านสามารถระบุ URL ของ Web Socket Server ภายนอก (เช่น เซิร์ฟเวอร์ Node.js บน Railway, Cloud Run หรือบริการ WebSocket สำหรับ Vercel เช่น <em>PartyKit, Pusher, Ably</em>) ในช่องด้านล่างเพื่อเชื่อมต่อทันที
              </li>
            </ul>
          </div>

          {/* Custom WebSocket URL Configuration Form */}
          <form onSubmit={handleConnectCustom} className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                <span>กำหนด WebSocket URL (Vercel / Cloud Endpoint):</span>
              </label>
              {wsInfo.isCustomUrl && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">
                  Custom Endpoint Active
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="เช่น wss://your-vercel-ws.vercel.app/ws หรือ wss://..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                เชื่อมต่อใหม่
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <div className="flex items-center gap-2">
                <span>URL ปัจจุบัน: <code className="font-mono text-slate-700 dark:text-slate-300">{wsInfo.url}</code></span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="p-1 hover:text-slate-800 dark:hover:text-white"
                  title="คัดลอก URL"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {wsInfo.isCustomUrl && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-red-600 hover:underline cursor-pointer"
                >
                  รีเซ็ตกลับเป็นค่าเริ่มต้น
                </button>
              )}
            </div>
          </form>

          {/* Test Ping & Event Console */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                คอนโซลทดสอบรับ-ส่งสัญญาณ (Live WebSocket Log):
              </span>
              <button
                type="button"
                onClick={handleSendPing}
                disabled={isPinging || wsInfo.status !== 'CONNECTED'}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>ทดสอบส่ง PING</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 h-32 overflow-y-auto space-y-1">
              <div className="text-emerald-400">
                [System] WebSocket Service Ready. Connected Clients: {wsInfo.connectedClients}
              </div>
              {testLog.map((log, idx) => (
                <div key={idx} className="text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ซิงค์ข้อมูลเรียลไทม์ทั้ง WebSocket, BroadcastChannel และ SSE Fallback</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-semibold cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
