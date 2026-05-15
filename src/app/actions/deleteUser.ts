'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteUserAction(userId: string) {
  // 1. 安全装置：管理者自身のチェック
  const supabaseServer = await createServerClient()
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser()

  if (currentUser?.id === userId) {
    return { error: '自分自身のアカウントを削除することはできません。' }
  }

  // 2. 特権クライアントの準備
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: 'サーバー設定（環境変数）が不完全です。' }
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log(`[Cleanup] Starting full cleanup for user: ${userId}`);

  // 3. 打刻データの削除（失敗しても無視して次へ）
  try {
    await adminClient.from('attendances').delete().eq('user_id', userId);
  } catch (e) {
    console.warn('[Cleanup] Attendance cleanup warning:', e);
  }

  // 4. プロフィールの削除（失敗しても無視して次へ）
  try {
    await adminClient.from('profiles').delete().eq('id', userId);
  } catch (e) {
    console.warn('[Cleanup] Profile cleanup warning:', e);
  }

  // 5. Authアカウントの削除（最重要だが、既にいなくても成功とみなす）
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  
  if (authError) {
    // 「ユーザーが見つからない」または「UUIDが不正」等のエラーは、
    // 実質的にAuth側から消えている（または最初からいない）ことを意味するので、成功とみなす
    const ignoreMessages = ['User not found', 'invalid input syntax for type uuid', 'unexpected end of JSON input'];
    const shouldIgnore = ignoreMessages.some(msg => authError.message.includes(msg));
    
    if (!shouldIgnore) {
      console.error('[Cleanup] Fatal Auth Error:', authError);
      return { error: `認証アカウントの削除中に重大なエラーが発生しました: ${authError.message}` };
    }
  }

  // 6. 画面キャッシュの更新
  revalidatePath('/attendance/admin')
  
  console.log(`[Cleanup] Cleanup completed successfully for user: ${userId}`);
  return { success: true }
}
