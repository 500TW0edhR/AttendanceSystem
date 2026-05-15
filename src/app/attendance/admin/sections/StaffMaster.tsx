'use client';

import React, { useState, useEffect } from 'react';
import { PREFECTURES } from '../../AdminView';
import { inviteUserAction } from '../../../actions/inviteUser';
import { deleteUserAction } from '../../../actions/deleteUser';
import { bulkInviteAction } from '../../../actions/bulkInvite';

export interface CsvStaffData {
  employee_id: string;
  full_name: string;
  kana: string;
  branch: string;
  department: string;
  position: string;
  employment_type: string;
  hire_date: string;
  email: string;
  dob: string;
  phone: string;
  address: string;
  emergency_contact: string;
  bank_info: string;
}

export default function StaffMaster({ profiles, setProfiles, isDemoMode, supabase, showToast }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [localProfiles, setLocalProfiles] = useState<any[]>([]);
  const [displayTab, setDisplayTab] = useState<'active' | 'retired'>('active');
  
  const [selectedStaff, setSelectedStaff] = useState<any>(null); // 編集用
  const [editStaff, setEditStaff] = useState<any>(null);        // 編集フォーム用
  const [viewStaff, setViewStaff] = useState<any>(null);        // 閲覧用
  
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const csvImportRef = React.useRef<HTMLInputElement>(null);

  // 初回データ成形
  useEffect(() => {
    const baseProfiles = Array.isArray(profiles) ? profiles : [];
    const formatted = baseProfiles.map((p, idx) => {
      // 画像の割り当て（デモ用）
      let photo = '/demo/p1.png';
      if (p.full_name?.includes('花子') || p.full_name?.includes('美穂') || p.full_name?.includes('山本')) photo = '/demo/p2.png';
      if (p.full_name?.includes('カルロス') || p.full_name?.includes('グエン')) photo = '/demo/p3.png';
      // それ以外はインデックスで適当に散らす
      if (!p.full_name?.includes('実演')) {
        if (idx % 3 === 1) photo = '/demo/p2.png';
        if (idx % 3 === 2) photo = '/demo/p3.png';
      }

      return {
        ...p,
        kana: p.kana || 'テスト カナ',
        dob: p.dob || '1990-01-01',
        phone: p.phone || '090-0000-0000',
        address: p.address || '東京都新宿区',
        email: p.email || `${p.employee_id || 'user'}@example.com`,
        department: p.department || (p.is_demo ? '営業部' : '未設定'),
        position: p.position || (p.is_demo ? '一般' : '未設定'),
        hire_date: p.hire_date || '2023-04-01',
        emergency_contact: p.emergency_contact || '田中 太郎 (父) 080-1234-5678',
        bank_info: p.bank_info || '〇〇銀行 △△支店 普通 1234567',
        visa_type: p.visa_type || '技術・人文知識・国際業務',
        visaExpiry: p.visa_expiry || p.visaExpiry || null,
        photo: photo,
        status: (p.status === '退職' || p.status === '招待中') ? p.status : '在籍'
      };
    });
    setLocalProfiles(formatted);
  }, [profiles]);

  const generateNextId = () => {
    const ids = localProfiles.map(p => {
      const match = p.employee_id?.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    });
    const max = Math.max(0, ...ids);
    return `No.${String(max + 1).padStart(4, '0')}`;
  };

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
      position: '一般',
      hire_date: new Date().toISOString().split('T')[0],
      email: '',
      dob: '1995-01-01',
      phone: '',
      address: '',
      emergency_contact: '',
      bank_info: '',
      visa_type: 'なし',
      status: '在籍',
      photo: '/demo/p1.png',
      is_new: true
    };
    setSelectedStaff(newStaff);
    setEditStaff(newStaff);
    setActiveTab('basic');
  };

  const handleUpdate = async () => {
    if (!selectedStaff || !editStaff) return;
    setIsSaving(true);

    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (editStaff.is_new) {
          setLocalProfiles(prev => [editStaff, ...prev]);
        } else {
          setLocalProfiles(prev => prev.map(p => p.id === selectedStaff.id ? editStaff : p));
        }
        showToast(editStaff.is_new ? "新しい社員を登録しました（デモ）" : "情報を更新しました（デモ）", "success");
        setSelectedStaff(null);
        return;
      }

      const updateData: any = {
        full_name: editStaff.full_name,
        kana: editStaff.kana,
        branch: editStaff.branch,
        employment_type: editStaff.employment_type,
        department: editStaff.department,
        position: editStaff.position,
        hire_date: editStaff.hire_date,
        email: editStaff.email,
        dob: editStaff.dob,
        phone: editStaff.phone,
        address: editStaff.address,
        visa_type: editStaff.visa_type,
        visa_expiry: editStaff.visaExpiry,
        emergency_contact: editStaff.emergency_contact,
        bank_info: editStaff.bank_info,
        status: editStaff.status,
        role: editStaff.role || 'user'
      };

      // 写真データがあれば追加
      if (editStaff.photo && editStaff.photo.startsWith('data:')) {
        updateData.photo = editStaff.photo;
      }

      if (editStaff.is_new) {
        if (!editStaff.email) {
          showToast("新規登録にはメールアドレスが必須です", "warning");
          return;
        }
        // 新規追加（サーバーアクションで招待と紐付けを行う）
        const result = await inviteUserAction(editStaff.email, updateData);
        
        if (result.error) {
          console.error("Invite error:", result.error);
          showToast(`登録に失敗しました: ${result.error}`, "danger");
        } else if (result.data) {
          setLocalProfiles(prev => [result.data, ...prev]);
          showToast("新しい社員を招待・登録しました", "success");
          setSelectedStaff(null);
        }
      } else {
        // 更新（UPDATE）
        const { error } = await supabase.from('profiles').update(updateData).eq('id', selectedStaff.id);

        if (!error) {
          showToast("情報を更新しました", "success");
          setLocalProfiles(prev => prev.map(p => p.id === selectedStaff.id ? editStaff : p));
          setSelectedStaff(null);
        } else {
          console.error("Update error:", error);
          showToast(`更新に失敗しました: ${error?.message || "不明なエラー"}`, "danger");
        }
      }
    } catch (err: any) {
      console.error("Critical update error:", err);
      showToast(`予期せぬエラーが発生しました: ${err.message || "通信エラー"}`, "danger");
    } finally {
      setIsSaving(false);
    }
  };

  // 退職処理（ステータスを退職に変更）
  const handleRetire = async () => {
    if (!selectedStaff || isSaving) return;
    if (!confirm(`${selectedStaff.full_name} さんを退職済みにしますか？\n（打刻履歴などのデータは保持されます）`)) return;

    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({ status: '退職' }).eq('id', selectedStaff.id);

    if (!error) {
      setLocalProfiles(prev => prev.map(p => p.id === selectedStaff.id ? { ...p, status: '退職' } : p));
      showToast("退職処理が完了しました", "success");
      setSelectedStaff(null);
    } else {
      showToast(`退職処理に失敗しました: ${error.message}`, "danger");
    }
    setIsSaving(false);
  };

  // 完全削除処理（Authアカウント含めDBから抹消）
  const handleDelete = async () => {
    if (!selectedStaff || isSaving) return;
    
    const isSelf = selectedStaff.id === (await supabase.auth.getUser()).data.user?.id;
    if (isSelf) {
      showToast("自分自身のアカウントは削除できません", "warning");
      return;
    }

    if (!confirm(`【警告：完全に削除しますか？】\n${selectedStaff.full_name} さんのアカウントと全ての打刻データを完全に消去します。この操作は取り消せません。\n（メールアドレスを解放して再利用する場合にのみ実行してください）`)) return;
    if (!confirm(`本当によろしいですか？関連する全ての勤怠データが失われます。`)) return;

    setIsSaving(true);
    const result = await deleteUserAction(selectedStaff.id);

    if (result.success) {
      setLocalProfiles(prev => prev.filter(p => p.id !== selectedStaff.id));
      if (typeof setProfiles === 'function') {
        setProfiles((prev: any[]) => prev.filter(p => p.id !== selectedStaff.id));
      }
      showToast("アカウントを完全に削除しました", "success");
      setSelectedStaff(null);
    } else {
      showToast(`削除に失敗しました: ${result.error}`, "danger");
    }
    setIsSaving(false);
  };

  const handleInputChange = (key: string, value: any) => {
    setEditStaff((prev: any) => ({ ...prev, [key]: value }));
  };

  // 画像ファイルが選択された時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // CSVエクスポート
  const handleExportCSV = () => {
    const headers = ["社員番号", "氏名", "フリガナ", "拠点", "部署", "役職", "雇用形態", "入社日", "メールアドレス", "生年月日", "電話番号", "住所", "緊急連絡先", "振込先情報"];
    const rows = localProfiles.map(p => [
      p.employee_id, p.full_name, p.kana, p.branch, p.department, p.position, p.employment_type, p.hire_date, p.email, p.dob, p.phone, p.address, p.emergency_contact, p.bank_info
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // Excelでの文字化け防止
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `staff_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSVを出力しました", "success");
  };

  // CSVインポート
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      if (lines.length <= 1) {
        showToast("データが含まれていません", "warning");
        return;
      }

      // 50件制限のバリデーション
      if (lines.length > 51) {
        showToast("一度にインポートできるのは50名までです", "warning");
        return;
      }

      const rawStaffList: CsvStaffData[] = lines.slice(1).map(line => {
        // カンマで分割し、各項目からトリミングと隠れた改行コード(\r)を除去
        const cols = line.split(",").map(c => c.trim().replace(/[\r\n]/g, '').replace(/^"|"$/g, ''));
        return {
          employee_id: cols[0] || '',
          full_name: cols[1] || '',
          kana: cols[2] || '',
          branch: cols[3] || '',
          department: cols[4] || '',
          position: cols[5] || '',
          employment_type: cols[6] || '',
          hire_date: cols[7] || '',
          email: cols[8] || '',
          dob: cols[9] || '',
          phone: cols[10] || '',
          address: cols[11] || '',
          emergency_contact: cols[12] || '',
          bank_info: cols[13] || ''
        };
      });

      if (isDemoMode) {
        const demoProfiles = rawStaffList.map(s => ({
          ...s,
          id: `csv-${Date.now()}-${Math.random()}`,
          status: '在籍',
          photo: '/demo/p1.png'
        }));
        setLocalProfiles(prev => [...demoProfiles, ...prev]);
        showToast(`${demoProfiles.length}件のデータをインポートしました（デモ）`, "success");
      } else {
        setIsSaving(true);
        try {
          // サーバーアクションによる一括登録の実行
          const result = await bulkInviteAction(rawStaffList);
          
          // 成功データのマージ（画面リロードなし）
          if (result.successfulProfiles.length > 0) {
            setLocalProfiles(prev => [...result.successfulProfiles, ...prev]);
            if (typeof setProfiles === 'function') {
              setProfiles((prev: any[]) => [...result.successfulProfiles, ...prev]);
            }
          }

          if (result.errorCount === 0) {
            showToast(`${result.successCount}件のデータをインポートしました`, "success");
          } else {
            const errorMsg = result.errors.map(err => `${err.email || '不明'}: ${err.reason}`).join('\n');
            alert(`インポート結果:\n成功: ${result.successCount}件\n失敗: ${result.errorCount}件\n\n失敗の理由:\n${errorMsg}`);
            showToast(`${result.successCount}件成功、${result.errorCount}件失敗しました`, result.successCount > 0 ? "warning" : "danger");
          }
        } catch (err: any) {
          console.error("Bulk import failed:", err);
          showToast("インポート中に予期せぬエラーが発生しました", "danger");
        } finally {
          setIsSaving(false);
        }
      }
      if (csvImportRef.current) csvImportRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const filteredProfiles = localProfiles
    .filter(p => displayTab === 'active' ? p.status !== '退職' : p.status === '退職')
    .filter(p => (p.full_name || '').includes(searchQuery) || (p.employee_id || '').includes(searchQuery))
    .filter(p => filterBranch === 'ALL' || p.branch === filterBranch)
    .filter(p => filterType === 'ALL' || p.employment_type === filterType);

  return (
    <section className="admin-section active" style={{ padding: '20px 40px' }}>
      {/* アクションバー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>社員マスタ管理</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="file" ref={csvImportRef} onChange={handleImportCSV} accept=".csv" style={{ display: 'none' }} />
          <button onClick={() => csvImportRef.current?.click()} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>📤 CSVインポート</button>
          <button onClick={handleExportCSV} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>📥 CSV出力</button>
          <button onClick={handleAddNew} style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>＋ 社員を新規登録</button>
        </div>
      </div>

      {/* 検索・フィルターバー */}
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

      {/* 一覧テーブル */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
              <th style={{ padding: '18px 25px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>氏名 / 社員番号</th>
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
                    <div>
                      <div 
                        className="staff-name-link"
                        onClick={() => setViewStaff(p)}
                        style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        {p.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{p.employee_id}</div>
                    </div>
                    {p.visaExpiry && (new Date(p.visaExpiry) < new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000)) && (
                      <span style={{ fontSize: '10px', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>⚠️ ビザ注意</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '15px 25px' }}>
                  <div style={{ fontWeight: 'bold', color: '#475569' }}>{p.branch}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.department} / {p.position}</div>
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

      {/* 4. 閲覧用詳細カード (Modal) */}
      {viewStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(10px)', animation: 'fadeIn 0.3s' }}>
          <div style={{ width: '850px', background: 'white', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', animation: 'popIn 0.3s' }}>
            
            {/* ヘッダーエリア（写真付き） */}
            <div style={{ display: 'flex', background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ padding: '40px' }}>
                <img src={viewStaff.photo} alt="profile" style={{ width: '140px', height: '140px', borderRadius: '24px', objectFit: 'cover', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
              </div>
              <div style={{ padding: '40px 20px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>{viewStaff.full_name}</h2>
                    <div style={{ fontSize: '16px', color: '#64748b', marginTop: '4px', fontWeight: 'bold' }}>{viewStaff.kana}</div>
                  </div>
                  <button onClick={() => setViewStaff(null)} style={{ background: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <span style={{ background: '#3b82f6', color: 'white', padding: '6px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>{viewStaff.employee_id}</span>
                  <span style={{ background: 'white', color: '#475569', padding: '6px 15px', borderRadius: '8px', fontSize: '13px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{viewStaff.employment_type}</span>
                  <span style={{ background: viewStaff.status === '在籍' ? '#ecfdf5' : '#f1f5f9', color: viewStaff.status === '在籍' ? '#10b981' : '#64748b', padding: '6px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>{viewStaff.status}</span>
                </div>
              </div>
            </div>

            {/* 情報グリッド */}
            <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxHeight: '50vh', overflowY: 'auto' }}>
              <div>
                <h3 style={{ fontSize: '14px', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>🏢 業務情報</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>拠点</span><span style={{ fontWeight: 'bold' }}>{viewStaff.branch}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>部署 / 役職</span><span style={{ fontWeight: 'bold' }}>{viewStaff.department} / {viewStaff.position}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>入社日</span><span style={{ fontWeight: 'bold' }}>{viewStaff.hire_date}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>メール</span><span style={{ fontWeight: 'bold' }}>{viewStaff.email}</span></div>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '14px', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>👤 個人連絡先</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>電話番号</span><span style={{ fontWeight: 'bold' }}>{viewStaff.phone}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>生年月日</span><span style={{ fontWeight: 'bold' }}>{viewStaff.dob}</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ color: '#64748b' }}>住所</span><span style={{ fontWeight: 'bold', fontSize: '14px' }}>{viewStaff.address}</span></div>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '14px', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>🆘 緊急連絡先・その他</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ color: '#64748b' }}>緊急連絡先</span><span style={{ fontWeight: 'bold' }}>{viewStaff.emergency_contact}</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ color: '#64748b' }}>振込口座</span><span style={{ fontWeight: 'bold', fontSize: '13px' }}>{viewStaff.bank_info}</span></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '25px 40px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewStaff(null)} style={{ padding: '12px 30px', borderRadius: '12px', background: 'white', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 編集用モーダル */}
      {selectedStaff && editStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s' }}>
          <div style={{ width: '850px', background: 'white', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', animation: 'popIn 0.3s' }}>
            
            <div style={{ padding: '35px 40px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '25px' }}>
              <div style={{ position: 'relative' }}>
                <img src={editStaff.photo} alt="edit-profile" style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover', border: '3px solid white', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', color: 'white', border: '2px solid white', borderRadius: '50%', width: '28px', height: '28px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✎
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
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

            <div style={{ padding: '40px', maxHeight: '50vh', overflowY: 'auto' }}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>氏名</label><input type="text" value={editStaff.full_name} onChange={e => handleInputChange('full_name', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>フリガナ</label><input type="text" value={editStaff.kana} onChange={e => handleInputChange('kana', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>拠点</label><select value={editStaff.branch} onChange={e => handleInputChange('branch', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }}>{PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>部署 / 役職</label><div style={{ display: 'flex', gap: '10px' }}><input type="text" value={editStaff.department} onChange={e => handleInputChange('department', e.target.value)} placeholder="部署" style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /><input type="text" value={editStaff.position} onChange={e => handleInputChange('position', e.target.value)} placeholder="役職" style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>雇用形態</label><select value={editStaff.employment_type} onChange={e => handleInputChange('employment_type', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }}><option>正社員</option><option>契約社員</option><option>アルバイト</option></select></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>入社日</label><input type="date" value={editStaff.hire_date} onChange={e => handleInputChange('hire_date', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>メールアドレス</label><input type="email" value={editStaff.email} onChange={e => handleInputChange('email', e.target.value)} placeholder="user@example.com" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2', background: '#f0f9ff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>🔐 システム管理者権限</label>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>管理者画面へのアクセスを許可します</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('role', editStaff.role === 'admin' ? 'user' : 'admin')}
                        style={{
                          width: '52px', height: '28px', borderRadius: '14px', cursor: 'pointer',
                          background: editStaff.role === 'admin' ? '#3b82f6' : '#cbd5e1',
                          position: 'relative', transition: 'all 0.3s'
                        }}
                      >
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                          position: 'absolute', top: '3px',
                          left: editStaff.role === 'admin' ? '27px' : '3px',
                          transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'personal' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>生年月日</label><input type="date" value={editStaff.dob} onChange={e => handleInputChange('dob', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>電話番号</label><input type="text" value={editStaff.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="090-0000-0000" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>住所</label><input type="text" value={editStaff.address} onChange={e => handleInputChange('address', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>緊急連絡先</label><input type="text" value={editStaff.emergency_contact} onChange={e => handleInputChange('emergency_contact', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>振込口座</label><textarea value={editStaff.bank_info} onChange={e => handleInputChange('bank_info', e.target.value)} style={{ width: '100%', height: '80px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', resize: 'none' }} /></div>
                </div>
              )}
              {activeTab === 'visa' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>ビザの種類</label><select value={editStaff.visa_type} onChange={e => handleInputChange('visa_type', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }}><option>なし</option><option>技術・人文知識・国際業務</option></select></div>
                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>有効期限</label><input type="date" value={editStaff.visaExpiry || ''} onChange={e => handleInputChange('visaExpiry', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px' }} /></div>
                  </div>
                  <div style={{ width: '100%', height: '180px', border: '2px dashed #cbd5e1', borderRadius: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '30px' }}>📁</div><div>画像をドラッグ＆ドロップ</div>
                  </div>
                </div>
              )}
              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', fontSize: '13px' }}>2024/05/01 10:25 - 管理者が拠点情報を更新しました</div>
                </div>
              )}
            </div>

            <div style={{ padding: '25px 40px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {(!editStaff.is_new && !selectedStaff.id.toString().startsWith('new-')) ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={handleRetire} 
                    disabled={isSaving || editStaff.status === '退職'}
                    style={{ padding: '10px 20px', borderRadius: '10px', background: 'white', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: isSaving || editStaff.status === '退職' ? 'not-allowed' : 'pointer', color: '#64748b', opacity: editStaff.status === '退職' ? 0.5 : 1 }}
                  >
                    {editStaff.status === '退職' ? '退職済み' : '退職済みにする'}
                  </button>
                  <button 
                    onClick={handleDelete} 
                    disabled={isSaving}
                    style={{ padding: '10px 20px', borderRadius: '10px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                  >
                    完全削除
                  </button>
                </div>
              ) : <div></div>}
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => setSelectedStaff(null)} style={{ padding: '12px 25px', borderRadius: '12px', background: 'white', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}>キャンセル</button>
                <button 
                  onClick={handleUpdate} 
                  disabled={isSaving} 
                  style={{ 
                    padding: '12px 40px', borderRadius: '12px', background: '#2563eb', color: 'white', border: 'none', 
                    fontWeight: 'bold', cursor: isSaving ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' 
                  }}
                >
                  {isSaving ? '保存中...' : (editStaff.is_new ? '新規登録' : '設定を保存')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .staff-row:nth-child(even) { background-color: #f4fcf7; }
        .staff-row:hover { background-color: #f8fafc !important; }
        .staff-name-link:hover { color: #3b82f6 !important; text-decoration: underline; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </section>
  );
}
