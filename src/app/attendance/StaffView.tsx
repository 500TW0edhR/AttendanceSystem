'use client';
import React, { useState, useEffect } from 'react';

export default function StaffView({ showToast, userEmail, userId, supabase, isDemoMode }: any) {
  const [activeTab, setActiveTab] = useState('home');
  const [requestSubTab, setRequestSubTab] = useState('form');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateString, setCurrentDateString] = useState<string>('');
  const [todayRecord, setTodayRecord] = useState<any>(null);
  
  // 実データ用ステート
  const [history, setHistory] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // モックデータ（デモモード用）
  const mockShifts = [
    { date: '5/1', day: '金', time: '09:00 - 18:00', type: '日勤', color: 'var(--primary)' },
    { date: '5/2', day: '土', time: '13:00 - 22:00', type: '遅番', color: '#a855f7' },
    { date: '5/3', day: '日', time: '-', type: '公休', color: 'var(--gray)' },
    { date: '5/4', day: '月', time: '09:00 - 18:00', type: '日勤', color: 'var(--primary)' },
    { date: '5/5', day: '火', time: '09:00 - 18:00', type: '日勤', color: 'var(--primary)' },
    { date: '5/8', day: '金', time: '09:00 - 18:00', type: '日勤', color: 'var(--primary)' },
    { date: '5/9', day: '土', time: '13:00 - 22:00', type: '遅番', color: '#a855f7' },
  ];

  const calendarDays: any[] = [];
  const startOffset = 5; // 5/1 is Friday
  const daysInMonth = 31;
  const holidays = ['5/3', '5/4', '5/5', '5/6'];
  for (let i = 0; i < startOffset; i++) calendarDays.push({ date: 26 + i, isCurrentMonth: false, fullDate: `4/${26 + i}`, isHoliday: false, dayOfWeek: i });
  for (let i = 1; i <= daysInMonth; i++) {
    const isHoliday = holidays.includes(`5/${i}`);
    const dateObj = new Date(2026, 4, i);
    const dayOfWeek = dateObj.getDay();
    let shiftData = null;
    if ([1, 4, 5, 8, 11, 12, 14, 15, 18, 19, 21, 22, 25, 26, 28, 29].includes(i)) shiftData = { type: '日勤', color: 'var(--primary)' };
    else if ([2, 9, 16, 23, 30].includes(i)) shiftData = { type: '遅番', color: '#a855f7' };
    else if ([3, 6, 7, 10, 13, 17, 20, 24, 27, 31].includes(i)) shiftData = { type: '公休', color: 'var(--gray)' };
    calendarDays.push({ date: i, isCurrentMonth: true, fullDate: `5/${i}`, isHoliday, dayOfWeek, shift: shiftData });
  }
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) calendarDays.push({ date: i, isCurrentMonth: false, fullDate: `6/${i}`, isHoliday: false, dayOfWeek: (calendarDays[calendarDays.length - 1].dayOfWeek + 1) % 7 });

  const shiftLegend = [
    { type: '日勤', time: '09:00 - 18:00', color: 'var(--primary)' },
    { type: '遅番', time: '13:00 - 22:00', color: '#a855f7' },
    { type: '公休', time: '休日', color: 'var(--gray)' }
  ];

  const mockHistory = [
    { date: '5/3', in: '08:55', out: '18:05', status: '正常' },
    { date: '5/2', in: '09:02', out: '19:30', status: '残業' },
    { date: '5/1', in: '08:50', out: '18:10', status: '正常' },
  ];

  const mockRequests = [
    { date: '5/10', type: '有給休暇', status: '保留', reason: '私用のため' },
    { date: '5/1', type: '残業申請', status: '承認済', reason: '業務多忙につき2h' },
  ];

  const mockNotices = [
    { date: '2026/05/04', title: '⚠️ 【至急】昨日の退勤打刻が漏れています', isNew: true },
    { date: '2026/05/01', title: '5月分シフト確定のお知らせ', isNew: false },
    { date: '2026/04/28', title: '【重要】有給休暇の計画的付与について', isNew: false },
  ];

  const displayName = isDemoMode ? 'デモ太郎 (No.9527)' : (userEmail ? userEmail.split('@')[0] : 'ゲスト');

  // シフト用ステート
  const [dbShifts, setDbShifts] = useState<any[]>([]);

  // 実データ取得
  const fetchData = async () => {
    if (isDemoMode) {
      setHistory(mockHistory);
      setRequests(mockRequests);
      setNotices(mockNotices);
      return;
    }
    setIsLoading(true);
    try {
      // 勤怠履歴取得
      const { data: hData } = await supabase.from('attendances').select('*').eq('user_id', userId).order('target_date', { ascending: false }).limit(20);
      if (hData) setHistory(hData.map((h: any) => ({ date: h.target_date.split('-').slice(1).join('/'), in: h.punch_in || '-', out: h.punch_out || '-', status: h.status })));

      // 申請履歴取得
      const { data: rData } = await supabase.from('applications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (rData) setRequests(rData.map((r: any) => ({ date: r.target_date ? r.target_date.split('-').slice(1).join('/') : '-', type: r.type, status: r.status === 'approved' ? '承認済' : r.status === 'rejected' ? '却下' : '保留', reason: r.reason })));

      // シフト取得
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data: sData } = await supabase.from('shifts').select('*').eq('user_id', userId).gte('target_date', firstDay).lte('target_date', lastDay);
      if (sData) setDbShifts(sData);

      // お知らせ取得
      const { data: nData } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5);
      if (nData) setNotices(nData.map((n: any) => ({ date: n.created_at.split('T')[0], title: n.title, isNew: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 表示用シフトデータの加工
  const currentShifts = isDemoMode ? mockShifts : dbShifts.map(s => {
    const d = new Date(s.target_date);
    const dayNames = ['日','月','火','水','木','金','土'];
    return {
      date: `${d.getMonth()+1}/${d.getDate()}`,
      day: dayNames[d.getDay()],
      time: s.shift_type === 'R' ? '09:00 - 18:00' : s.shift_type === 'L' ? '13:00 - 22:00' : '-',
      type: s.shift_type === 'R' ? '日勤' : s.shift_type === 'L' ? '遅番' : '公休',
      color: s.shift_type === 'R' ? 'var(--primary)' : s.shift_type === 'L' ? '#a855f7' : 'var(--gray)'
    };
  });

  const currentCalendarDays = isDemoMode ? calendarDays : (() => {
    const days: any[] = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 前月分
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(year, month, -i);
      days.unshift({ date: d.getDate(), isCurrentMonth: false, dayOfWeek: d.getDay() });
    }
    // 当月分
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      const shiftObj = dbShifts.find(s => s.target_date === dateStr);
      let shiftData = null;
      if (shiftObj) {
        shiftData = { 
          type: shiftObj.shift_type === 'R' ? '日勤' : shiftObj.shift_type === 'L' ? '遅番' : '公休', 
          color: shiftObj.shift_type === 'R' ? 'var(--primary)' : shiftObj.shift_type === 'L' ? '#a855f7' : 'var(--gray)' 
        };
      }
      days.push({ date: i, isCurrentMonth: true, dayOfWeek: d.getDay(), shift: shiftData });
    }
    // 翌月分
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: i, isCurrentMonth: false, dayOfWeek: d.getDay() });
    }
    return days;
  })();

  useEffect(() => {
    setCurrentDateString(new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }));
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 1000);
    fetchData();
    return () => clearInterval(timer);
  }, [userId, isDemoMode]);

  useEffect(() => {
    const fetchToday = async () => {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const todayDate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
      const { data } = await supabase.from('attendances').select('*').eq('user_id', userId).eq('target_date', todayDate).eq('is_demo', isDemoMode).maybeSingle();
      if (data) setTodayRecord(data); else setTodayRecord(null);
    };
    fetchToday();
  }, [userId, supabase, isDemoMode]);

  const punchMark = async (type: string) => {
    if (type === 'absent') { setActiveTab('request'); return; }
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const tzoffset = now.getTimezoneOffset() * 60000;
    const todayDate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

    if (type === 'in') {
      if (todayRecord?.punch_in) { showToast("出勤打刻済みです", 'warning'); return; }
      const { data, error } = await supabase.from('attendances').insert({ user_id: userId, target_date: todayDate, punch_in: timeStr, status: '勤務中', is_demo: isDemoMode }).select().single();
      if (!error) { setTodayRecord(data); showToast(`おはようございます！出勤：${timeStr}`, 'success'); fetchData(); }
    } else if (type === 'out') {
      if (!todayRecord?.punch_in) { showToast("先に出勤打刻を行ってください", 'danger'); return; }
      if (todayRecord?.punch_out) { showToast("退勤打刻済みです", 'warning'); return; }
      const { data, error } = await supabase.from('attendances').update({ punch_out: timeStr, status: '退勤済' }).eq('id', todayRecord.id).select().single();
      if (!error) { setTodayRecord(data); showToast(`お疲れ様でした！退勤：${timeStr}`, 'success'); fetchData(); }
    }
  };

  const submitRequest = async (e: any) => {
    e.preventDefault();
    
    // デバッグ用：最初の反応を確認
    alert("送信ボタンが押されました");
    
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const type = formData.get('type') as string;
      const date = formData.get('date') as string;
      const reason = formData.get('reason') as string;

      alert(`データ確認:\n種類: ${type}\n日付: ${date}\n理由: ${reason}`);

      if (!date) {
        alert("エラー: 対象日が入力されていません");
        setIsLoading(false);
        return;
      }

      showToast("送信中...", "info");

      if (isDemoMode) {
        alert("デモモードで動作中");
        showToast("デモモード：申請を送信しました", "success");
        setRequestSubTab('list');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.from('applications').insert({
        user_id: userId,
        type,
        target_date: date,
        // reason: reason || '', // 一旦コメントアウトして原因を切り分け
        status: 'pending'
      }).select();

      if (error) {
        console.error('Submission error:', error);
        alert(`送信失敗(Supabaseエラー):\n${error.message}\nCode: ${error.code}`);
        showToast(`送信失敗: ${error.message}`, "danger");
      } else {
        alert("送信成功！データベースに保存されました");
        showToast("申請を送信しました", "success");
        fetchData();
        setRequestSubTab('list');
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      alert(`予期せぬエラーが発生しました:\n${err.message}`);
      showToast(`予期せぬエラー: ${err.message}`, "danger");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      return (
        <div className="screen active">
          <div className="btn-wrapper">
            <button className="btn-rect" style={{ background: 'var(--success)', opacity: todayRecord?.punch_in && !todayRecord?.punch_out ? 0.6 : 1 }} onClick={() => punchMark('in')}>
              {todayRecord?.punch_in ? `出勤済 (${todayRecord.punch_in})` : '出 勤'}
            </button>
            <button className="btn-rect" style={{ background: 'var(--danger)', opacity: todayRecord?.punch_out ? 0.6 : 1 }} onClick={() => punchMark('out')}>
              {todayRecord?.punch_out ? `退勤済 (${todayRecord.punch_out})` : '退 勤'}
            </button>
            <button className="btn-rect" style={{ background: 'var(--gray)' }} onClick={() => punchMark('absent')}>欠 勤</button>
          </div>
          <button className="btn-shortcut" onClick={() => setActiveTab('request')}>⚠️ 交通費・中抜け・直行直帰の申請はこちら</button>
          <div className="card kpi-container" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div className="kpi-item"><small style={{ color: 'var(--gray)' }}>累計労働</small><br /><strong>145.0h</strong></div>
            <div style={{ borderLeft: '1px solid #eee' }}></div>
            <div className="kpi-item"><small style={{ color: 'var(--gray)' }}>今月の残業</small><br /><strong style={{ color: 'var(--danger)' }}>12.5h</strong></div>
          </div>
        </div>
      );
    }

    if (activeTab === 'shift') {
      return (
        <div className="screen active">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: 'var(--dark)' }}>📅 シフト予定表</h3>
            <div className="shift-legend-desktop">
              {shiftLegend.map((leg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: leg.color }}></div>
                  <span>{leg.type} <small style={{ color: 'var(--gray)', fontWeight: 'normal' }}>({leg.time})</small></span>
                </div>
              ))}
            </div>
          </div>
          <div className="card shift-list-mobile" style={{ padding: 0, overflow: 'hidden' }}>
            {currentShifts.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--gray)', padding: '20px' }}>シフト予定はありません</p> : 
              currentShifts.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: i !== currentShifts.length - 1 ? '1px solid #eee' : 'none' }}>
                  <div style={{ width: '45px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{s.date}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray)' }}>({s.day})</div>
                  </div>
                  <div style={{ marginLeft: '15px', flex: 1, fontSize: '15px', fontWeight: 'bold' }}>{s.time}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white', background: s.color, padding: '4px 10px', borderRadius: '20px' }}>{s.type}</div>
                </div>
              ))
            }
          </div>
          <div className="card shift-calendar-desktop" style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div className="calendar-grid">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                <div key={day} className={`cal-header ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{day}</div>
              ))}
              {currentCalendarDays.map((d: any, i: number) => (
                <div key={i} className={`cal-cell ${!d.isCurrentMonth ? 'out-month' : ''} ${d.dayOfWeek === 0 || d.isHoliday ? 'holiday' : d.dayOfWeek === 6 ? 'saturday' : ''}`}>
                  <div className="cal-date">{d.date}</div>
                  {d.shift && <div className="cal-shift-dot" style={{ background: d.shift.color }} title={`${d.shift.type}`}></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'request') {
      return (
        <div className="screen active narrow-content">
          <div className="sub-tab-switcher">
            <button className={`sub-tab-btn ${requestSubTab === 'form' ? 'active' : ''}`} onClick={() => setRequestSubTab('form')}>新規申請</button>
            <button className={`sub-tab-btn ${requestSubTab === 'list' ? 'active' : ''}`} onClick={() => setRequestSubTab('list')}>提出済み</button>
          </div>
          {requestSubTab === 'form' ? (
            <div className="fade-in">
              <h3 style={{ marginTop: 0, color: 'var(--dark)' }}>📩 新規申請</h3>
              <form className="card" onSubmit={submitRequest}>
                <div className="form-group">
                  <label>申請の種類</label>
                  <select name="type">
                    <option>有給休暇</option>
                    <option>残業申請</option>
                    <option>打刻修正依頼</option>
                    <option>遅刻・早退・中抜け・欠勤</option>
                    <option>交通費精算</option>
                  </select>
                </div>
                <div className="form-group"><label>対象日</label><input type="date" name="date" required /></div>
                <div className="form-group"><label>理由・詳細</label><textarea name="reason" placeholder="例：私用のため" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', height: '80px', resize: 'none', boxSizing: 'border-box' }}></textarea></div>
                <button type="submit" className="btn-rect submit-btn-centered" style={{ background: 'var(--primary)', minHeight: '55px', fontSize: '1.1rem', margin: '20px auto 0' }}>申請を送信する</button>
              </form>
            </div>
          ) : (
            <div className="fade-in">
              <h3 style={{ marginTop: 0, color: 'var(--dark)' }}>📋 提出済みの申請</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {requests.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--gray)', padding: '20px' }}>提出済みの申請はありません</p> : 
                  requests.map((r, i) => (
                    <div key={i} className="card" style={{ marginBottom: 0, padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{r.type} <span style={{ fontSize: '12px', color: 'var(--gray)', marginLeft: '10px' }}>{r.date}</span></div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{r.reason}</div>
                      </div>
                      <div className="badge-status" style={{ background: r.status === '承認済' ? 'var(--success)' : r.status === '却下' ? 'var(--danger)' : 'var(--warning)' }}>{r.status}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="screen active narrow-content">
          <h3 style={{ marginTop: 0, color: 'var(--dark)' }}>📑 勤務履歴 (5月)</h3>
          <table className="data-table">
            <thead>
              <tr><th>日付</th><th style={{ textAlign: 'center' }}>出勤</th><th style={{ textAlign: 'center' }}>退勤</th><th style={{ textAlign: 'right' }}>状態</th></tr>
            </thead>
            <tbody>
              {history.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--gray)' }}>履歴はありません</td></tr> : 
                history.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 'bold' }}>{h.date}</td>
                    <td style={{ textAlign: 'center' }}>{h.in}</td>
                    <td style={{ textAlign: 'center' }}>{h.out}</td>
                    <td style={{ textAlign: 'right', color: h.status === '残業' ? 'var(--danger)' : 'var(--gray)' }}>{h.status}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'notice') {
      return (
        <div className="screen active narrow-content">
          <h3 style={{ marginTop: 0, color: 'var(--dark)' }}>🔔 お知らせ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notices.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--gray)', padding: '20px' }}>お知らせはありません</p> : 
              notices.map((n, i) => (
                <div key={i} className="card" style={{ marginBottom: 0, position: 'relative', display: 'flex', gap: '15px' }}>
                  {n.isNew && <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', position: 'absolute', top: '15px', right: '15px' }} />}
                  <div style={{ fontSize: '20px' }}>📣</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{n.date}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <header className="clock-section">
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{displayName} さん</div>
          <div style={{ fontSize: '14px', color: 'var(--gray)' }}>{currentDateString}</div>
        </div>
        <div className="clock-time">{currentTime || '...'}</div>
      </header>
      <div className="staff-content" style={{ display: 'block' }}>{renderContent()}</div>
      <nav className="tab-bar">
        {[
          { id: 'home', label: 'ホーム', icon: '🏠' },
          { id: 'shift', label: 'シフト', icon: '📅' },
          { id: 'request', label: '申請', icon: '📩' },
          { id: 'history', label: '履歴', icon: '📑' },
          { id: 'notice', label: '通知', icon: '🔔' }
        ].map(tab => (
          <div key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span><br />{tab.label}
          </div>
        ))}
      </nav>
    </>
  );
}
