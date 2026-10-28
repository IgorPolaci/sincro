import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PasswordResetForm } from "@/features/auth/password-reset-form";
export default function NewPasswordPage() { return <main className="grid min-h-screen place-items-center p-6"><Card className="w-full max-w-md p-8"><h1 className="text-2xl font-bold">Definir nova senha</h1><p className="mt-2 text-sm text-muted">Escolha uma senha forte, com pelo menos 10 caracteres.</p><PasswordResetForm/><Link href="/login" className="mt-5 block text-center text-sm text-primary">Voltar ao login</Link></Card></main>; }
