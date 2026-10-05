import { cn } from "@/lib/utils";
export function Card({className,children}:{className?:string;children:React.ReactNode}){return <div className={cn("rounded-xl border bg-card shadow-[0_1px_2px_rgba(15,23,42,.03)]",className)}>{children}</div>}
