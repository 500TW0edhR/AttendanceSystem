'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// セクションコンポーネントのインポート
import AttendanceList from './admin/sections/AttendanceList';
import ApprovalWorkflow from './admin/sections/ApprovalWorkflow';
import ShiftManagement from './admin/sections/ShiftManagement';
import StaffMaster from './admin/sections/StaffMaster';
import ReportAnalysis from './admin/sections/ReportAnalysis';
import DataIntegration from './admin/sections/DataIntegration';
import NoticeManagement from './admin/sections/NoticeManagement';
import HelpGuide from './admin/sections/HelpGuide';

const PREFECTURES = ['東京', '大阪', '名古屋', '福岡', '横浜', '札幌', '仙台', '千葉', '埼玉', '広島'];

export default function AdminView({ profiles = [], allData = [], todayDate, isDemoMode, demoShifts = {}, showToast, realAdminId }: any) {
  const [activeSec, setActiveSec] = useState('sec-list');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const supabase = createClient();

  const [localDemoShifts, setLocalDemoShifts] = useState<any>(demoShifts || {});
  const [shiftPatterns, setShiftPatterns] = useState<any>({});

  useEffect(() => {
    setCurrentDate(new Date());
    fetchApplications();
    fetchShifts();
    setSelectedApp(null); 
    
    // リアルタイム購読の設定 (applicationsはAdminView内で自己完結)
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, (payload) => {
        console.log('Realtime INSERT/UPDATE: applications', payload);
        fetchApplications();
      })
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });

    // 初回またはデモ切り替え時のみ初期化
    if (Object.keys(localDemoShifts).length === 0 || isDemoMode) {
      setLocalDemoShifts(demoShifts || {});
    }
    
    // デモ用の初期パターン設定 (外国籍スタッフ)
    if (isDemoMode) {
      setShiftPatterns({
        'mock-f1': { 1: 'R', 3: 'R', 5: 'R', 0: 'O', 2: 'O', 4: 'O', 6: 'O' }, // 月水金：日勤
        'mock-f2': { 2: 'L', 4: 'L', 6: 'L', 0: 'O', 1: 'O', 3: 'O', 5: 'O' }  // 火木土：遅番
      });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDemoMode, currentDate?.getMonth(), supabase]);

  const fetchShifts = async () => {
    if (isDemoMode) return;
    const year = currentDate?.getFullYear() || new Date().getFullYear();
    const month = currentDate?.getMonth() || new Date().getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase.from('shifts').select('*').gte('target_date', firstDay).lte('target_date', lastDay);
    if (!error && data) {
      const shiftMap: any = {};
      data.forEach((s: any) => {
        const d = new Date(s.target_date);
        const key = `${s.user_id}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        shiftMap[key] = s.shift_type;
      });
      setLocalDemoShifts(shiftMap);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, profiles(full_name, employee_id, is_demo)')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const filtered = isDemoMode 
          ? data.filter((a: any) => a.profiles?.is_demo) 
          : data.filter((a: any) => !a.profiles?.is_demo);
        setApplications(filtered);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkUpdateShifts = async (updates: any) => {
    setLocalDemoShifts((prev: any) => ({ ...prev, ...updates }));
    
    if (!isDemoMode) {
      // DB一括更新
      const bulkData = Object.entries(updates).map(([key, type]) => {
        const [pId, y, m, d] = key.split('-');
        const targetDate = new Date(parseInt(y), parseInt(m), parseInt(d)).toISOString().split('T')[0];
        return { user_id: pId, target_date: targetDate, shift_type: type };
      });
      const { error } = await supabase.from('shifts').upsert(bulkData);
      if (error) {
        showToast("DB一括更新に失敗しました", "danger");
        return;
      }
    }
    showToast(`${Object.keys(updates).length}件のシフトを更新しました`, 'success');
  };

  const handleUpdateAppStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (!error) {
      showToast(status === 'approved' ? '申請を承認しました' : '申請を却下しました', 'success');
      fetchApplications();
      setSelectedApp(null);
    }
  };

  const handleUpdateShift = async (pId: string, day: number, type: string) => {
    const year = currentDate?.getFullYear() || new Date().getFullYear();
    const month = currentDate?.getMonth() || new Date().getMonth();
    const key = `${pId}-${year}-${month}-${day}`;
    
    // UIを即時更新
    setLocalDemoShifts((prev: any) => ({ ...prev, [key]: type }));

    if (!isDemoMode) {
      const targetDate = new Date(year, month, day).toISOString().split('T')[0];
      const { error } = await supabase.from('shifts').upsert({
        user_id: pId,
        target_date: targetDate,
        shift_type: type
      }, { onConflict: 'user_id,target_date' });

      if (error) {
        showToast("シフトの保存に失敗しました", "danger");
        return;
      }
    }

    showToast(`${day}日のシフトを ${type} に変更しました`, 'success');
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;
    const { error } = await supabase.from('profiles').update({ branch: selectedProfile.branch }).eq('id', selectedProfile.id);
    if (!error) {
      showToast('社員情報を更新しました', 'success');
      setIsModalOpen(false);
      window.location.reload();
    }
  };

  const renderSection = () => {
    // デモモード用の拡張プロフィールリストを作成
    // デモモード用の拡張プロフィールリストを作成
    let augmentedProfiles: any[] = [];
    
    if (isDemoMode) {
      // デモモード：デモ社員のみ（あなた自身の本名プロフは除外）
      const demoStaff = profiles.filter((p: any) => p.is_demo);
      augmentedProfiles = [...demoStaff];
      
      const today = new Date();
      const foreignStaff1 = {
        id: 'mock-f1',
        employee_id: 'E0015',
        full_name: 'グエン・ヴァン・ラム',
        branch: '東京',
        employment_type: 'アルバイト',
        is_demo: true,
        status: '在籍',
        visaExpiry: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      const foreignStaff2 = {
        id: 'mock-f2',
        employee_id: 'E0016',
        full_name: 'カルロス・シルバ',
        branch: '大阪',
        employment_type: '正社員',
        is_demo: true,
        status: '在籍',
        visaExpiry: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      augmentedProfiles.splice(6, 0, foreignStaff2);
      augmentedProfiles.splice(9, 0, foreignStaff1);
    } else {
      // 本番モード：本物の社員のみ
      augmentedProfiles = profiles.filter((p: any) => !p.is_demo);
    }

    switch (activeSec) {
      case 'sec-list':
        return (
          <AttendanceList 
            profiles={augmentedProfiles} 
            allData={allData} 
            todayDate={todayDate} 
            isDemoMode={isDemoMode} 
            currentDate={currentDate} 
            setSelectedProfile={setSelectedProfile} 
            setIsModalOpen={setIsModalOpen} 
          />
        );
      case 'sec-approval':
        return (
          <ApprovalWorkflow 
            isDemoMode={isDemoMode} 
            applications={applications} 
            selectedApp={selectedApp} 
            setSelectedApp={setSelectedApp} 
            handleUpdateAppStatus={handleUpdateAppStatus} 
          />
        );
      case 'sec-shift':
        return (
          <ShiftManagement 
            profiles={augmentedProfiles} 
            isDemoMode={isDemoMode} 
            currentDate={currentDate} 
            demoShifts={localDemoShifts}
            shiftPatterns={shiftPatterns}
            setShiftPatterns={setShiftPatterns}
            onBulkUpdateShifts={handleBulkUpdateShifts}
            realAdminId={realAdminId}
            onUpdateShift={handleUpdateShift}
            onDateChange={(newDate: Date) => setCurrentDate(newDate)}
          />
        );
      case 'sec-master':
        return <StaffMaster profiles={augmentedProfiles} isDemoMode={isDemoMode} supabase={supabase} showToast={showToast} />;
      case 'sec-report':
        return <ReportAnalysis isDemoMode={isDemoMode} />;
      case 'sec-data':
        return <DataIntegration showToast={showToast} />;
      case 'sec-notice':
        return <NoticeManagement isDemoMode={isDemoMode} showToast={showToast} />;
      case 'sec-help':
        return <HelpGuide />;
      default:
        return <section className="admin-section active"><h1>セクションが見つかりません: {activeSec}</h1></section>;
    }
  };

  return (
    <div className="admin-view">
      <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#1e293b', padding: '5px', borderRadius: '50px', display: 'flex', gap: '5px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>稼働者アプリ</button>
        <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '50px', cursor: 'pointer' }}>管理者画面</button>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '5px 5px' }}></div>
        <button style={{ background: isDemoMode ? '#10b981' : 'transparent', color: isDemoMode ? 'white' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {isDemoMode ? '🚀 デモON' : '🧪 デモOFF'}
        </button>
      </div>

      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: 'white', fontSize: '30px', padding: '30px 20px', fontWeight: '900', margin: 0 }}>Admin</h1>
        <nav id="admin-nav" style={{ padding: '0 10px', flex: 1 }}>
          <p className={activeSec === 'sec-list' ? 'active' : ''} onClick={() => setActiveSec('sec-list')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#10b981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📊</span>{isDemoMode ? 'デモ勤怠一覧' : '勤怠一覧管理'}</span></p>
          <p className={activeSec === 'sec-approval' ? 'active' : ''} onClick={() => setActiveSec('sec-approval')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ width: '26px', height: '26px', background: '#ef4444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📩</span>
                {isDemoMode ? 'デモ申請承認' : '申請承認'}
              </span>
              {(isDemoMode ? 3 : applications.filter(a => a.status === 'pending').length) > 0 && (
                <span style={{ background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '50px' }}>
                  {isDemoMode ? 3 : applications.filter(a => a.status === 'pending').length}
                </span>
              )}
            </span>
          </p>
          <p className={activeSec === 'sec-shift' ? 'active' : ''} onClick={() => setActiveSec('sec-shift')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📅</span>シフト管理</span></p>
          <p className={activeSec === 'sec-master' ? 'active' : ''} onClick={() => setActiveSec('sec-master')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#a855f7', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👥</span>社員マスタ</span></p>
          <p className={activeSec === 'sec-report' ? 'active' : ''} onClick={() => setActiveSec('sec-report')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📈</span>レポート分析</span></p>
          <p className={activeSec === 'sec-notice' ? 'active' : ''} onClick={() => setActiveSec('sec-notice')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#f59e0b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🔔</span>お知らせ管理</span></p>
          <p className={activeSec === 'sec-data' ? 'active' : ''} onClick={() => setActiveSec('sec-data')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#a855f7', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>💾</span>データ連携</span></p>
          <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <p className={activeSec === 'sec-help' ? 'active' : ''} onClick={() => setActiveSec('sec-help')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#10b981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📖</span>使い方ガイド</span></p>
          </div>
        </nav>
      </aside>
      <main className="admin-main">{renderSection()}</main>
      
      {isModalOpen && selectedProfile && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content card" style={{ width: '500px', padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '20px' }}>社員詳細: {selectedProfile.full_name}</h2>
            <div className="form-group">
              <label>拠点</label>
              <select 
                value={selectedProfile.branch} 
                onChange={e => setSelectedProfile({...selectedProfile, branch: e.target.value})}
              >
                {PREFECTURES.map((p: any) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn-rect" style={{ background: '#eee', color: '#333', height: '40px', minHeight: 'auto', width: 'auto', padding: '0 20px', borderRadius: '8px' }}>閉じる</button>
              <button onClick={handleUpdateProfile} className="btn-rect" style={{ background: '#2563eb', color: 'white', height: '40px', minHeight: 'auto', width: 'auto', padding: '0 20px', borderRadius: '8px' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
