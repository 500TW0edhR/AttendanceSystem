'use client';

import React, { useState, useEffect } from 'react';

export default function ReportAnalysis({ isDemoMode = false }: { isDemoMode?: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [clickedActions, setClickedActions] = useState<string[]>([]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const toggleAction = (type: string) => {
    setClickedActions(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // --- データ定義 ---
  const overtimeRiskData = isDemoMode ? [
    { name: '実演用アカウント', current: 66.7, predicted: 82.5, status: 'danger' },
    { name: '田中 一郎', current: 60.5, predicted: 75.0, status: 'danger' },
    { name: '佐藤 花子', current: 49.3, predicted: 58.2, status: 'warning' },
    { name: '鈴木 次郎', current: 42.6, predicted: 51.0, status: 'warning' },
    { name: '高橋 健二', current: 37.2, predicted: 44.5, status: 'normal' },
  ] : [];

  const complianceItems = isDemoMode ? [
    { label: '休憩時間不足', val: '0件', status: 'safe' },
    { label: '5日有給義務', val: '2名未達成', status: 'warning' },
    { label: '連続勤務制限', val: '0件', status: 'safe' },
    { label: '36協定超過', val: '1名警報', status: 'danger' },
  ] : [
    { label: '休憩時間不足', val: '0件', status: 'safe' },
    { label: '5日有給義務', val: '0名', status: 'safe' },
    { label: '連続勤務制限', val: '0件', status: 'safe' },
    { label: '36協定超過', val: '0名', status: 'safe' },
  ];

  const kpis = isDemoMode ? [
    { label: '平均実働時間', val: '7.8h', trend: '-2%', color: '#3b82f6', note: '前月比' },
    { label: '深夜労働合計', val: '138h', trend: '+5h', color: '#6366f1', note: '22時〜翌5時' },
    { label: '残業アラート', val: '3件', trend: '3名', color: '#ef4444', note: '45h超' },
    { label: '有給消化率', val: '62.5%', trend: '70%', color: '#10b981', note: '目標' },
  ] : [
    { label: '平均実働時間', val: '0h', trend: '0%', color: '#3b82f6', note: '前月比' },
    { label: '深夜労働合計', val: '0h', trend: '0h', color: '#6366f1', note: '22時〜翌5時' },
    { label: '残業アラート', val: '0件', trend: '0名', color: '#ef4444', note: '45h超' },
    { label: '有給消化率', val: '0%', trend: '70%', color: '#10b981', note: '目標' },
  ];

  const actions = isDemoMode ? [
    '「田中 一郎」さんの予測残業が75時間に達します。業務分担を調整してください。',
    '有給休暇の取得率が目標（70%）を下回っています。来週の取得促進を。',
    '深夜労働が特定の曜日に集中しています。シフトパターンの見直しが有効です。',
    '連勤中の2名に対して、産業医面談または休養の指示を推奨します。'
  ] : [
    '現在、至急のアクションは必要ありません。',
    'データが蓄積されると、ここに最適化のアドバイスが表示されます。'
  ];

  const errorData = isDemoMode ? [
    { type: '打刻漏れ', count: 5, action: '本人へ通知' },
    { type: '休憩未取得疑い', count: 3, action: '状況確認' },
    { type: '深夜割増未承認', count: 8, action: '一括承認' },
  ] : [];

  return (
    <section className="admin-section active" style={{ padding: '20px 40px', background: '#f8fafc' }}>
      
      {/* ヘッダー */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: 0 }}>レポート分析ダッシュボード</h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>組織全体の労務コンプライアンスと将来のリスクを可視化します。</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>拠点フィルター:</div>
          <select style={{ padding: '5px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
            <option>全拠点（全国）</option>
            {isDemoMode && <option>東京本社</option>}
            {isDemoMode && <option>大阪支店</option>}
          </select>
        </div>
      </div>

      {/* KPIサマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ 
            background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: kpi.color }} />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '10px' }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: (isDemoMode && kpi.label === '残業アラート' && kpi.val !== '0件') ? '#ef4444' : '#1e293b' }}>{kpi.val}</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: kpi.trend.includes('+') ? '#ef4444' : kpi.trend === '0%' || kpi.trend === '0h' ? '#94a3b8' : '#10b981' }}>
                {kpi.note} {kpi.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px', marginBottom: '30px' }}>
        
        {/* 個人別残業リスク */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>🔥 個人別・残業時間リスク (TOP 5)</h3>
            {isDemoMode && (
              <div style={{ display: 'flex', gap: '15px', fontSize: '11px', fontWeight: 'bold' }}>
                <span style={{ color: '#3b82f6' }}>■ 正常</span>
                <span style={{ color: '#f59e0b' }}>■ 警告(45h)</span>
                <span style={{ color: '#ef4444' }}>■ 危険(60h)</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', minHeight: '200px', justifyContent: overtimeRiskData.length ? 'flex-start' : 'center' }}>
            {overtimeRiskData.length > 0 ? overtimeRiskData.map((u, i) => {
              const barColor = u.current >= 60 ? '#ef4444' : u.current >= 45 ? '#f59e0b' : '#3b82f6';
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{u.name}</span>
                    <span style={{ fontWeight: '900', color: barColor }}>{u.current}h <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>(月末予測: {u.predicted}h)</span></span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '50px', position: 'relative' }}>
                    <div style={{ 
                      width: isLoaded ? `${(u.current / 80) * 100}%` : '0%', 
                      height: '100%', background: barColor, borderRadius: '50px',
                      transition: `width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s`,
                      position: 'absolute', zIndex: 2
                    }} />
                    <div style={{ 
                      width: isLoaded ? `${(u.predicted / 80) * 100}%` : '0%', 
                      height: '100%', background: barColor, borderRadius: '50px', opacity: 0.2,
                      transition: `width 2s ease-out ${i * 0.1}s`,
                      position: 'absolute', zIndex: 1
                    }} />
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>アラート対象のスタッフはいません。</div>
            )}
          </div>
        </div>

        {/* 労基法コンプライアンス */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 25px 0', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>⚖️ 労基法 Compliance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {complianceItems.map((item, i) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '15px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    color: item.status === 'safe' ? '#10b981' : item.status === 'warning' ? '#f59e0b' : '#ef4444',
                    fontSize: '18px'
                  }}>
                    {item.status === 'safe' ? '✓' : item.status === 'warning' ? '▲' : '✕'}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>{item.label}</span>
                </div>
                <span style={{ 
                  fontSize: '14px', fontWeight: '900', 
                  color: item.status === 'safe' ? '#10b981' : item.status === 'warning' ? '#f59e0b' : '#ef4444'
                }}>
                  {item.val}
                </span>
              </div>
            ))}
          </div>
          {isDemoMode && (
            <div style={{ marginTop: '25px', padding: '15px', background: '#fff5f5', borderRadius: '12px', border: '1px solid #feb2b2', display: 'flex', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <div style={{ fontSize: '12px', color: '#c53030', lineHeight: '1.5' }}>
                <strong>健康リスク警告:</strong> 7連勤以上のスタッフが <strong>2名</strong> 検出されました。至急シフトの調整を検討してください。
              </div>
            </div>
          )}
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* 要修正データ */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>📝 要修正データ (月次締め前)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '150px', justifyContent: errorData.length ? 'flex-start' : 'center' }}>
            {errorData.length > 0 ? errorData.map((err, i) => {
              const isClicked = clickedActions.includes(err.type);
              return (
                <div key={i} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '12px 20px', borderBottom: '1px solid #f1f5f9'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{err.type}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: isClicked ? '#94a3b8' : '#ef4444', fontWeight: '900', textDecoration: isClicked ? 'line-through' : 'none' }}>{err.count}件</span>
                    <button 
                      onClick={() => toggleAction(err.type)}
                      style={{ 
                        fontSize: '11px', padding: '6px 15px', borderRadius: '8px', 
                        background: isClicked ? '#10b981' : '#f59e0b', 
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isClicked ? 'none' : '0 4px 10px rgba(245, 158, 11, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {isClicked ? '✓ 完了' : err.action}
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>現在、修正が必要なデータはありません。</div>
            )}
          </div>
        </div>

        {/* 推奨アクション */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💡</span> 今日の推奨アクション
          </h3>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {actions.map((text, i) => (
              <li key={i} style={{ 
                display: 'flex', gap: '12px', fontSize: '14px', lineHeight: '1.5',
                padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>➤</span> {text}
              </li>
            ))}
          </ul>
        </div>

      </div>

    </section>
  );
}
