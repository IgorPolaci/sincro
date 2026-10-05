import * as React from "react";
import { cn } from "@/lib/utils";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"|"ghost"|"danger" };
export function Button({ className, variant="primary", ...props }: Props) { const variants={primary:"bg-primary text-white hover:bg-primary-dark",secondary:"border bg-white hover:bg-slate-50",ghost:"hover:bg-slate-100",danger:"bg-red-600 text-white hover:bg-red-700"}; return <button className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",variants[variant],className)} {...props}/>; }
