import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6 py-16">
      <AuthForm mode="sign-up" />
    </section>
  );
}
