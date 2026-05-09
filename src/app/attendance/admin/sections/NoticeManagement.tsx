'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function NoticeManagement({ isDemoMode, showToast }: any) {
  const [notices, setNotices] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createClient();

  const fetchNotices = async () => {
    if (isDemoMode) {
      setNotices([
        { id: '1', title: '5月分シフト確定のお知らせ', content: '5月のシフトが確定しました。各自確認してください。', created_at: '2026-05-01T10:00:00' },
        { id: '2', title: '【重要】有給休暇の計画的付与について', content: '夏季休暇の計画的付与についての詳細です。', created_at: '2026-04-28T09:00:00' },
      ]);
      return;
    }
    
    try {
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setNotices(data);
      } else if (error) {
        console.warn("Table 'notices' might not exist yet:", error.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [isDemoMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      showToast("タイトルと内容を入力してください", "warning");
      return;
    }
    
    setIsLoading(true);
    if (isDemoMode) {
      setTimeout(() => {
        const newNotice = {
          id: Date.now().toString(),
          title,
          content,
          created_at: new Date().toISOString()
        };
        setNotices([newNotice, ...notices]);
        showToast("デモモード：お知らせを投稿しました", "success");
        setTitle('');
        setContent('');
        setIsLoading(false);
      }, 500);
      return;
    }

    const { error } = await supabase.from('notices').insert({ title, content });
    if (!error) {
      showToast("お知らせを公開しました", "success");
      setTitle('');
      setContent('');
      fetchNotices();
    } else {
      console.error(error);
      showToast(`投稿に失敗しました: ${error.message}`, "danger");
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このお知らせを削除しますか？')) return;
    
    if (isDemoMode) {
      setNotices(notices.filter(n => n.id !== id));
      showToast("デモモード：お知らせを削除しました", "success");
      return;
    }

    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) {
      showToast("お知らせを削除しました", "success");
      fetchNotices();
    } else {
      showToast("削除に失敗しました", "danger");
    }
  };

  return (
    <section className="admin-section active" style={{ padding: '20px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>🔔 お知らせ管理</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '40px', alignItems: 'start' }}>
        
        {/* 左側：投稿フォーム */}
        <div style={{ background: 'white', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginTop: 0, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>✍️</span> 新規投稿
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>タイトル</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="例：夏季休暇のお知らせ"
                className="modern-input"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', transition: 'all 0.2s', fontSize: '15px' }}
              />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>内容</label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="スタッフへのメッセージを入力してください..."
                className="modern-input"
                style={{ width: '100%', height: '200px', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', transition: 'all 0.2s', fontSize: '15px', resize: 'none', lineHeight: '1.6' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none', 
                background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                color: 'white', fontWeight: '900', fontSize: '16px', cursor: 'pointer', 
                boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)', transition: 'all 0.3s'
              }}
            >
              {isLoading ? '送信中...' : 'お知らせを公開する'}
            </button>
          </form>
        </div>

        {/* 右側：履歴一覧 */}
        <div style={{ background: 'white', padding: '35px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', minHeight: '600px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginTop: 0, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📋</span> 投稿済み一覧
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {notices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '120px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: '50px', marginBottom: '15px', opacity: 0.5 }}>📭</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>投稿されたお知らせはありません</div>
                <div style={{ fontSize: '13px', marginTop: '5px' }}>左のフォームから新しい投稿を作成してください。</div>
              </div>
            ) : (
              notices.map((n) => (
                <div key={n.id} style={{ border: '1px solid #f1f5f9', borderRadius: '18px', padding: '25px', position: 'relative', transition: 'all 0.3s', background: '#f8fafc' }} className="notice-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '6px' }}>{n.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                        <span>📅 {new Date(n.created_at).toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(n.id)}
                      style={{ background: 'white', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                      className="delete-btn"
                    >
                      削除
                    </button>
                  </div>
                  <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{n.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modern-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
        }
        .notice-card:hover {
          background: white !important;
          border-color: #dbeafe !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.04) !important;
          transform: translateY(-2px);
        }
        .delete-btn:hover {
          background: #fee2e2 !important;
        }
      `}</style>
    </section>
  );
}
