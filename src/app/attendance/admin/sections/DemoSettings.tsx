'use client';

import React from 'react';
import { setupFullDemo, purgeProductionData } from '@/app/actions/auth';

interface DemoSettingsProps {
  realAdminId: string;
  todayDate: string;
  showToast: (msg: string, type?: string) => void;
}

export default function DemoSettings({
  realAdminId,
  todayDate,
  showToast
}: DemoSettingsProps) {

  const renderTitle = (title: string, subtitle?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{title}</h1>
      {subtitle && <span style={{ fontSize: '24px', color: '#1e293b', fontWeight: '800', marginLeft: '5px' }}>{subtitle}</span>}
    </div>
  );

  return (
    <section className="admin-section active">
      {renderTitle('🧪 デモ環境設定')}
      <div className="card" style={{ padding: '40px', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '25px', fontSize: '20px', fontWeight: 'bold' }}>デモデータ管理</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' 
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>デモ用データの構築</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>実演用のダミー社員と申請データをDBに作成します。</div>
            </div>
            <button 
              onClick={async () => { 
                const res = await setupFullDemo(realAdminId, todayDate); 
                if (res.success) { 
                  showToast('デモデータを構築しました', 'success'); 
                  window.location.reload(); 
                } else {
                  showToast('構築に失敗しました: ' + res.error, 'danger');
                }
              }} 
              className="btn-rect" 
              style={{ background: '#f59e0b', width: '200px', height: '45px', minHeight: 'auto', margin: 0 }}
            >
              構築を実行
            </button>
          </div>

          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' 
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>全てのデータをクリア</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>管理者自身以外のすべてのデータを削除します。</div>
            </div>
            <button 
              onClick={async () => { 
                const res = await purgeProductionData(realAdminId); 
                if (res.success) { 
                  showToast('データをクリアしました', 'success'); 
                  window.location.reload(); 
                } else {
                  showToast('クリアに失敗しました: ' + res.error, 'danger');
                }
              }} 
              className="btn-rect" 
              style={{ background: '#ef4444', width: '200px', height: '45px', minHeight: 'auto', margin: 0 }}
            >
              全クリアを実行
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
