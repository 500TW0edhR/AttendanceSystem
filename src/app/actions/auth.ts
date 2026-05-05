'use server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DEMO_IDS = [
  'd0000000-0000-0000-0000-000000000000', // No.0000 (実演用)
  'd0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000006',
  'd0000000-0000-0000-0000-000000000007',
  'd0000000-0000-0000-0000-000000000008',
  'd0000000-0000-0000-0000-000000000009',
  'd0000000-0000-0000-0000-000000000010',
];

/**
 * プレゼン用フルデモ環境の構築
 */
export async function setupFullDemo(adminUserId: string, todayDate: string) {
  try {
    const tables = ['attendances', 'applications', 'profiles'];
    const idColumn = { attendances: 'user_id', applications: 'user_id', profiles: 'id' };

    for (const table of tables) {
      await supabaseAdmin.from(table).delete().eq('is_demo', true);
      await supabaseAdmin.from(table).delete().in(idColumn[table as keyof typeof idColumn], DEMO_IDS);
    }

    const dummyNames = ['実演用アカウント', '田中 一郎', '佐藤 花子', '鈴木 次郎', '高橋 健二', '伊藤 美穂', '渡辺 直樹', '山本 恵', '中村 剛', '小林 誠', '加藤 幸子'];
    const branches = ['東京', '大阪', '名古屋', '福岡'];
    const types = ['正社員', '契約社員', 'アルバイト', '派遣社員'];
    const statuses = ['在籍', '外出中', '直行直帰', '残業超過', '退職', '招待中', '在籍', '在籍', '在籍', '在籍', '在籍'];
    
    for (let i = statuses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
    }

    const dummyProfiles = DEMO_IDS.map((id, i) => ({
      id,
      full_name: dummyNames[i],
      employee_id: i === 0 ? 'No.0000' : `No.${String(i).padStart(4, '0')}`,
      branch: branches[i % branches.length],
      employment_type: types[i % types.length],
      status: i === 0 ? '在籍' : statuses[i],
      email: `demo${i}@example.com`,
      is_demo: true
    }));

    const { error: pErr } = await supabaseAdmin.from('profiles').upsert(dummyProfiles);
    if (pErr) throw new Error("Profile creation failed: " + pErr.message);

    const dummyAttendances: any[] = [];
    const pastDates: string[] = [];
    const baseDate = new Date(todayDate);
    for (let i = 1; i <= 3; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      pastDates.push(d.toISOString().split('T')[0]);
    }

    DEMO_IDS.forEach((id, idx) => {
      const profile = dummyProfiles[idx];
      const needsToday = idx !== 0 && profile.status !== '退職' && profile.status !== '招待中';
      const activeDates = needsToday ? [...pastDates, todayDate] : pastDates; 

      activeDates.forEach(date => {
        dummyAttendances.push({
          user_id: id,
          target_date: date,
          punch_in: '08:55',
          punch_out: '18:05',
          work_hours: 8.0,
          status: '正常',
          is_demo: true
        });
      });
    });
    const { error: aErr } = await supabaseAdmin.from('attendances').insert(dummyAttendances);
    if (aErr) throw new Error("Attendance creation failed: " + aErr.message);

    const dummyApps = [
      { user_id: DEMO_IDS[1], type: '遅刻', title: '田中 一郎：遅刻申請', target_date: todayDate, status: 'pending', details: { reason: '電車遅延のため(固定)', plan: '09:00', actual: '09:45' }, is_demo: true },
      { user_id: DEMO_IDS[2], type: '交通費', title: '佐藤 花子：交通費精算', target_date: todayDate, status: 'pending', details: { reason: '外回り営業(固定)', amount: '1,200' }, is_demo: true },
    ];
    const { error: appErr } = await supabaseAdmin.from('applications').insert(dummyApps);
    if (appErr) throw new Error("Application creation failed: " + appErr.message);

    return { success: true };
  } catch (error: any) {
    console.error("SetupDemo Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * デモ用データのみをクリア
 */
export async function clearOnlyDemoData() {
  try {
    const tables = ['attendances', 'applications', 'profiles'];
    const idColumn = { attendances: 'user_id', applications: 'user_id', profiles: 'id' };

    for (const table of tables) {
      await supabaseAdmin.from(table).delete().eq('is_demo', true);
      await supabaseAdmin.from(table).delete().in(idColumn[table as keyof typeof idColumn], DEMO_IDS);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 本番データの完全初期化 (管理者自身以外をすべて削除)
 */
export async function purgeProductionData(adminUserId: string) {
  try {
    // 1. すべての打刻と申請を削除
    await supabaseAdmin.from('attendances').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('applications').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');

    // 2. 自分以外のプロフィールを削除
    const { error } = await supabaseAdmin.from('profiles').delete().neq('id', adminUserId);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 招待機能
 */
export async function inviteStaff(formData: {
  email: string,
  full_name: string,
  branch: string,
  employment_type: string,
  employee_id: string
}) {
  try {
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(formData.email, {
      data: { full_name: formData.full_name }
    });
    if (inviteError) throw inviteError;

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: inviteData.user.id,
      email: formData.email,
      full_name: formData.full_name,
      branch: formData.branch,
      employment_type: formData.employment_type,
      employee_id: formData.employee_id,
      role: 'user',
      status: '招待中',
      is_demo: false
    });
    if (profileError) throw profileError;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
