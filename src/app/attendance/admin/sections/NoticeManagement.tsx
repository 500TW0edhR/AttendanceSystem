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
    
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (!error && data) setNotices(data);
  };

  useEffect(() => {
    fetchNotices();
  }, [isDemoMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setIsLoading(true);
    if (isDemoMode) {
      showToast("デモモード：お知らせを投稿しました", "success");
      setTitle('');
      setContent('');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from('notices').insert({ title, content });
    if (!error) {
      showToast("お知らせを投稿しました", "success");
      setTitle('');
      setContent('');
      fetchNotices();
    } else {
      showToast("投稿に失敗しました", "danger");
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
    }
  };

  return (
    <section className="admin-section active" style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>🔔 お知らせ管理</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        {/* 投稿フォーム */}
        <div>
          <form className="card" onSubmit={handleSubmit} style={{ padding: '30px', borderRadius: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>🆕 新規お知らせ投稿</h3>
            <div className="form-group">
              <label>タイトル</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="例：夏季休暇のお知らせ"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>内容</label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="詳細を入力してください..."
                style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', resize: 'none' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-rect" 
              style={{ background: 'var(--primary)', color: 'white', marginTop: '20px', width: '100%', height: '50px' }}
            >
              {isLoading ? '送信中...' : 'お知らせを公開する'}
            </button>
          </form>
        </div>

        {/* 投稿一覧 */}
        <div>
          <div className="card" style={{ padding: '30px', borderRadius: '20px', minHeight: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>📋 投稿済み一覧</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {notices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                  投稿されたお知らせはありません
                </div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '20px', position: 'relative', transition: 'all 0.2s' }} className="notice-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>{new Date(n.created_at).toLocaleString('ja-JP')}</div>
                        <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{n.content}</div>
                      </div>
                      <button 
                        onClick={() => handleDelete(n.id)}
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '10px' }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
