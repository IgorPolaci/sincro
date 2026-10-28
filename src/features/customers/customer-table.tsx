"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Mail, MoreHorizontal, Phone } from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";

export type CustomerRow = {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
};

const columns: ColumnDef<CustomerRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <Link className="hover:text-primary font-semibold" href={`/clientes/${row.original.id}`}>
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "document",
    header: "CPF / CNPJ",
    cell: ({ getValue }) => (getValue() as string) || "—",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ getValue }) => (getValue() as string) || "—",
  },
  {
    accessorKey: "email",
    header: "E-mail",
    cell: ({ getValue }) => (getValue() as string) || "—",
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ getValue }) => <Badge tone={getValue() ? "success" : "neutral"}>{getValue() ? "Ativo" : "Inativo"}</Badge>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <CustomerActionsMenu customer={row.original} />,
  },
];

export function CustomerTable({ data }: { data: CustomerRow[] }) {
  return <DataTable columns={columns} data={data} />;
}

function CustomerActionsMenu({ customer }: { customer: CustomerRow }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function closeOnViewportChange() {
      setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [open]);

  function toggleMenu() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 208;
      const estimatedHeight = 148;
      const top = rect.bottom + estimatedHeight > window.innerHeight ? rect.top - estimatedHeight - 6 : rect.bottom + 6;
      setPosition({ top: Math.max(8, top), left: Math.max(8, rect.right - menuWidth) });
    }
    setOpen((current) => !current);
  }

  const actionClass =
    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Ações para ${customer.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus:ring-primary/30 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:ring-2 focus:outline-none"
        onClick={toggleMenu}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Ações para ${customer.name}`}
            className="fixed z-50 w-52 overflow-hidden rounded-lg border bg-white py-1 shadow-lg"
            style={position}
          >
            <Link
              role="menuitem"
              href={`/clientes/${customer.id}`}
              className={actionClass}
              onClick={() => setOpen(false)}
            >
              <Eye className="h-4 w-4 text-slate-500" />
              Ver detalhes
            </Link>
            {customer.phone && (
              <a role="menuitem" href={`tel:${customer.phone}`} className={actionClass} onClick={() => setOpen(false)}>
                <Phone className="h-4 w-4 text-slate-500" />
                Ligar
              </a>
            )}
            {customer.email && (
              <a
                role="menuitem"
                href={`mailto:${customer.email}`}
                className={actionClass}
                onClick={() => setOpen(false)}
              >
                <Mail className="h-4 w-4 text-slate-500" />
                Enviar e-mail
              </a>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
