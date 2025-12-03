import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function LoginPage() {
  // Redirect if already logged in
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token');
  
  if (token) {
    redirect('/');
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Login to Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
