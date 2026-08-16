import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6 py-16">
      <SignUp />
    </section>
  );
}
