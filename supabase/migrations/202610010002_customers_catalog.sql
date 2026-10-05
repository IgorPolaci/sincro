create type public.customer_type as enum ('PERSON','COMPANY');

create table public.customers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  type public.customer_type not null default 'PERSON', name text not null, legal_name text, document text,
  state_registration text, phone text, whatsapp text, email text, birth_date date, notes text,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id),
  deleted_at timestamptz, deleted_by uuid references public.profiles(id), unique(organization_id, document)
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id),
  organization_id uuid not null references public.organizations(id), type text not null default 'MAIN', zip_code text,
  street text, number text, complement text, neighborhood text, city text, state text, country text not null default 'BR',
  is_primary boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, legal_name text, document text, email text, phone text, whatsapp text, notes text,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id),
  deleted_at timestamptz, deleted_by uuid references public.profiles(id), unique(organization_id, document)
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, description text, parent_id uuid references public.product_categories(id), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(organization_id, name)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz, unique(organization_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  sku text not null, barcode text, name text not null, description text,
  category_id uuid references public.product_categories(id), brand_id uuid references public.brands(id), supplier_id uuid references public.suppliers(id),
  cost_price numeric(14,2) not null default 0 check(cost_price >= 0), sale_price numeric(14,2) not null default 0 check(sale_price >= 0),
  minimum_stock numeric(14,3) not null default 0, unit text not null default 'UN', location text, active boolean not null default true, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id), deleted_at timestamptz, deleted_by uuid references public.profiles(id),
  unique(organization_id, sku), unique(organization_id, barcode)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
  organization_id uuid not null references public.organizations(id), storage_path text not null, position int not null default 0,
  is_primary boolean not null default false, created_at timestamptz not null default now()
);

create index customers_org_name_idx on public.customers(organization_id, name) where deleted_at is null;
create index customers_org_document_idx on public.customers(organization_id, document);
create index suppliers_org_name_idx on public.suppliers(organization_id, name) where deleted_at is null;
create index products_org_name_idx on public.products(organization_id, name) where deleted_at is null;
create index products_org_sku_idx on public.products(organization_id, sku) where deleted_at is null;

create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_row jsonb; new_row jsonb; org uuid; entity_uuid uuid; action_name text;
begin
  old_row := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  org := coalesce((new_row->>'organization_id')::uuid, (old_row->>'organization_id')::uuid);
  entity_uuid := coalesce((new_row->>'id')::uuid, (old_row->>'id')::uuid);
  action_name := case
    when tg_op = 'INSERT' then 'CREATE'
    when tg_op = 'UPDATE' and old_row->>'deleted_at' is null and new_row->>'deleted_at' is not null then 'DELETE'
    when tg_op = 'UPDATE' and old_row->>'deleted_at' is not null and new_row->>'deleted_at' is null then 'RESTORE'
    else tg_op end;
  insert into public.audit_logs(organization_id,user_id,action,entity,entity_id,old_data,new_data)
  values(org, public.current_profile_id(), action_name, tg_table_name, entity_uuid, old_row, new_row);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['customers','customer_addresses','suppliers','product_categories','brands','products','product_images'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

do $$
declare item record;
begin
  for item in select * from (values
    ('customers','customer'),('customer_addresses','customer'),('suppliers','product'),
    ('product_categories','product'),('brands','product'),('products','product'),('product_images','product')
  ) as x(tbl, permission_prefix) loop
    execute format('create policy %I on public.%I for select to authenticated using (organization_id = public.current_organization_id() and public.has_permission(%L))', item.tbl||'_select', item.tbl, item.permission_prefix||'.view');
    execute format('create policy %I on public.%I for insert to authenticated with check (organization_id = public.current_organization_id() and public.has_permission(%L))', item.tbl||'_insert', item.tbl, item.permission_prefix||'.create');
    execute format('create policy %I on public.%I for update to authenticated using (organization_id = public.current_organization_id() and public.has_permission(%L)) with check (organization_id = public.current_organization_id())', item.tbl||'_update', item.tbl, item.permission_prefix||'.update');
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['customers','suppliers','product_categories','brands','products'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t||'_updated_at', t);
    execute format('create trigger %I after insert or update on public.%I for each row execute function public.audit_row_change()', t||'_audit', t);
  end loop;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy product_images_storage_select on storage.objects for select to authenticated
using (bucket_id = 'product-images' and (storage.foldername(name))[1] = public.current_organization_id()::text);
create policy product_images_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = public.current_organization_id()::text and public.has_permission('product.update'));
