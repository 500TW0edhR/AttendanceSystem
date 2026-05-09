'use client';

import React, { useState, useEffect } from 'react';
import { PREFECTURES } from '../../AdminView';

export default function StaffMaster({ profiles, isDemoMode, supabase, showToast }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [localProfiles, setLocalProfiles] = useState<any[]>([]);
  const [displayTab, setDisplayTab] = useState<'active' | 'retired'>('active');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  // 初回データ成形（既存データに欠けているパーソナルデータの初期値を補完）
  useEffect(() => {
    const baseProfiles = Array.isArray(profiles) ? profiles : [];
    const formatted = baseProfiles.map(p => ({
      ...p,
      kana: p.kana || 'テスト カナ',
      dob: p.dob || '1990-01-01',
      phone: p.phone || '090-0000-0000',
      address: p.address || '東京都新宿区',
      email: p.email || `${p.employee_id || 'user'}@example.com`,
      department: p.department || (p.is_demo ? '営業部' : '未設定'),
      role: p.role || (p.is_demo ? '一般' : '未設定'),
      hire_date: p.hire_date || '2023-04-01',
      emergency_contact: p.emergency_contact || '田中 太郎 (父) 080-1234-5678',
      bank_info: p.bank_info || '〇〇銀行 △△支店 普通 1234567',
      visa_type: p.visa_type || '技術・人文知識・国際業務',
      visaExpiry: p.visa_expiry || p.visaExpiry || null,
      status: (p.status === '退職' || p.status === '招待中') ? p.status : '在籍'
    }));
    setLocalProfiles(formatted);
  }, [profiles]);

  // 社員番号の自動採番ロジック
  const generateNextId = () => {
    const ids = localProfiles.map(p => {
      const match = p.employee_id?.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    });
    const max = Math.max(0, ...ids);
    return `No.${String(max + 1).padStart(4, '0')}`;
  };

  // 新規登録の初期化
  const handleAddNew = () => {
    const nextId = generateNextId();
    const newStaff = {
      id: `new-${Date.now()}`,
      employee_id: nextId,
      full_name: '',
      kana: '',
      branch: '東京都',
      employment_type: '正社員',
      department: '未設定',
      role: '一般',
      hire_date: new Date().toISOString().split('T')[0],
      email: '',
      dob: '1995-01-01',
      phone: '',
      address: '',
      emergency_contact: '',
      bank_info: '',
      visa_type: 'なし',
      status: '在籍',
      is_new: true
    };
    setSelectedStaff(newStaff);
    setEditStaff(newStaff);
    setActiveTab('basic');
  };

  // 保存処理（デモモード対応）
  const handleUpdate = async () => {
    if (!selectedStaff || !editStaff) return;
    setIsSaving(true);

    if (isDemoMode || editStaff.is_new) {
      setTimeout(() => {
        if (editStaff.is_new) {
          setLocalProfiles(prev => [editStaff, ...prev]);
        } else {
          setLocalProfiles(prev => prev.map(p => p.id === selectedStaff.id ? editStaff : p));
        }
        showToast(editStaff.is_new ? "新しい社員を登録しました" : "情報を更新しました", "success");
        setSelectedStaff(null);
        setIsSaving(false);
      }, 500);
      return;
    }

    const { error } = await supabase.from('profiles').update({
      full_name: editStaff.full_name,
      kana: editStaff.kana,
      branch: editStaff.branch,
      employment_type: editStaff.employment_type,
      department: editStaff.department,
      role: editStaff.role,
      hire_date: editStaff.hire_date,
      email: editStaff.email,
      dob: editStaff.dob,
      phone: editStaff.phone,
      address: editStaff.address,
      visa_expiry: editStaff.visaExpiry,
      status: editStaff.status
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

  const handleInputChange = (key: string, value: any) => {
    setEditStaff((prev: any) => ({ ...prev, [key]: value }));
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
    .filter(p => p.full_name?.includes(searchQuery) || p.employee_id?.includes(searchQuery))
    .filter(p => filterBranch === 'ALL' || p.branch === filterBranch)
    .filter(p => filterType === 'ALL' || p.employment_type === filterType);

  return (
    <section className="admin-section active" style={{ padding: '20px 40px' }}>
      {/* 1. アクションバー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>社員マスタ管理</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => alert('デモ：CSVインポート画面を開きます')} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>📤 CSVインポート</button>
          <button onClick={() => alert('デモ：CSVデータを出力します')} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>📥 CSV出力</button>
          <button onClick={handleAddNew} style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>＋ 社員を新規登録</button>
        </div>
      </div>

      {/* 2. 検索・フィルターバー */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input 
            type="text" 
            placeholder="名前、社員番号で検索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px' }}
          />
        </div>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: '150px' }}>
          <option value="ALL">全ての拠点</option>
          {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: '150px' }}>
          <option value="ALL">全ての雇用形態</option>
          <option value="正社員">正社員</option>
          <option value="契約社員">契約社員</option>
          <option value="アルバイト">アルバイト</option>
        </select>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button onClick={() => setDisplayTab('active')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: displayTab === 'active' ? 'white' : 'transparent', color: displayTab === 'active' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>在籍中</button>
          <button onClick={() => setDisplayTab('retired')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: displayTab === 'retired' ? 'white' : 'transparent', color: displayTab === 'retired' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>退職済</button>
        </div>
      </div>

      {/* 3. テーブル一覧 */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
              <th style={{ padding: '18px 25px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>社員情報</th>
              <th style={{ padding: '18px 25px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>拠点 / 部署</th>
              <th style={{ padding: '18px 25px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>雇用形態</th>
              <th style={{ padding: '18px 25px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>ステータス</th>
              <th style={{ padding: '18px 25px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>詳細</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map(p => (
              <tr key={p.id} className="staff-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s' }}>
                <td style={{ padding: '15px 25px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 'bold', fontSize: '18px', border: '1px solid #dbeafe' }}>
                      {p.full_name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px' }}>{p.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{p.employee_id}</div>
                    </div>
                    {isVisaWarning(p.visaExpiry) && (
                      <span style={{ fontSize: '10px', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', marginLeft: '8px' }}>⚠️ ビザ注意</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '15px 25px' }}>
                  <div style={{ fontWeight: 'bold', color: '#475569' }}>{p.branch}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.department} / {p.role}</div>
                </td>
                <td style={{ padding: '15px 25px' }}>
                  <span style={{ fontSize: '14px', color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>{p.employment_type}</span>
                </td>
                <td style={{ padding: '15px 25px' }}>
                  <span style={{ 
                    background: p.status === '在籍' ? '#ecfdf5' : p.status === '招待中' ? '#eff6ff' : '#f1f5f9', 
                    color: p.status === '在籍' ? '#10b981' : p.status === '招待中' ? '#3b82f6' : '#64748b', 
                    padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' 
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '15px 25px', textAlign: 'center' }}>
                  <button onClick={() => { setSelectedStaff(p); setEditStaff({...p}); setActiveTab('basic'); }} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 18px', borderRadius: '10px', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}>編集</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. 詳細編集モーダル */}
      {selectedStaff && editStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s' }}>
          <div style={{ width: '850px', background: 'white', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', animation: 'popIn 0.3s' }}>
            
            <div style={{ padding: '35px 40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '25px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold' }}>
                {editStaff.full_name?.charAt(0) || '＋'}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>{editStaff.is_new ? '社員の新規登録' : `${editStaff.full_name} の詳細編集`}</h2>
                <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{editStaff.employee_id} • {editStaff.employment_type}</div>
              </div>
              <button onClick={() => setSelectedStaff(null)} style={{ background: '#e2e8f0', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '30px', padding: '0 40px', borderBottom: '1px solid #f1f5f9' }}>
              <button onClick={() => setActiveTab('basic')} style={{ padding: '20px 0', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'basic' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'basic' ? '#3b82f6' : '#64748b', fontWeight: 'bold' }}>基本業務情報</button>
              <button onClick={() => setActiveTab('personal')} style={{ padding: '20px 0', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'personal' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'personal' ? '#3b82f6' : '#64748b', fontWeight: 'bold' }}>個人・連絡先情報</button>
              <button onClick={() => setActiveTab('visa')} style={{ padding: '20px 0', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'visa' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'visa' ? '#3b82f6' : '#64748b', fontWeight: 'bold' }}>在留資格・ビザ</button>
              <button onClick={() => setActiveTab('history')} style={{ padding: '20px 0', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'history' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'history' ? '#3b82f6' : '#64748b', fontWeight: 'bold' }}>変更履歴</button>
            </div>

            <div style={{ padding: '40px', maxHeight: '55vh', overflowY: 'auto' }}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>氏名</label><input type="text" value={editStaff.full_name} onChange={e => handleInputChange('full_name', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>フリガナ</label><input type="text" value={editStaff.kana} onChange={e => handleInputChange('kana', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>拠点</label><select value={editStaff.branch} onChange={e => handleInputChange('branch', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }}>{PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>部署 / 役職</label><div style={{ display: 'flex', gap: '10px' }}><input type="text" value={editStaff.department} onChange={e => handleInputChange('department', e.target.value)} placeholder="部署" style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /><input type="text" value={editStaff.role} onChange={e => handleInputChange('role', e.target.value)} placeholder="役職" style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>雇用形態</label><select value={editStaff.employment_type} onChange={e => handleInputChange('employment_type', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }}><option>正社員</option><option>契約社員</option><option>アルバイト</option></select></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>入社日</label><input type="date" value={editStaff.hire_date} onChange={e => handleInputChange('hire_date', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>メールアドレス</label><input type="email" value={editStaff.email} onChange={e => handleInputChange('email', e.target.value)} placeholder="user@example.com" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                </div>
              )}
              {activeTab === 'personal' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>生年月日</label><input type="date" value={editStaff.dob} onChange={e => handleInputChange('dob', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>電話番号</label><input type="text" value={editStaff.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="090-0000-0000" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>住所</label><input type="text" value={editStaff.address} onChange={e => handleInputChange('address', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>緊急連絡先 (氏名・続柄・電話番号)</label><input type="text" value={editStaff.emergency_contact} onChange={e => handleInputChange('emergency_contact', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>振込先口座情報</label><textarea value={editStaff.bank_info} onChange={e => handleInputChange('bank_info', e.target.value)} style={{ width: '100%', height: '80px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', resize: 'none' }} /></div>
                </div>
              )}
              {activeTab === 'visa' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>ビザの種類</label><select value={editStaff.visa_type} onChange={e => handleInputChange('visa_type', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }}><option>なし（日本国籍）</option><option>技術・人文知識・国際業務</option><option>永住者</option><option>特定技能</option></select></div>
                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>有効期限</label><input type="date" value={editStaff.visaExpiry || ''} onChange={e => handleInputChange('visaExpiry', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  </div>
                  <div style={{ width: '100%', height: '180px', border: '2px dashed #cbd5e1', borderRadius: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }} onClick={() => alert('デモ：ファイル選択ダイアログを開きます')}>
                    <div style={{ fontSize: '40px' }}>📁</div><div>カード画像をアップロード</div>
                  </div>
                </div>
              )}
              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { date: '2024/05/01 10:25', user: '管理者', action: '拠点情報の更新' },
                    { date: '2024/04/15 14:12', user: 'システム', action: '入社データのインポート' }
                  ].map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '20px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{h.date}</div>
                      <div style={{ flex: 1, fontSize: '14px', fontWeight: 'bold' }}>{h.action}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>担当: {h.user}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '25px 40px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button onClick={() => setSelectedStaff(null)} style={{ padding: '12px 25px', borderRadius: '12px', background: 'white', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={handleUpdate} disabled={isSaving} style={{ padding: '12px 40px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{isSaving ? '保存中...' : '設定を保存する'}</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .staff-row:nth-child(even) { background-color: #f4fcf7; }
        .staff-row:hover { background-color: #f8fafc !important; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </section>
  );
}
