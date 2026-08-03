import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { getUserId } from "@/lib/auth";

export const metadata = { title: "Вход" };

export default async function LoginPage() {
  if (await getUserId()) redirect("/dashboard");

  return (
    <AuthForm
      action={login}
      title="Вход"
      submitLabel="Войти"
      altHref="/register"
      altLabel="Нет аккаунта? Зарегистрироваться"
    />
  );
}
