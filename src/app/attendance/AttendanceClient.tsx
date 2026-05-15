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
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const supabase = React.useMemo(() => createClient(), []);
  
  // 常に日本時間の今日の日付 (YYYY-MM-DD) を取得
  const todayStr = React.useMemo(() => {
    return new Intl.DateTimeFormat('ja-JP', { 
      timeZone: 'Asia/Tokyo', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(new Date()).replace(/\//g, '-');
  }, []);

  // No.0000の固定ID
  const DEMO_USER_ID = 'd0000000-0000-0000-0000-000000000000';

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      // プロフィール取得
      const { data: pData } = await supabase.from('profiles').select('role, status, id, full_name, employee_id, branch, employment_type').eq('id', userId).single();
      if (pData && isMounted) {
        if (pData.role) setRole(pData.role as 'user' | 'admin');
        if (pData.status === '招待中') {
          await supabase.from('profiles').update({ status: '在籍' }).eq('id', userId);
        }
      }

      // 管理者用の全データとシステム設定の取得
      const { data: allP } = await supabase.from('profiles').select('*').order('employee_id', { ascending: true });
      const { data: allA } = await supabase.from('attendances').select('*').eq('target_date', todayStr);
      const { data: setD } = await supabase.from('settings').select('company_name').eq('id', 'system').maybeSingle();
      
      if (isMounted) {
        if (allP) {
          setProfiles(allP);
          // 管理者が1人もいない場合：初期セットアップが必要
          const hasAdmin = allP.some((p: any) => p.role === 'admin');
          setNeedsSetup(!hasAdmin);
        }
        if (allA) setAllData(allA);
        if (setD && setD.company_name) setCompanyName(setD.company_name);
        setLoading(false);
      }
    };
    
    // データの取得をデバウンス（連続呼び出しを抑制）
    let fetchTimeout: NodeJS.Timeout | null = null;
    const debouncedFetchData = () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        fetchData();
      }, 500); // 0.5秒以内に次の変更があれば待機
    };
    
    fetchData();

    // 管理者画面用のリアルタイム更新（強制リロード回避用）
    const channel = supabase
      .channel('client_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances' }, () => {
        debouncedFetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        debouncedFetchData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (fetchTimeout) clearTimeout(fetchTimeout);
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, todayStr]);

  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string, type: string = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    
    const duration = type === 'danger' ? 10000 : 3500;
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
      toastTimerRef.current = null;
    }, duration);
  };

  const getDeviceClass = () => {
    if (device === 'mobile') return 'mode-mobile';
    if (device === 'tablet') return 'mode-tablet';
    return 'mode-pc';
  };

  const updateCompanyName = async (newName: string) => {
    const { error } = await supabase.from('settings').update({ company_name: newName }).eq('id', 'system');
    if (!error) {
      setCompanyName(newName);
      triggerToast("会社名を保存しました！", "success");
    } else {
      triggerToast("保存に失敗しました", "danger");
      console.error(error);
    }
  };

  // 初期セットアップ処理
  const handleSetupAdmin = async () => {
    setIsSettingUp(true);
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    if (!error) {
      setRole('admin');
      setNeedsSetup(false);
      setView('admin');
      triggerToast('初期管理者として登録されました！管理画面へようこそ。', 'success');
    } else {
      triggerToast('セットアップに失敗しました。もう一度お試しください。', 'danger');
      console.error(error);
    }
    setIsSettingUp(false);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', color: '#64748b', fontSize: '18px', fontWeight: 'bold' }}>データを読み込み中...</div>;
  }

  // 初期セットアップ画面（管理者が1人もいない場合）
  if (needsSetup) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
        <div style={{ width: '550px', background: 'white', borderRadius: '32px', padding: '60px 50px', textAlign: 'center', boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚀</div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', marginBottom: '15px' }}>初期セットアップ</h1>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.8', marginBottom: '35px' }}>
            このシステムにはまだ管理者が登録されていません。<br />
            あなたが<strong>最初の管理者</strong>として登録されます。<br />
            管理者は後から社員マスタで追加・変更できます。
          </p>
          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', marginBottom: '35px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>ログイン中のアカウント</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{userEmail}</div>
          </div>
          <button
            onClick={handleSetupAdmin}
            disabled={isSettingUp}
            style={{
              width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
              background: isSettingUp ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white', fontWeight: '900', fontSize: '18px', cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)', transition: 'all 0.3s'
            }}
          >
            {isSettingUp ? 'セットアップ中...' : '管理者として開始する'}
          </button>
          <p style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>※ この操作は1回のみです。以降はこの画面は表示されません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-body">
      <div className="view-switcher" style={{ justifyContent: 'space-between', padding: '10px 20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className={view === 'staff' ? 'active' : ''} onClick={() => setView('staff')}>稼働者アプリ</button>
          {(role === 'admin' || isDemoMode || needsSetup) && (
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
            companyName={companyName}
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
            setAllData={setAllData}
            todayDate={todayStr}
            demoShifts={{}}
            companyName={companyName}
            updateCompanyName={updateCompanyName}
          />
        </div>
      )}
    </div>
  );
}
