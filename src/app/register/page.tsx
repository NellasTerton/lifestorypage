import { redirect } from "next/navigation";
import { register } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { getUserId } from "@/lib/auth";

export const metadata = { title: "Регистрация" };

export default async function RegisterPage() {
  if (await getUserId()) redirect("/dashboard");

  return (
    <AuthForm
      action={register}
      title="Регистрация"
      submitLabel="Создать аккаунт"
      altHref="/login"
      altLabel="Уже есть аккаунт? Войти"
    />
  );
}
