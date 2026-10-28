"use client";

import { ArrowLeft,Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PrintToolbar(){const router=useRouter();return <div className="print:hidden fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 border-b bg-white p-3 shadow-sm"><Button variant="secondary" onClick={()=>router.back()}><ArrowLeft className="h-4 w-4"/>Voltar</Button><Button onClick={()=>window.print()}><Printer className="h-4 w-4"/>Imprimir</Button></div>}
