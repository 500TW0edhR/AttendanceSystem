'use client';

import React, { useState } from 'react';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

interface AttendanceListProps {
  profiles: any[];
  allData: any[];
  todayDate: string;
  isDemoMode: boolean;
  currentDate: Date | null;
  setSelectedProfile: (p: any) => void;
  setIsModalOpen: (open: boolean) => void;
}

export default function AttendanceList({
  profiles,
  allData,
  todayDate,
  isDemoMode,
  currentDate,
  setSelectedProfile,
  setIsModalOpen
}: AttendanceListProps) {

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterBranch, setFilterBranch] = useState('ALL');

  const renderBadge = (status: string) => {
    let bgColor = '#10b981';
    let textColor = 'white';
    
    if (status === '未打刻' || status === '欠勤' || status === '残業超過') bgColor = '#fee2e2', textColor = '#ef4444';
    if (status === '外出中') bgColor = '#fffbeb', textColor = '#f59e0b';
    if (status === '直行直帰') bgColor = '#f0f9ff', textColor = '#0ea5e9';
    
    return (
      <span style={{ 
        background: bgColor, color: textColor, padding: '4px 12px', borderRadius: '50px', 
        fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', 
        justifyContent: 'center', minWidth: '80px', border: bgColor.startsWith('#f') ? `1px solid ${textColor}22` : 'none'
      }}>
        {status}
      </span>
    );
  };

  const baseProfiles = Array.isArray(profiles) ? profiles : [];
  const displayProfiles = isDemoMode 
    ? baseProfiles.filter((p: any) => p.is_demo) 
    : baseProfiles.filter((p: any) => !p.is_demo);

  // デモ用のデータ補完とフィルタリング
  const records = displayProfiles.map((p: any, idx: number) => {
    const record = Array.isArray(allData) ? allData.find((a: any) => a.user_id === p.id) : null;
    let branch = p.branch || '東京';
    let status = p.status || '正常';
    let punchIn = record?.punch_in || '-';
    let punchOut = record?.punch_out || '-';

    if (isDemoMode && p.employee_id !== 'No.0000') {
      const branches = PREFECTURES;
      const statuses = ['正常', '正常', '正常', '未打刻', '外出中', '直行直帰', '残業超過'];
      branch = branches[idx % branches.length];
      status = statuses[idx % statuses.length];
      
      if (status === '正常') { punchIn = '09:00'; punchOut = '18:00'; }
      else if (status === '残業超過') { punchIn = '09:00'; punchOut = '21:30'; }
      else if (status === '外出中') { punchIn = '09:00'; punchOut = '-'; }
      else if (status === '直行直帰') { punchIn = '08:30'; punchOut = '19:00'; }
      else { punchIn = '-'; punchOut = '-'; }
    }

    return { ...p, branch, status, punchIn, punchOut };
  }).filter((r: any) => {
    const matchesSearch = r.full_name.includes(searchQuery) || r.employee_id.includes(searchQuery);
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus || (filterStatus === 'ALERT' && (r.status === '未打刻' || r.status === '残業超過'));
    const matchesBranch = filterBranch === 'ALL' || r.branch === filterBranch;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  // 統計計算
  const stats = {
    total: displayProfiles.length,
    active: records.filter(r => r.punchIn !== '-' && r.punchOut === '-').length,
    alert: records.filter(r => r.status === '未打刻' || r.status === '残業超過').length,
    done: records.filter(r => r.punchOut !== '-').length
  };

  return (
    <section className="admin-section active" style={{ padding: '20px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
            {isDemoMode ? 'デモ勤怠一覧' : '勤怠一覧管理'}
          </h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>対象日: <span style={{fontWeight: 'bold', color: '#1e293b'}}>{todayDate?.replace(/-/g, '/')}</span> のリアルタイム稼働状況です。</p>
        </div>
        <button 
          onClick={() => alert('デモモード：CSV出力を開始します')}
          style={{ 
            background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', 
            borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', color: '#475569',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
          📥 CSV出力
        </button>
      </div>

      {/* 統計カード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {[
          { label: '対象社員', val: stats.total, color: '#1e293b', bg: 'white' },
          { label: '出勤中', val: stats.active, color: '#0ea5e9', bg: '#f0f9ff' },
          { label: '警告・未打刻', val: stats.alert, color: '#ef4444', bg: '#fee2e2' },
          { label: '退勤済み', val: stats.done, color: '#10b981', bg: '#ecfdf5' }
        ].map((s, i) => (
          <div key={i} style={{ 
            background: s.bg, padding: '20px', borderRadius: '16px', 
            border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.val} <span style={{fontSize: '14px', fontWeight: 'bold', color: '#94a3b8'}}>名</span></div>
          </div>
        ))}
      </div>

      {/* フィルタパネル */}
      <div style={{ 
        background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '25px', 
        border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 2 }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input 
            type="text" 
            placeholder="社員名・番号で検索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
          />
        </div>
        <select 
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
        >
          <option value="ALL">全ての拠点</option>
          {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
        >
          <option value="ALL">全てのステータス</option>
          <option value="正常">正常</option>
          <option value="ALERT">⚠️ 警告（未打刻・超過）</option>
          <option value="外出中">外出中</option>
          <option value="直行直帰">直行直帰</option>
        </select>
      </div>

      {/* テーブル */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>社員番号</th>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>氏名</th>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>拠点</th>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>出勤</th>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>退勤</th>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>状況</th>
              <th style={{ padding: '18px 25px', color: '#64748b', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r: any) => (
              <tr key={r.id} className="attendance-row" style={{ 
                borderBottom: '1px solid #f1f5f9', 
                background: (r.status === '未打刻' || r.status === '残業超過') ? '#fff5f5' : undefined,
                transition: 'background 0.2s'
              }}>
                <td style={{ padding: '18px 25px', color: '#64748b', fontSize: '14px', fontFamily: 'monospace' }}>{r.employee_id}</td>
                <td style={{ padding: '18px 25px', fontWeight: 'bold', color: '#1e293b' }}>
                  {r.full_name}
                  {r.visaExpiry && (new Date(r.visaExpiry) < new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000)) && (
                    <span style={{ 
                      marginLeft: '10px', fontSize: '10px', fontWeight: 'bold', 
                      background: new Date(r.visaExpiry) < new Date() ? '#fee2e2' : '#ffedd5', 
                      color: new Date(r.visaExpiry) < new Date() ? '#ef4444' : '#f97316', 
                      padding: '2px 6px', borderRadius: '4px', border: `1px solid ${new Date(r.visaExpiry) < new Date() ? '#fca5a5' : '#fdba74'}` 
                    }}>
                      ⚠️ {new Date(r.visaExpiry) < new Date() ? 'ビザ期限切れ' : 'ビザ更新'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '18px 25px', color: '#475569' }}>{r.branch}</td>
                <td style={{ padding: '18px 25px', color: '#1e293b', fontWeight: '500' }}>{r.punchIn}</td>
                <td style={{ padding: '18px 25px', color: '#1e293b', fontWeight: '500' }}>{r.punchOut}</td>
                <td style={{ padding: '18px 25px' }}>{renderBadge(r.status)}</td>
                <td style={{ padding: '18px 25px', textAlign: 'center' }}>
                  <button 
                    onClick={() => { setSelectedProfile(r); setIsModalOpen(true); }} 
                    style={{ 
                      padding: '6px 15px', background: 'white', border: '1px solid #e2e8f0', 
                      borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b',
                      cursor: 'pointer'
                    }}
                  >
                    打刻修正
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            該当する勤怠データが見つかりませんでした。
          </div>
        )}
      </div>

      <style jsx>{`
        .attendance-row:nth-child(even) {
          background-color: #f4fcf7;
        }
        .attendance-row:hover {
          background-color: #f8fafc !important;
        }
      `}</style>
    </section>
  );
}
