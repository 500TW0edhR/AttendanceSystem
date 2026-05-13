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

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export default function AdminView({ profiles = [], allData = [], todayDate, isDemoMode, demoShifts = {}, showToast, realAdminId, companyName, updateCompanyName }: any) {
  const [activeSec, setActiveSec] = useState('sec-list');
  const [settingName, setSettingName] = useState(companyName || '');
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
    setSettingName(companyName || '');
    setCurrentDate(new Date());
    fetchApplications();
    fetchShifts();
    setSelectedApp(null); 
    
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchApplications();
      })
      .subscribe();

    if (Object.keys(localDemoShifts).length === 0 || isDemoMode) {
      setLocalDemoShifts(demoShifts || {});
    }
    
    if (isDemoMode) {
      setShiftPatterns({
        'mock-f1': { 1: 'R', 3: 'R', 5: 'R', 0: 'O', 2: 'O', 4: 'O', 6: 'O' },
        'mock-f2': { 2: 'L', 4: 'L', 6: 'L', 0: 'O', 1: 'O', 3: 'O', 5: 'O' }
      });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDemoMode, currentDate?.getMonth(), supabase, companyName]);

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

  const handleUpdatePunch = async () => {
    if (!selectedProfile) return;
    
    if (isDemoMode) {
      showToast('デモモードのため、実際のデータは保存されません', 'info');
      setIsModalOpen(false);
      return;
    }

    // 時刻文字列を検証する関数（"--:--", "-- : --", "-", 空文字等をnullに変換）
    const parseTime = (val: string | null | undefined): string | null => {
      if (!val) return null;
      const cleaned = val.replace(/\s/g, ''); // スペース除去
      if (!cleaned || cleaned === '-' || cleaned === '--' || cleaned === '--:--' || cleaned.includes('-')) return null;
      // HH:MM 形式のバリデーション
      const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return null;
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (h < 0 || h > 23 || m < 0 || m > 59) return null;
      return cleaned;
    };

    const pIn = parseTime(selectedProfile.punchIn);
    const pOut = parseTime(selectedProfile.punchOut);

    // 送信データの構築
    const upsertData: any = {
      user_id: selectedProfile.id,
      target_date: todayDate,
      punch_in: pIn,
      punch_out: pOut
    };

    console.log('📤 Attendance upsert data:', JSON.stringify(upsertData));

    const { error } = await supabase.from('attendances').upsert(upsertData, { onConflict: 'user_id,target_date' });

    if (!error) {
      showToast('打刻時間を修正しました', 'success');
      setIsModalOpen(false);
    } else {
      console.error('❌ Attendance update error:', JSON.stringify(error, null, 2));
      console.error('❌ Error details:', error.code, error.details, error.hint, error.message);
      showToast(`更新に失敗しました: ${error.message || error.details || '不明なエラー'}`, 'danger');
    }
  };

  const pendingCount = isDemoMode ? 3 : applications.filter(a => a.status === 'pending').length;

  const renderSection = () => {
    let augmentedProfiles: any[] = [];
    
    if (isDemoMode) {
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
      augmentedProfiles = profiles.filter((p: any) => !p.is_demo);
    }

    if (activeSec === 'sec-settings') {
      return (
        <div className="admin-section active">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '24px' }}>⚙️</span> システム設定</h2>
          <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>システム全体で共通利用する設定を管理します。</p>
          
          <div className="card" style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>🏢 会社情報の表示設定</h3>
            <div className="form-group">
              <label>会社名</label>
              <input 
                type="text" 
                value={settingName} 
                onChange={(e) => setSettingName(e.target.value)} 
                placeholder="例：株式会社デモ" 
                style={{ padding: '12px', fontSize: '16px', width: '100%' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '8px', lineHeight: '1.5' }}>
                ※ここで設定した会社名が、スタッフのスマホ画面および管理者画面の左上に表示されます。<br/>
                ※空欄にした場合は、本番環境では「Admin」、デモモードでは「株式会社デモ」と表示されます。
              </p>
            </div>
            
            <button 
              className="btn-rect" 
              style={{ background: '#2563eb', color: 'white', height: '40px', minHeight: 'auto', padding: '0 20px', borderRadius: '8px', marginTop: '10px' }} 
              onClick={() => updateCompanyName && updateCompanyName(settingName)}
            >
              設定を保存する
            </button>
          </div>
        </div>
      );
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
            showToast={showToast}
          />
        );
      case 'sec-staff':
        return <StaffMaster profiles={augmentedProfiles} isDemoMode={isDemoMode} supabase={supabase} showToast={showToast} />;
      case 'sec-report':
        return <ReportAnalysis isDemoMode={isDemoMode} />;
      case 'sec-integration':
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
        <h1 style={{ color: 'white', fontSize: (isDemoMode || companyName) ? '22px' : '30px', padding: '30px 20px', fontWeight: '900', margin: 0, lineHeight: 1.3 }}>
          {isDemoMode ? (companyName || '株式会社デモ') : (companyName || 'Admin')}
        </h1>
        <nav id="admin-nav" style={{ padding: '0 10px', flex: 1 }}>
          <p className={activeSec === 'sec-list' ? 'active' : ''} onClick={() => setActiveSec('sec-list')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#10b981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📊</span>{isDemoMode ? 'デモ勤怠一覧' : '勤怠一覧管理'}</span></p>
          <p className={activeSec === 'sec-approval' ? 'active' : ''} onClick={() => setActiveSec('sec-approval')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ width: '26px', height: '26px', background: '#ef4444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📩</span>
                {isDemoMode ? 'デモ申請承認' : '申請承認'}
              </span>
              {pendingCount > 0 && (
                <span style={{ background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '50px' }}>
                  {pendingCount}
                </span>
              )}
            </span>
          </p>
          <p className={activeSec === 'sec-shift' ? 'active' : ''} onClick={() => setActiveSec('sec-shift')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📅</span>シフト管理</span></p>
          <p className={activeSec === 'sec-staff' ? 'active' : ''} onClick={() => setActiveSec('sec-staff')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#a855f7', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👥</span>社員マスタ</span></p>
          <p className={activeSec === 'sec-report' ? 'active' : ''} onClick={() => setActiveSec('sec-report')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📈</span>レポート分析</span></p>
          <p className={activeSec === 'sec-notice' ? 'active' : ''} onClick={() => setActiveSec('sec-notice')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#f59e0b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🔔</span>お知らせ管理</span></p>
          <p className={activeSec === 'sec-integration' ? 'active' : ''} onClick={() => setActiveSec('sec-integration')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#a855f7', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>💾</span>データ連携</span></p>
          <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <p className={activeSec === 'sec-settings' ? 'active' : ''} onClick={() => setActiveSec('sec-settings')} style={{ marginBottom: '15px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#64748b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>⚙️</span>システム設定</span></p>
            <p className={activeSec === 'sec-help' ? 'active' : ''} onClick={() => setActiveSec('sec-help')}><span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><span style={{ width: '26px', height: '26px', background: '#10b981', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📖</span>使い方ガイド</span></p>
          </div>
        </nav>
      </aside>
      <main className="admin-main">{renderSection()}</main>
      
      {isModalOpen && selectedProfile && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content card" style={{ width: '500px', padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ marginBottom: '20px' }}>社員詳細: {selectedProfile.full_name}</h2>
            <div className="form-group" style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>出勤時間</label>
                <input 
                  type="time" 
                  value={(selectedProfile.punchIn && selectedProfile.punchIn !== '-') ? selectedProfile.punchIn : ''} 
                  onChange={e => setSelectedProfile({...selectedProfile, punchIn: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>退勤時間</label>
                <input 
                  type="time" 
                  value={(selectedProfile.punchOut && selectedProfile.punchOut !== '-') ? selectedProfile.punchOut : ''} 
                  onChange={e => setSelectedProfile({...selectedProfile, punchOut: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn-rect" style={{ background: '#eee', color: '#333', height: '40px', minHeight: 'auto', width: 'auto', padding: '0 20px', borderRadius: '8px' }}>閉じる</button>
              <button onClick={handleUpdatePunch} className="btn-rect" style={{ background: '#2563eb', color: 'white', height: '40px', minHeight: 'auto', width: 'auto', padding: '0 20px', borderRadius: '8px' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
