'use client';

import React, { useState, useEffect } from 'react';

export default function StaffMaster({ profiles, isDemoMode, supabase, showToast }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localProfiles, setLocalProfiles] = useState<any[]>([]);
  const [displayTab, setDisplayTab] = useState<'active' | 'retired'>('active');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const baseProfiles = Array.isArray(profiles) ? profiles : [];
    const formatted = baseProfiles.map(p => ({
      ...p,
      kana: p.kana || 'テスト カナ',
      dob: p.dob || '1990-01-01',
      phone: p.phone || '090-0000-0000',
      address: p.address || '東京都新宿区',
      visaExpiry: p.visa_expiry || p.visaExpiry || null,
      status: p.status || '在籍'
    }));
    setLocalProfiles(formatted);
  }, [profiles]);

  // モーダルを開く処理
  const openEditModal = (staff: any) => {
    setSelectedStaff(staff);
    setEditStaff({ ...staff });
    setActiveTab('basic');
  };

  const handleInputChange = (key: string, value: any) => {
    setEditStaff((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    if (!selectedStaff || !editStaff) return;
    
    if (isDemoMode) {
      setLocalProfiles(prev => prev.map(p => p.id === selectedStaff.id ? editStaff : p));
      showToast("デモモード：保存しました", "success");
      setSelectedStaff(null);
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editStaff.full_name,
      kana: editStaff.kana,
      dob: editStaff.dob,
      phone: editStaff.phone,
      address: editStaff.address,
      visa_expiry: editStaff.visaExpiry,
      employment_type: editStaff.employment_type
    }).eq('id', selectedStaff.id);

    if (!error) {
      showToast("情報を更新しました", "success");
      setLocalProfiles(prev => prev.map(p => p.id === selectedStaff.id ? editStaff : p));
      setSelectedStaff(null);
    } else {
      showToast("更新に失敗しました", "danger");
    }
    setIsSaving(false);
  };

  const renderBadge = (status: string) => {
    let bgColor = '#10b981';
    if (status === '退職') bgColor = '#64748b';
    return <span style={{ background: bgColor, color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{status}</span>;
  };

  const isVisaWarning = (date: string) => {
    if (!date) return false;
    const expiry = new Date(date);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 60);
    return expiry < threshold;
  };

  const filteredProfiles = localProfiles
    .filter(p => displayTab === 'active' ? p.status !== '退職' : p.status === '退職')
    .filter(p => p.full_name?.includes(searchQuery) || p.employee_id?.includes(searchQuery));

  return (
    <section className="admin-section active" style={{ padding: '20px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: 0 }}>社員マスタ管理</h1>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button onClick={() => setDisplayTab('active')} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: displayTab === 'active' ? 'white' : 'transparent', color: displayTab === 'active' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}>在籍中</button>
          <button onClick={() => setDisplayTab('retired')} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: displayTab === 'retired' ? 'white' : 'transparent', color: displayTab === 'retired' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}>退職済</button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '15px 20px', textAlign: 'left' }}>社員番号</th>
              <th style={{ padding: '15px 20px', textAlign: 'left' }}>氏名</th>
              <th style={{ padding: '15px 20px', textAlign: 'left' }}>拠点</th>
              <th style={{ padding: '15px 20px', textAlign: 'left' }}>ステータス</th>
              <th style={{ padding: '15px 20px', textAlign: 'center' }}>詳細</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px 20px' }}>{p.employee_id}</td>
                <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>
                  {p.full_name}
                  {isVisaWarning(p.visaExpiry) && (
                    <span style={{ marginLeft: '10px', fontSize: '10px', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px' }}>⚠️ ビザ注意</span>
                  )}
                </td>
                <td style={{ padding: '15px 20px' }}>{p.branch}</td>
                <td style={{ padding: '15px 20px' }}>{renderBadge(p.status)}</td>
                <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                  <button onClick={() => openEditModal(p)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer' }}>編集</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStaff && editStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '600px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>{editStaff.full_name} の詳細編集</h2>
                <button onClick={() => setSelectedStaff(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #f1f5f9', marginBottom: '20px' }}>
                <button onClick={() => setActiveTab('basic')} style={{ padding: '10px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'basic' ? '2px solid #3b82f6' : 'none', color: activeTab === 'basic' ? '#3b82f6' : '#64748b' }}>基本情報</button>
                <button onClick={() => setActiveTab('visa')} style={{ padding: '10px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'visa' ? '2px solid #3b82f6' : 'none', color: activeTab === 'visa' ? '#3b82f6' : '#64748b' }}>在留資格</button>
              </div>

              {activeTab === 'basic' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div><label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>氏名</label><input type="text" value={editStaff.full_name} onChange={e => handleInputChange('full_name', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>フリガナ</label><input type="text" value={editStaff.kana} onChange={e => handleInputChange('kana', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>拠点</label><input type="text" value={editStaff.branch} readOnly style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>雇用形態</label><select value={editStaff.employment_type} onChange={e => handleInputChange('employment_type', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}><option>正社員</option><option>契約社員</option><option>アルバイト</option></select></div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>ビザ有効期限</label>
                  <input type="date" value={editStaff.visaExpiry || ''} onChange={e => handleInputChange('visaExpiry', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                  {isVisaWarning(editStaff.visaExpiry) && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px' }}>⚠️ 期限が近づいているか切れています。更新手続きを確認してください。</p>}
                </div>
              )}
            </div>
            <div style={{ padding: '20px 30px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedStaff(null)} style={{ padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px' }}>閉じる</button>
              <button onClick={handleUpdate} disabled={isSaving} style={{ padding: '10px 25px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{isSaving ? '保存中...' : '保存する'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
