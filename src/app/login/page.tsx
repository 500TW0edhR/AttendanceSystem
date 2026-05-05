import AuthForm from '@/components/AuthForm'

export const metadata = {
  title: 'ログイン | My Auth App',
  description: 'Supabaseを利用したログインページです',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AuthForm />
    </div>
  )
}
