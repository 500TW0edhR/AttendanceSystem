'use server'

import { createClient } from '@supabase/supabase-js'

export async function inviteUserAction(email: string, profileData: any) {
  // サービスロールキーを使用して特権クライアントを作成
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Supabase Auth にユーザーを招待
  const { data: authUser, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email)

  if (authError) return { error: authError.message }
  if (!authUser || !authUser.user) return { error: "ユーザーの作成に失敗しました" }

  // 2. 生成された ID を使って profiles テーブルにデータを挿入
  const { error: dbError } = await adminClient
    .from('profiles')
    .insert({
      id: authUser.user.id, // Auth側で生成されたUUIDを使用
      ...profileData,
      email: email
    })

  if (dbError) return { error: dbError.message }

  // 新しく作成されたプロファイルデータも一緒に返す（画面更新用）
  return { 
    data: {
      ...profileData,
      id: authUser.user.id,
      email: email
    } 
  }
}
