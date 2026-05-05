import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-4">
      <main className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-400">
          Supabase Auth PoC
        </h1>
        
        {user ? (
          <div className="w-full flex flex-col gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-left w-full break-all">
              <p className="text-sm text-gray-500 mb-1">ログイン中のユーザー:</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>

            <Link 
              href="/attendance" 
              className="w-full bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors focus:ring-4 focus:ring-emerald-200 text-center"
            >
              🚪 勤怠システムを開く
            </Link>

            <form action={signOut} className="w-full mt-4">
              <button
                type="submit"
                className="w-full bg-red-50 text-red-600 font-medium py-3 px-4 rounded-lg border border-red-100 hover:bg-red-100 transition-colors focus:ring-4 focus:ring-red-50"
              >
                ログアウト
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-gray-600 mb-2">
              ログインしてすべての機能にアクセスしてください。
            </p>
            <Link 
              href="/login" 
              className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-200 text-center"
            >
              ログインページへ
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
