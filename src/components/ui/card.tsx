import { cn } from "@/lib/utils";
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-card rounded-xl border shadow-[0_8px_28px_rgba(0,0,0,.08)]", className)} {...props}>
      {children}
    </div>
  );
}
