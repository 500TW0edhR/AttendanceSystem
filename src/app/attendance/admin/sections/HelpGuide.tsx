'use client';

import React, { useState } from 'react';

export default function HelpGuide() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showFullManual, setShowFullManual] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      category: '勤怠管理',
      question: 'スタッフの打刻ミスを修正するには？',
      answer: '「勤怠一覧」タブから該当スタッフを選択し、右端の「✏️詳細編集」ボタンを押してください。出勤・退勤時刻を修正して保存すると、即座に集計に反映されます。'
    },
    {
      category: 'シフト管理',
      question: '1ヶ月分のシフトを一括で作成するには？',
      answer: '「シフト管理」タブの「⚙️ パターン設定」から基本シフトを登録し、その後「✨ パターンから生成」をクリックしてください。'
    },
    {
      category: 'データ連携',
      question: '給与計算ソフト用のデータを出力したい',
      answer: '「データ連携」タブの「給与計算ソフト専用フォーマット出力」から、お使いのソフトを選択してダウンロードしてください。'
    }
  ];

  const ActionButtons = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }} className="no-print">
      <button onClick={() => window.print()} style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🖨️</span> PDF保存・印刷する
      </button>
      <button onClick={() => setShowFullManual(false)} style={{ padding: '10px 25px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>
        ✕ 閉じる
      </button>
    </div>
  );

  const chapters = [
    { id: 'ch1', title: '第1章：初期設定' },
    { id: 'ch2', title: '第2章：勤怠管理' },
    { id: 'ch3', title: '第3章：社員マスタ' },
    { id: 'ch4', title: '第4章：シフト管理' },
    { id: 'ch5', title: '第5章：レポート分析' },
    { id: 'ch6', title: '第6章：データ連携' }
  ];

  return (
    <section className="admin-section active" style={{ padding: '20px 40px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: 0 }}>使い方ガイド</h1>
      </div>

      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '30px', textAlign: 'center' }}>🚀 運用開始までのクイック・3ステップ</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '30px', left: '10%', right: '10%', height: '4px', background: '#f1f5f9', zIndex: 0 }} />
          {[
            { n: 1, t: '社員マスタの登録', c: '#3b82f6', d: 'CSVでスタッフ情報を一括登録します。' },
            { n: 2, t: 'シフトパターンの設定', c: '#a855f7', d: '基本パターンから1ヶ月分を一括生成します。' },
            { n: 3, t: '打刻＆運用スタート', c: '#10b981', d: 'スタッフにアプリを共有し、運用を開始します。' }
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: s.c, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', boxShadow: `0 4px 10px ${s.c}40` }}>{s.n}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>{s.t}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '0 20px', lineHeight: '1.6' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '25px' }}>📖 よくあるご質問 (FAQ)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: openFaq === index ? '#f8fafc' : 'white' }}>
                <button onClick={() => toggleFaq(index)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '18px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}><span style={{ color: '#3b82f6', marginRight: '10px' }}>Q.</span>{faq.question}</span>
                  <span>{openFaq === index ? '▲' : '▼'}</span>
                </button>
                {openFaq === index && <div style={{ padding: '0 20px 20px 50px', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '24px', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>📑</div>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '800' }}>詳細操作マニュアル</h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '25px' }}>全機能の操作手順を網羅した詳細ガイドです。<br />PDFとして保存し、配布することも可能です。</p>
            <button onClick={() => setShowFullManual(true)} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
              マニュアルを全画面表示
            </button>
          </div>
        </div>
      </div>

      {/* フルマニュアル・モーダル */}
      {showFullManual && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 9999, overflowY: 'auto' }} className="printable-manual">
          
          <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            
            {/* 左固定ナビゲーション */}
            <aside className="no-print" style={{ 
              width: '280px', borderRight: '1px solid #e2e8f0', padding: '40px 30px', 
              position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '20px' }}>目次 - INDEX</div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chapters.map(ch => (
                  <a key={ch.id} href={`#${ch.id}`} style={{ 
                    fontSize: '14px', color: '#475569', textDecoration: 'none', padding: '10px 12px', 
                    borderRadius: '8px', transition: 'all 0.2s', fontWeight: 'bold'
                  }} className="nav-item">
                    {ch.title}
                  </a>
                ))}
              </nav>
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <button onClick={() => setShowFullManual(false)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>✕ ガイドを閉じる</button>
              </div>
            </aside>

            {/* メインコンテンツ */}
            <div style={{ flex: 1, padding: '40px 60px' }}>
              <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                
                <ActionButtons />

                {/* 表紙 */}
                <header style={{ textAlign: 'center', marginBottom: '80px', paddingTop: '40px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6', letterSpacing: '0.2em', marginBottom: '10px' }}>ATTENDANCE MANAGEMENT SYSTEM</div>
                  <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 20px 0', color: '#1e293b' }}>管理者用 操作詳細ガイド</h1>
                  <p style={{ fontSize: '18px', color: '#64748b' }}>〜 スムーズな導入と運用のための全手順書 〜</p>
                  <div style={{ width: '100px', height: '4px', background: '#3b82f6', margin: '40px auto' }}></div>
                </header>

                {/* 第1章 */}
                <section id="ch1" style={{ marginBottom: '80px', scrollMarginTop: '40px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '25px' }}>
                    🚀 第1章：運用開始までの初期設定
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>1. 社員マスタの登録</strong>
                      <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>「データ連携」タブ ＞ 「インポート対象：社員マスタ」を選択。テンプレートCSVをダウンロードし、スタッフ情報を入力してアップロードします。これで全スタッフのログインIDが発行されます。</p>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>2. 基本シフトパターンの設定</strong>
                      <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>「シフト管理」タブ ＞ 「⚙️パターン設定」を開き、スタッフごとに「月曜は日勤、火曜は休み」といった基本パターンを登録します。</p>
                    </div>
                  </div>
                </section>

                {/* 第2章 */}
                <section id="ch2" style={{ marginBottom: '80px', scrollMarginTop: '40px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '25px' }}>
                    📊 第2章：勤怠一覧・管理（修正手順）
                  </h2>
                  <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <ol style={{ lineHeight: '2', fontSize: '15px' }}>
                      <li><strong>対象の選択</strong>: 「勤怠一覧」で修正したい行の「✏️詳細編集」ボタンを押します。</li>
                      <li><strong>時刻の入力</strong>: 出勤・退勤時刻を `09:00` のような形式で直接入力します。</li>
                      <li><strong>保存</strong>: 保存ボタンを押すと、即座にその日の労働時間が再計算されます。</li>
                    </ol>
                  </div>
                </section>

                {/* 第3章 */}
                <section id="ch3" style={{ marginBottom: '80px', scrollMarginTop: '40px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '25px' }}>
                    👥 第3章：社員マスタ（情報の更新と詳細）
                  </h2>
                  <div style={{ lineHeight: '1.8', fontSize: '15px' }}>
                    <p><strong>・情報の編集モーダル</strong><br />社員リストの行をクリックすると、詳細編集モーダルが開きます。ここでは所属拠点の変更や、現在の雇用ステータスの確認が可能です。</p>
                    <p><strong>・新入社員の追加</strong><br />個別追加だけでなく、「データ連携」タブからのCSV一括インポートを利用することで、数百名規模の登録も数秒で完了します。</p>
                  </div>
                </section>

                {/* 第4章 */}
                <section id="ch4" style={{ marginBottom: '80px', scrollMarginTop: '40px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '25px' }}>
                    📅 第4章：シフト管理（自動生成と個別変更）
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontWeight: 'bold' }}>【一括生成機能】</h4>
                      <p style={{ fontSize: '14px', color: '#475569' }}>「✨ パターンから生成」を押すと、登録済みの曜日パターンに従って1ヶ月分が自動埋めされます。</p>
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 'bold' }}>【個別変更（編集モード）】</h4>
                      <p style={{ fontSize: '14px', color: '#475569' }}>右上の「📝 編集モード」をONにして、カレンダーのセルをクリックしてください。クリックのたびに「日勤 → 遅番 → 休み」と切り替わります。</p>
                    </div>
                  </div>
                </section>

                {/* 第5章 */}
                <section id="ch5" style={{ marginBottom: '80px', scrollMarginTop: '40px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '25px' }}>
                    📈 第5章：レポート分析（予測データの見方）
                  </h2>
                  <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '16px', marginBottom: '20px' }}>
                    <strong style={{ color: '#3b82f6', fontSize: '16px' }}>■ 月末の残業着地予測（半透明のバー）</strong>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>濃い色のバーは「現時点の実績」、半透明のバーは「このままのシフトで月末を迎えた場合の予測値」です。月末に36協定を超えるリスクがある人を事前に把握し、対策が可能です。</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '16px' }}>
                    <strong style={{ color: '#10b981', fontSize: '16px' }}>■ 労基法コンプライアンス・チェック</strong>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>休憩時間の未取得、5日間の有給取得義務の進捗、連勤日数などを自動監視します。赤い✕印の項目は、法的にリスクがあるため優先的に改善が必要です。</p>
                  </div>
                </section>

                {/* 第6章 */}
                <section id="ch6" style={{ marginBottom: '80px', scrollMarginTop: '40px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '25px' }}>
                    💾 第6章：データ連携（出力とインポート）
                  </h2>
                  <div style={{ lineHeight: '1.8', fontSize: '15px' }}>
                    <h4 style={{ fontWeight: 'bold' }}>【給与ソフトへの連携】</h4>
                    <p>1. 連携したいソフト（Freeeなど）を選択し、「ダウンロード」を実行します。<br />2. <strong>出力されるCSVは、各ソフトの取込形式に完全に最適化されています。</strong> 列の並び替えや加工は一切不要です。</p>
                    <h4 style={{ fontWeight: 'bold' }}>【一括インポート】</h4>
                    <p>社員情報の更新などは「テンプレートDL」から取得したCSVを編集してアップロードしてください。一括でマスタが更新されます。</p>
                  </div>
                </section>

                <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '2px solid #1e293b' }}>
                  <ActionButtons />
                </div>

                <footer style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', paddingBottom: '40px' }}>
                  © 2026 Attendance Management System. Administrator Manual Version 1.2.
                </footer>
              </div>
            </div>
          </div>
          
          <style jsx>{`
            .nav-item:hover { background: #f1f5f9; color: #3b82f6 !important; }
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; padding: 0 !important; }
              .printable-manual { 
                position: absolute !important; 
                top: 0 !important; 
                left: 0 !important; 
                width: 100% !important; 
                height: auto !important; 
                padding: 0 !important; 
                overflow: visible !important;
              }
              .printable-manual > div { display: block !important; }
            }
          `}</style>
        </div>
      )}
    </section>
  );
}
