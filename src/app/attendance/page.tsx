import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AttendanceClient from './AttendanceClient';

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // ログインしていない場合はログイン画面にリダイレクト
  if (error || !user) {
    redirect('/login?message=ログインが必要です');
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <AttendanceClient userEmail={user.email} userId={user.id} />
    </div>
  );
}
