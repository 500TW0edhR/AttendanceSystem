'use client';

import React, { useState, useEffect } from 'react';
import './attendance.css'; 
import StaffView from './StaffView';
import AdminView from './AdminView';
import { createClient } from '@/utils/supabase/client';

export default function AttendanceClient({ userEmail, userId }: { userEmail: string | undefined, userId: string }) {
  const [view, setView] = useState<'staff' | 'admin'>('staff');
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'pc'>('mobile');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = React.useMemo(() => createClient(), []);
  const todayStr = new Date().toISOString().split('T')[0];

  // No.0000の固定ID
  const DEMO_USER_ID = 'd0000000-0000-0000-0000-000000000000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // プロフィール取得
      const { data: pData } = await supabase.from('profiles').select('role, status, id, full_name, employee_id, branch, employment_type').eq('id', userId).single();
      if (pData) {
        if (pData.role) setRole(pData.role as 'user' | 'admin');
        if (pData.status === '招待中') {
          await supabase.from('profiles').update({ status: '在籍' }).eq('id', userId);
        }
      }

      // 管理者用の全データ取得
      const { data: allP } = await supabase.from('profiles').select('*').order('employee_id', { ascending: true });
      const { data: allA } = await supabase.from('attendances').select('*').eq('target_date', todayStr);
      
      if (allP) setProfiles(allP);
      if (allA) setAllData(allA);
      setLoading(false);
    };
    fetchData();
  }, [userId, supabase, todayStr]);

  const triggerToast = (msg: string, type: string = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    // エラー以外は3.5秒で消す、エラーは手動で閉じるまで残す
    if (type !== 'danger') {
      setTimeout(() => setShowToast(false), 3500);
    }
  };

  const getDeviceClass = () => {
    if (device === 'mobile') return 'mode-mobile';
    if (device === 'tablet') return 'mode-tablet';
    return 'mode-pc';
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', color: '#64748b', fontSize: '18px', fontWeight: 'bold' }}>データを読み込み中...</div>;
  }

  return (
    <div className="attendance-body">
      <div className="view-switcher" style={{ justifyContent: 'space-between', padding: '10px 20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className={view === 'staff' ? 'active' : ''} onClick={() => setView('staff')}>稼働者アプリ</button>
          {(role === 'admin' || isDemoMode) && (
            <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>管理者画面</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className={`demo-toggle ${isDemoMode ? 'active' : ''}`} onClick={() => {
            setIsDemoMode(!isDemoMode);
            triggerToast(isDemoMode ? "本番モードに切り替えました" : "プレゼン用デモモードを起動しました", 'info');
          }} style={{ 
            background: isDemoMode ? 'var(--primary)' : '#e2e8f0',
            padding: '4px 12px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            color: isDemoMode ? 'white' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.3s ease'
          }}>
            <span>{isDemoMode ? '🚀 デモON' : '🧪 デモOFF'}</span>
          </div>

          {view === 'staff' && (
            <div id="device-toggles" style={{ margin: 0 }}>
              <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}>📱</button>
              <button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')}>📟</button>
              <button className={device === 'pc' ? 'active' : ''} onClick={() => setDevice('pc')}>💻</button>
            </div>
          )}
        </div>
      </div>

      <div className={`toast-msg ${showToast ? 'show' : ''}`} style={{ 
        position: 'fixed',
        top: showToast ? '30px' : '-100px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        padding: '12px 24px',
        borderRadius: '30px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'white',
        background: toastType === 'danger' ? 'var(--danger)' : toastType === 'info' ? 'var(--primary)' : 'var(--success)',
        opacity: showToast ? 1 : 0,
        pointerEvents: 'none',
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}>
        {toastMsg}
      </div>

      {view === 'staff' ? (
        <div id="staff-view" className={`mobile-frame ${getDeviceClass()}`}>
          <StaffView 
            showToast={triggerToast} 
            userEmail={isDemoMode ? 'demo0@example.com' : userEmail} 
            userId={isDemoMode ? DEMO_USER_ID : userId} 
            supabase={supabase}
            isDemoMode={isDemoMode}
          />
        </div>
      ) : (
        <div id="admin-view" className="view-active">
          <AdminView 
            showToast={triggerToast} 
            supabase={supabase} 
            isDemoMode={isDemoMode}
            realAdminId={userId}
            profiles={profiles}
            allData={allData}
            todayDate={todayStr}
            demoShifts={{}}
          />
        </div>
      )}
    </div>
  );
}
