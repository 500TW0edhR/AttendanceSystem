'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      alert('確認メールを送信しました。メールボックスをご確認ください。')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome</h2>
        <p className="text-gray-500">ログインまたはアカウント作成</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-200 disabled:opacity-50"
          >
            {loading ? '処理中...' : 'ログイン'}
          </button>
          
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 bg-white text-blue-600 font-medium py-3 px-4 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
          >
            新規登録
          </button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">または</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors focus:ring-4 focus:ring-gray-100 disabled:opacity-50"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.89 16.81 15.68 17.62V20.36H19.24C21.32 18.44 22.56 15.61 22.56 12.25Z" fill="#4285F4"/>
          <path d="M12 23C14.97 23 17.46 22.02 19.24 20.36L15.68 17.62C14.72 18.26 13.47 18.66 12 18.66C9.15 18.66 6.74 16.74 5.88 14.15H2.21V16.99C4.01 20.57 7.7 23 12 23Z" fill="#34A853"/>
          <path d="M5.88 14.15C5.66 13.51 5.54 12.77 5.54 12C5.54 11.23 5.66 10.49 5.88 9.85V7.01H2.21C1.47 8.5 1.05 10.19 1.05 12C1.05 13.81 1.47 15.5 2.21 16.99L5.88 14.15Z" fill="#FBBC05"/>
          <path d="M12 5.34C13.62 5.34 15.07 5.9 16.21 6.99L19.33 3.87C17.46 2.12 14.97 1.05 12 1.05C7.7 1.05 4.01 3.43 2.21 7.01L5.88 9.85C6.74 7.26 9.15 5.34 12 5.34Z" fill="#EA4335"/>
        </svg>
        Googleでログイン
      </button>
    </div>
  )
}
