'use client';

import React, { useState, useEffect } from 'react';

interface ApprovalWorkflowProps {
  isDemoMode: boolean;
  applications: any[];
  selectedApp: any;
  setSelectedApp: (app: any) => void;
  handleUpdateAppStatus: (id: string, status: string, reason?: string) => void;
}

const FIXED_DEMO_APPS = [
  {
    id: 'demo-1',
    profiles: { full_name: '佐藤 花子', employee_id: 'No.0002' },
    title: '遅刻申請',
    type: '遅刻',
    target_date: '2024/10/27',
    status: 'pending',
    details: { 
      reason: 'JR線内での人身事故による運転見合わせのため。遅延証明書添付あり。',
      schedule: '09:00',
      actual: '09:35'
    }
  },
  {
    id: 'demo-2',
    profiles: { full_name: '高橋 健二', employee_id: 'No.0004' },
    title: '中抜け申請',
    type: '中抜け',
    target_date: '2024/10/27',
    status: 'pending',
    details: { 
      reason: '私用外出のため',
      out_time: '11:00',
      return_time: '14:00'
    }
  },
  {
    id: 'demo-3',
    profiles: { full_name: '山本 恵', employee_id: 'No.0007' },
    title: '交通費申請',
    type: '交通費',
    target_date: '2024/10/25',
    status: 'pending',
    details: { 
      reason: '山形出張精算',
      amount: '¥2,400'
    }
  }
];

