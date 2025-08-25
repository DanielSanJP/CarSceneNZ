import { RegisterForm } from "@/components/register-form";
import { Navigation } from "@/components/nav";

export default function RegisterPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
