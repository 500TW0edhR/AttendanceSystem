'use server'

import { createClient } from '@supabase/supabase-js'

export async function inviteUserAction(email: string, profileData: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`[InviteAction] Starting invitation for: ${email}`);

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(`[InviteAction] Missing environment variables! URL: ${!!supabaseUrl}, Key: ${!!serviceRoleKey}`);
    return { error: 'サーバーの設定（環境変数）が不完全です。Vercelの設定を確認してください。' };
  }

  // サービスロールキーを使用して特権クライアントを作成
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // 1. Supabase Auth にユーザーを招待
    console.log(`[InviteAction] Sending auth invitation...`);
    const { data: authUser, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email)

    if (authError) {
      console.error(`[InviteAction] Auth invitation error:`, authError.message);
      return { error: authError.message };
    }
    if (!authUser || !authUser.user) return { error: "ユーザーの作成に失敗しました" };

    const userId = authUser.user.id;
    console.log(`[InviteAction] Auth user created: ${userId}. Inserting profile...`);

    // 2. profiles テーブルにデータを挿入（不整合防止のため項目を限定）
    const { error: dbError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        full_name: profileData.full_name,
        kana: profileData.kana,
        branch: profileData.branch,
        employment_type: profileData.employment_type,
        department: profileData.department,
        position: profileData.position,
        hire_date: profileData.hire_date,
        email: email,
        dob: profileData.dob,
        phone: profileData.phone,
        address: profileData.address,
        visa_type: profileData.visa_type,
        visa_expiry: profileData.visa_expiry,
        emergency_contact: profileData.emergency_contact,
        bank_info: profileData.bank_info,
        status: '招待中', // 初期状態を招待中に設定
        role: profileData.role || 'user'
      })

    if (dbError) {
      console.error(`[InviteAction] Database insertion error:`, dbError.message);
      return { error: `プロフィール作成エラー: ${dbError.message}` };
    }

    console.log(`[InviteAction] Successfully completed for: ${email}`);

    // 新しく作成されたプロファイルデータを返す
    return { 
      data: {
        ...profileData,
        id: userId,
        email: email,
        status: '招待中'
      } 
    }
  } catch (err: any) {
    console.error(`[InviteAction] Unexpected error:`, err);
    return { error: `サーバーエラーが発生しました: ${err.message}` };
  }
}