export default function ApprovalWorkflow({
  isDemoMode,
  applications,
  selectedApp,
  setSelectedApp,
  handleUpdateAppStatus
}: ApprovalWorkflowProps) {

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const displayApps = isDemoMode ? FIXED_DEMO_APPS : applications.filter(a => a.status === 'pending');

  useEffect(() => {
    if (isDemoMode && !selectedApp) {
      setSelectedApp(FIXED_DEMO_APPS[0]);
    }
  }, [isDemoMode, selectedApp]);

  const renderTitle = (title: string) => (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{title}</h1>
    </div>
  );

  const renderAppBadge = (type: string) => {
    let bgColor = '#2563eb';
    if (type === '遅刻') bgColor = '#f87171';
    if (type === '中抜け') bgColor = '#fbbf24';
    if (type === '交通費') bgColor = '#34d399';
    return (
      <span style={{ 
        background: bgColor, color: 'white', padding: '2px 12px', 
        borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' 
      }}>
        {type}
      </span>
    );
  };

  const currentApp = isDemoMode 
    ? (FIXED_DEMO_APPS.find(a => a.id === selectedApp?.id) || selectedApp)
    : selectedApp;

  const handleConfirmReject = () => {
    if (isDemoMode) {
      alert(`「${rejectReason}」という理由で却下を通知しました。`);
    } else {
      handleUpdateAppStatus(currentApp.id, 'rejected', rejectReason);
    }
    setIsRejectModalOpen(false);
    setRejectReason('');
  };

  return (
    <section className="admin-section active" style={{ padding: '40px 40px 20px 40px', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '40px', height: 'calc(100vh - 120px)', alignItems: 'flex-start' }}>
        
        {/* 左側：見出し + リスト */}
        <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {renderTitle(isDemoMode ? '申請承認ワークフロー' : '申請承認')}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '10px' }}>
            {displayApps.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#64748b', borderRadius: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>未処理の申請はありません</div>
              </div>
            ) : (
              displayApps.map(app => (
                <div 
                  key={app.id} 
                  className={`card ${selectedApp?.id === app.id ? 'active' : ''}`} 
                  onClick={() => setSelectedApp(app)} 
                  style={{ 
                    padding: '24px', cursor: 'pointer', 
                    border: selectedApp?.id === app.id ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
                    background: selectedApp?.id === app.id ? '#eff6ff' : 'white',
                    borderRadius: '16px', transition: 'all 0.2s', 
                    boxShadow: selectedApp?.id === app.id ? '0 4px 15px rgba(59, 130, 246, 0.12)' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#1e293b' }}>{app.profiles?.full_name}</span>
                    {renderAppBadge(app.type)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                    {app.target_date?.replace(/-/g, '/')} <br/> 理由：{app.details?.reason?.substring(0, 22)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 右側：詳細表示 */}
        <div style={{ flex: 1, height: '100%' }}>
          {currentApp ? (
            <div className="card" style={{ 
              height: '100%', padding: 0, overflow: 'hidden', 
              display: 'flex', flexDirection: 'column', marginBottom: 0, borderRadius: '24px',
              boxShadow: '0 15px 45px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0'
            }}>
              <div style={{ height: '10px', background: '#3b82f6', width: '100%' }}></div>
              
              <div style={{ padding: '40px 50px 60px 50px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 20px 0' }}>
                  {currentApp.profiles?.full_name}：{currentApp.title}
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '18px', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#64748b', width: '110px' }}>対象日：</span>
                    <span style={{ fontWeight: 'bold' }}>{currentApp.target_date?.replace(/-/g, '/')}</span>
                  </div>
                  
                  {currentApp.type === '遅刻' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#64748b', width: '110px' }}>予定：</span>
                      <span style={{ fontWeight: 'bold' }}>{currentApp.details?.schedule}</span>
                      <span style={{ color: '#94a3b8', margin: '0 15px' }}>→</span>
                      <span style={{ color: '#64748b' }}>実績：</span>
                      <span style={{ fontWeight: 'bold' }}>{currentApp.details?.actual}</span>
                    </div>
                  )}

                  {currentApp.type === '中抜け' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#64748b', width: '110px' }}>外出：</span>
                      <span style={{ fontWeight: 'bold' }}>{currentApp.details?.out_time} ～ {currentApp.details?.return_time}</span>
                    </div>
                  )}

                  {currentApp.type === '交通費' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#64748b', width: '110px' }}>金額：</span>
                      <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '24px' }}>{currentApp.details?.amount}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#64748b', width: '110px', flexShrink: 0 }}>理由：</span>
                    <div style={{ lineHeight: '1.6', fontWeight: '500' }}>{currentApp.details?.reason}</div>
                  </div>

                  <div style={{ 
                    marginTop: '15px', padding: '40px', background: '#f8fafc', 
                    borderRadius: '20px', border: '2px dashed #cbd5e1', 
                    textAlign: 'center', color: '#64748b' 
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', opacity: 0.8 }}>
                      証跡画像：{currentApp.type === '遅刻' ? 'delay_proof.jpg' : currentApp.type === '交通費' ? 'receipt_01.jpg' : 'no_file.png'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: 'auto', paddingTop: '30px' }}>
                  <button 
                    onClick={() => isDemoMode ? alert('承認をシミュレートしました') : handleUpdateAppStatus(currentApp.id, 'approved')} 
                    className="btn-rect" 
                    style={{ background: '#10b981', flex: 1.2, height: '64px', minHeight: 'auto', margin: 0, fontSize: '20px', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)' }}
                  >
                    承認する
                  </button>
                  <button 
                    onClick={() => setIsRejectModalOpen(true)} 
                    className="btn-rect" 
                    style={{ background: '#ef4444', flex: 1, height: '64px', minHeight: 'auto', margin: 0, fontSize: '20px', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}
                  >
                    却下
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ 
              height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
              color: '#64748b', marginBottom: 0, background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '24px'
            }}>
              左側のリストから申請を選択してください
            </div>
          )}
        </div>
      </div>

      {/* 却下理由入力モーダル */}
      {isRejectModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
        }}>
          <div className="card" style={{ 
            width: '500px', padding: '40px', borderRadius: '24px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'modalIn 0.3s ease'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px', color: '#1e293b' }}>
              申請を却下しますか？
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>
              却下する場合、社員へ通知する理由を入力してください。
            </p>
            
            <textarea 
              autoFocus
              placeholder="例：遅延証明書の画像が不鮮明です。再提出をお願いします。"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ 
                width: '100%', height: '150px', padding: '15px', borderRadius: '12px',
                border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '16px',
                resize: 'none', marginBottom: '30px', outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="btn-rect" 
                style={{ background: '#f1f5f9', color: '#64748b', flex: 1, height: '50px', minHeight: 'auto', margin: 0, fontSize: '16px', borderRadius: '12px' }}
              >
                キャンセル
              </button>
              <button 
                onClick={handleConfirmReject}
                className="btn-rect" 
                style={{ background: '#ef4444', color: 'white', flex: 1.5, height: '50px', minHeight: 'auto', margin: 0, fontSize: '16px', borderRadius: '12px', fontWeight: 'bold' }}
              >
                理由を添えて却下
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </section>
  );
}
