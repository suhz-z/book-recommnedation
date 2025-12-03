import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/signup-form";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function SignupPage() {
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
            Create Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
