'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DataIntegration({ showToast }: { showToast: (msg: string, type?: string) => void }) {
  const [selectedSoftware, setSelectedSoftware] = useState<string | null>('freee');
  const [isDragging, setIsDragging] = useState(false);
  const [importType, setImportType] = useState('attendance');
  const [exportMonth, setExportMonth] = useState('2026-05');

  const supabase = createClient();

  const handleExport = async () => {
    const [year, month] = exportMonth.split('-');
    const firstDay = `${exportMonth}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    showToast(`${exportMonth} 分のデータを抽出中...`, "info");

    try {
      const { data, error } = await supabase
        .from('attendances')
        .select('*, profiles(full_name, employee_id)')
        .gte('target_date', firstDay)
        .lte('target_date', lastDay);

      if (error || !data || data.length === 0) {
        showToast(error ? "データ取得に失敗しました" : "対象期間のデータが見つかりません", "danger");
        return;
      }

      // CSV文字列の生成
      const headers = ["社員番号", "氏名", "日付", "出勤", "退勤", "状態"];
      const rows = data.map((h: any) => [
        `"${h.profiles?.employee_id || '-'}"`,
        `"${h.profiles?.full_name || 'ゲスト'}"`,
        `"${h.target_date}"`,
        `"${h.punch_in || '-'}"`,
        `"${h.punch_out || '-'}"`,
        `"${h.status}"`
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // Excel文字化け防止
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `attendance_${exportMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("ダウンロードが完了しました", "success");
    } catch (e) {
      showToast("エラーが発生しました", "danger");
    }
  };

  const softwareList = [
    { id: 'freee', name: 'Freee人事労務', color: '#10b981' },
    { id: 'mf', name: 'マネーフォワード', color: '#f97316' },
    { id: 'yayoi', name: '弥生給与', color: '#3b82f6' },
    { id: 'smarthr', name: 'SmartHR', color: '#0ea5e9' },
  ];

  const renderTitle = (title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{title}</h1>
      <p style={{ color: '#64748b', margin: '0 0 0 10px', alignSelf: 'flex-end', paddingBottom: '4px' }}>
        他システムとのデータ入出力を管理します。
      </p>
    </div>
  );

  return (
    <section className="admin-section active" style={{ padding: '20px 40px', background: '#f8fafc', minHeight: '100vh' }}>
      {renderTitle('データ連携')}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💸</span> 給与計算ソフト専用フォーマット出力
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              ご利用の給与ソフトに合わせた列構成でCSVを出力します。そのままインポートが可能です。
            </p>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
              {softwareList.map(sw => (
                <button 
                  key={sw.id} 
                  onClick={() => setSelectedSoftware(sw.id)}
                  style={{ 
                    flex: 1, padding: '15px 10px', borderRadius: '12px', cursor: 'pointer',
                    border: selectedSoftware === sw.id ? `2px solid ${sw.color}` : '1px solid #e2e8f0',
                    background: selectedSoftware === sw.id ? `${sw.color}10` : 'white',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: sw.color }} />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: selectedSoftware === sw.id ? sw.color : '#64748b' }}>
                    {sw.name}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>対象月</label>
                <input 
                  type="month" 
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} 
                />
              </div>
              <button 
                onClick={handleExport}
                style={{ 
                  background: '#1e293b', color: 'white', border: 'none', padding: '12px 30px', 
                  borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              >
                📥 ダウンロード実行
              </button>
            </div>
          </div>
        </div>

        <div>
          <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'sticky', top: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📤</span> 一括インポート (CSV)
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              他のシステムからデータを移行する場合や、一括でマスタを登録する際に使用します。
            </p>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>インポート対象</label>
            <select 
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '10px' }}
            >
              <option value="attendance">過去の勤怠実績データ</option>
              <option value="staff">社員マスタ新規登録</option>
              <option value="shift">シフト予定表</option>
            </select>

            <div 
              style={{ 
                border: '2px dashed #cbd5e1', background: '#f8fafc',
                borderRadius: '16px', padding: '40px 20px', textAlign: 'center',
                cursor: 'not-allowed'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>📄</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                CSVファイルをここにドロップ
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                (開発中機能です)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
