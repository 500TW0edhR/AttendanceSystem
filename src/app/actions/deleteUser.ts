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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // NEXT_PUBLICなし

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: 'サーバー設定（環境変数）が不完全です。' }
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 3. DB整合性の保護：関連データ（打刻データ）の削除
  const { error: attError } = await adminClient
    .from('attendances')
    .delete()
    .eq('user_id', userId)

  if (attError) {
    console.error('Attendance deletion error:', attError)
    return { error: `打刻データの削除に失敗しました: ${attError.message}` }
  }

  // 4. プロフィールの削除
  const { error: profError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profError) {
    console.error('Profile deletion error:', profError)
    return { error: `プロフィールの削除に失敗しました: ${profError.message}` }
  }

  // 5. Authアカウントの完全削除（これによりメールアドレスが解放される）
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
  
  if (authError) {
    console.error('Auth deletion error:', authError)
    return { error: `認証アカウントの削除に失敗しました: ${authError.message}` }
  }

  // 6. 画面キャッシュの更新
  revalidatePath('/attendance/admin')
  
  return { success: true }
}
