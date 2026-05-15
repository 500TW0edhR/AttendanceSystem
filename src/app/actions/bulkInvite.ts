'use server'

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

export interface CsvStaffData {
  employee_id: string;
  full_name: string;
  kana: string;
  branch: string;
  department: string;
  position: string;
  employment_type: string;
  hire_date: string;
  email: string;
  dob: string;
  phone: string;
  address: string;
  emergency_contact: string;
  bank_info: string;
}

interface BulkInviteResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ email?: string; employee_id?: string; reason: string }>;
  successfulProfiles: any[];
}

export async function bulkInviteAction(staffList: CsvStaffData[]): Promise<BulkInviteResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const result: BulkInviteResult = {
    successCount: 0,
    errorCount: 0,
    errors: [],
    successfulProfiles: []
  };

  if (!supabaseUrl || !serviceRoleKey) {
    return { ...result, errorCount: staffList.length, errors: [{ reason: 'サーバーの設定が不完全です。' }] };
  }

  // 特権クライアントの初期化（サーバーサイド限定）
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 直列処理（for...of）で1件ずつ確実に処理
  for (const staff of staffList) {
    let authUserId: string | null = null;

    try {
      // 1. バリデーション
      if (!staff.email) {
        result.errorCount++;
        result.errors.push({ employee_id: staff.employee_id, reason: 'メールアドレスがありません' });
        continue;
      }

      // 2. 既存チェック（詳細切り分け）
      const { data: existingByEmail } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', staff.email)
        .maybeSingle();

      if (existingByEmail) {
        result.errorCount++;
        result.errors.push({ email: staff.email, reason: 'このメールアドレスは既にProfilesテーブルに登録されています' });
        continue;
      }

      if (staff.employee_id) {
        const { data: existingById } = await adminClient
          .from('profiles')
          .select('id')
          .eq('employee_id', staff.employee_id)
          .maybeSingle();

        if (existingById) {
          result.errorCount++;
          result.errors.push({ email: staff.email, reason: `社員番号「${staff.employee_id}」は既に他の社員が使用しています` });
          continue;
        }
      }

      // 3. Authユーザーの作成（招待メールは送らない）
      const randomPassword = randomBytes(16).toString('hex');
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: staff.email,
        password: randomPassword,
        email_confirm: true 
      });

      if (authError) {
        result.errorCount++;
        let reason = authError.message;
        if (reason.includes('already registered')) reason = 'このメールアドレスは既に登録されています';
        result.errors.push({ email: staff.email, reason });
        continue;
      }

      authUserId = authUser.user.id;

      // 3. プロフィールの作成
      const profileData = {
        id: authUserId,
        employee_id: staff.employee_id || `E${Math.floor(Math.random() * 90000) + 10000}`,
        full_name: staff.full_name || '名称未設定',
        kana: staff.kana || '',
        email: staff.email,
        branch: staff.branch || '未設定',
        department: staff.department || '未設定',
        position: staff.position || '未設定',
        employment_type: staff.employment_type || '正社員',
        status: '招待待ち', // インポート直後は招待待ち
        hire_date: staff.hire_date || null,
        dob: staff.dob || null,
        phone: staff.phone || '',
        address: staff.address || '',
        emergency_contact: staff.emergency_contact || '',
        bank_info: staff.bank_info || '',
        role: 'user'
      };

      const { data: insertedProfile, error: dbError } = await adminClient
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (dbError) {
        // ロールバック処理：プロフィール作成に失敗したらAuthユーザーを削除する
        console.error(`[BulkInvite] Profile insert failed, rolling back Auth user ${authUserId}:`, dbError.message);
        await adminClient.auth.admin.deleteUser(authUserId);
        
        result.errorCount++;
        let reason = dbError.message;
        if (dbError.code === '23505') reason = '社員番号が既に使われています';
        result.errors.push({ email: staff.email, reason });
        continue;
      }

      // 4. 成功
      result.successCount++;
      result.successfulProfiles.push({
        ...insertedProfile,
        // UI側の期待する形式に補完
        kana: insertedProfile.kana || '',
        photo: '/demo/p1.png', // デフォルトアイコン
        department: insertedProfile.department || '未設定',
        position: insertedProfile.position || '未設定',
      });

    } catch (err: any) {
      console.error(`[BulkInvite] Unexpected error for ${staff.email}:`, err);
      // 万が一の例外時も、Authユーザーが作られていればロールバックを試みる
      if (authUserId) await adminClient.auth.admin.deleteUser(authUserId);
      
      result.errorCount++;
      result.errors.push({ email: staff.email, reason: '予期せぬエラーが発生しました' });
    }
  }

  return result;
}
