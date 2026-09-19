import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, StepHeader } from "@/components/ui";
import { Footer, Header } from "@/components/nav";
import { LoginForm } from "@/components/LoginForm";
import { currentUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await currentUser();
  if (user && user.role === "ADMIN") {
    redirect("/admin/layanan");
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <StepHeader
          step="Area Khusus"
          title="Login Admin"
          sub="Masuk untuk mengelola data klinik."
        />
        <Card className="p-8">
          <LoginForm next={"/admin/layanan"} title="Masuk" />
        </Card>
        <p className="mt-4 text-center text-sm text-slate-500">
          Akun demo: <strong>admin</strong> (kata sandi <strong>admin123</strong>)
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/" className="text-emerald-700 hover:underline">
            &larr; Kembali ke Beranda
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}