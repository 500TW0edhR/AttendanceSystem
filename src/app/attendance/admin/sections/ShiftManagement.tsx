'use client';

import React, { useState, useEffect } from 'react';

interface ShiftManagementProps {
  profiles: any[];
  isDemoMode: boolean;
  currentDate: Date | null;
  demoShifts: any;
  shiftPatterns: any;
  setShiftPatterns: (patterns: any) => void;
  onBulkUpdateShifts: (updates: any) => void;
  onUpdateShift: (pId: string, day: number, type: string) => Promise<void>;
  onDateChange: (newDate: Date) => void;
  realAdminId?: string;
  showToast?: (msg: string, type?: string) => void;
}

export default function ShiftManagement({
  profiles,
  isDemoMode,
  currentDate,
  demoShifts,
  shiftPatterns,
  setShiftPatterns,
  onBulkUpdateShifts,
  onUpdateShift,
  onDateChange,
  realAdminId,
  showToast
}: ShiftManagementProps) {

  const [isEditMode, setIsEditMode] = useState(false);
  const [popover, setPopover] = useState<{ pId: string, day: number, x: number, y: number } | null>(null);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [tempPatterns, setTempPatterns] = useState<any>({});

  const date = currentDate || new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  useEffect(() => {
    if (isPatternModalOpen) {
      setTempPatterns(shiftPatterns || {});
    }
  }, [isPatternModalOpen, shiftPatterns]);

  const getWeekdayIndex = (day: number) => {
    return new Date(year, month, day).getDay();
  };

  const isSunday = (day: number) => getWeekdayIndex(day) === 0;
  const isSaturday = (day: number) => getWeekdayIndex(day) === 6;

  const filteredProfiles = profiles;

  // シフトタイプを取得する共通関数
  const getShiftType = (p: any, d: number) => {
    const key = `${p.id}-${year}-${month}-${d}`;
    let type = (demoShifts && demoShifts[key]) || 'O';
    
    // デモモードかつ、実演用アカウント以外で、かつ手動データがない場合
    // 「実演用アカウント」という名前の行は操作用として空けておく
    if (isDemoMode && p.full_name !== '実演用アカウント' && p.id !== realAdminId && !demoShifts[key]) {
      const seed = p.employee_id || p.id || '';
      const dayMod = (d + seed.charCodeAt(seed.length - 1)) % 4;
      if (dayMod === 1) type = 'R';
      else if (dayMod === 2) type = 'L';
      else type = 'O';
    }
    return type;
  };

  const renderBadge = (type: string, isClickable = false) => {
    let color = '#64748b';
    let bg = '#f1f5f9';
    let label = 'O';

    if (type === 'R') { color = '#10b981'; bg = '#ecfdf5'; label = 'R'; }
    if (type === 'L') { color = '#f59e0b'; bg = '#fffbeb'; label = 'L'; }

    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', borderRadius: '6px',
        fontSize: '13px', fontWeight: 'bold', color, background: bg,
        border: `1px solid ${bg === '#f1f5f9' ? '#e2e8f0' : 'transparent'}`,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s',
        transform: isClickable ? 'scale(1.1)' : 'none',
        boxShadow: isClickable ? '0 2px 5px rgba(0,0,0,0.15)' : 'none'
      }}>
        {label}
      </span>
    );
  };

  const handleBulkGenerate = () => {
    if (!confirm('設定済みの「基本パターン」に基づいて、今月1ヶ月分のシフトを一括生成しますか？\n（手動で修正した箇所も上書きされます）')) return;

    const updates: any = {};
    let count = 0;
    filteredProfiles.forEach(p => {
      const pattern = shiftPatterns[p.id];
      if (!pattern) return;

      daysArray.forEach(d => {
        const wIdx = getWeekdayIndex(d);
        const type = pattern[wIdx];
        if (type && type !== '-') {
          updates[`${p.id}-${year}-${month}-${d}`] = type;
          count++;
        }
      });
    });

    if (count > 0) {
      onBulkUpdateShifts(updates);
    } else {
      alert('基本パターンが設定されている社員がいません。「パターン設定」から設定を行ってください。');
    }
  };

  const savePatterns = () => {
    setShiftPatterns(tempPatterns);
    setIsPatternModalOpen(false);
  };

  const handleCellClick = (e: React.MouseEvent, pId: string, day: number) => {
    if (!isEditMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ pId, day, x: rect.left, y: rect.top });
  };

  const dailyStats = daysArray.map(d => {
    let countR = 0;
    let countL = 0;
    filteredProfiles.forEach((p: any) => {
      const type = getShiftType(p, d);
      if (type === 'R') countR++;
      else if (type === 'L') countL++;
    });
    return { d, countR, countL };
  });

  const EDIT_COLOR = '#10b981'; 
  const VIEW_COLOR = '#1e293b'; 

  return (
    <section className="admin-section active" style={{ padding: '20px 40px', position: 'relative', paddingBottom: isEditMode ? '120px' : '20px' }}>
      
      {/* 統合ヘッダーバー */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        background: 'white', padding: '12px 25px', borderRadius: '16px', 
        border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>月間シフト管理</div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setIsPatternModalOpen(true)}
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              ⚙️ パターン設定
            </button>
            <button 
              onClick={handleBulkGenerate}
              style={{ background: '#3b82f6', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}
            >
              ✨ パターンから生成
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <button onClick={() => { setIsEditMode(false); setPopover(null); }} style={{ padding: '8px 18px', borderRadius: '9px', border: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', background: !isEditMode ? VIEW_COLOR : 'transparent', color: !isEditMode ? 'white' : '#64748b' }}>👁️ 閲覧中</button>
          <button onClick={() => setIsEditMode(true)} style={{ padding: '8px 18px', borderRadius: '9px', border: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', background: isEditMode ? EDIT_COLOR : 'transparent', color: isEditMode ? 'white' : '#64748b' }}>✏️ 編集モード</button>
        </div>
      </div>

      {/* 年月表示 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b' }}>{year}年 {month + 1}月</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onDateChange(new Date(year, month - 1, 1))} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>前月</button>
          <button onClick={() => onDateChange(new Date())} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>今月</button>
          <button onClick={() => onDateChange(new Date(year, month + 1, 1))} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>次月</button>
        </div>
      </div>

      {/* テーブル */}
      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '16px', border: isEditMode ? `2px solid ${EDIT_COLOR}` : '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '20px', textAlign: 'left', minWidth: '150px', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 10 }}>氏名</th>
              {daysArray.map(d => (
                <th key={d} style={{ padding: '10px', textAlign: 'center', minWidth: '45px', borderBottom: '1px solid #e2e8f0', color: isSunday(d) ? '#ef4444' : isSaturday(d) ? '#3b82f6' : '#64748b' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{d}</div>
                  <div style={{ fontSize: '10px' }}>{weekdays[getWeekdayIndex(d)]}</div>
                </th>
              ))}
              <th style={{ padding: '10px', background: '#f1f5f9', textAlign: 'center' }}>集計</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((p: any, idx: number) => {
              let cR = 0, cL = 0, cO = 0;
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 !== 0 ? '#f4fcf7' : 'white', transition: 'background 0.2s' }}>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold', position: 'sticky', left: 0, background: idx % 2 !== 0 ? '#f4fcf7' : 'white', zIndex: 5, borderRight: '1px solid #f1f5f9' }}>{p.full_name}</td>
                  {daysArray.map(d => {
                    const type = getShiftType(p, d);
                    if (type === 'R') cR++; else if (type === 'L') cL++; else cO++;
                    return (
                      <td key={d} onClick={(e) => handleCellClick(e, p.id, d)} style={{ textAlign: 'center', padding: '10px 2px', cursor: isEditMode ? 'pointer' : 'default' }}>
                        {renderBadge(type, isEditMode)}
                      </td>
                    );
                  })}
                  <td style={{ padding: '10px', textAlign: 'center', background: '#f8fafc', fontSize: '12px' }}>
                    <span style={{color: '#10b981'}}>{cR}</span>/<span style={{color: '#f59e0b'}}>{cL}</span>/<span style={{color: '#64748b'}}>{cO}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
            <tr style={{ background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
              <td style={{ padding: '15px 20px', fontWeight: '800', color: '#475569', background: '#f1f5f9', position: 'sticky', left: 0 }}>日別人員 合計</td>
              {dailyStats.map(s => (
                <td key={s.d} style={{ textAlign: 'center', padding: '10px 5px', fontSize: '11px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#10b981' }}>R: {s.countR}</div>
                  <div style={{ color: '#f59e0b' }}>L: {s.countL}</div>
                </td>
              ))}
              <td style={{ background: '#e2e8f0' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* パターン設定モーダル */}
      {isPatternModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'white', width: '900px', borderRadius: '24px', padding: '35px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'popIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>⚙️ シフト基本パターンの設定</h2>
              <button onClick={() => setIsPatternModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '30px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '15px', textAlign: 'left' }}>社員名</th>
                    {weekdays.map((w, i) => <th key={i} style={{ padding: '10px', color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#1e293b' }}>{w}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>{p.full_name}</td>
                      {weekdays.map((_, i) => (
                        <td key={i} style={{ padding: '10px', textAlign: 'center' }}>
                          <select 
                            value={(tempPatterns[p.id] && tempPatterns[p.id][i]) || 'O'}
                            onChange={(e) => setTempPatterns({ ...tempPatterns, [p.id]: { ...tempPatterns[p.id], [i]: e.target.value } })}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                          >
                            <option value="R">R (日勤)</option>
                            <option value="L">L (遅番)</option>
                            <option value="O">O (休み)</option>
                            <option value="-">未設定</option>
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setIsPatternModalOpen(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={savePatterns} style={{ padding: '12px 35px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>設定を保存する</button>
            </div>
          </div>
        </div>
      )}

      {/* 編集ポップオーバー */}
      {popover && (
        <>
          <div onClick={() => setPopover(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }} />
          <div style={{ 
            position: 'fixed', top: popover.y - 100, left: popover.x - 70, 
            background: VIEW_COLOR, borderRadius: '20px', padding: '18px', 
            display: 'flex', gap: '18px', zIndex: 1001, 
            boxShadow: '0 15px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
            animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
          }}>
            {['R', 'L', 'O'].map(t => (
              <button key={t} onClick={() => { onUpdateShift(popover.pId, popover.day, t); setPopover(null); }} style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <span style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  width: '55px', height: '55px', borderRadius: '12px', 
                  fontSize: '26px', fontWeight: '900', cursor: 'pointer', 
                  color: t === 'R' ? '#10b981' : t === 'L' ? '#f59e0b' : '#64748b',
                  background: t === 'R' ? '#ecfdf5' : t === 'L' ? '#fffbeb' : '#f1f5f9',
                }}>{t}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* 編集モード終了ボタン (フローティング) */}
      {isEditMode && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '240px', right: 0, zIndex: 1000,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none'
        }}>
          <button 
            onClick={() => {
              setIsEditMode(false);
              setPopover(null);
              if (showToast) showToast('シフトの変更内容を確定しました', 'success');
            }}
            style={{
              pointerEvents: 'auto',
              background: EDIT_COLOR, color: 'white', padding: '15px 40px', borderRadius: '50px',
              fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '10px',
              animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            <span style={{ fontSize: '22px' }}>💾</span> 編集モードを終了して保存
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </section>
  );
}
