-- Published products belong in the storefront even before their first inventory
-- movement. Stock availability controls purchasing, not catalog visibility.
create or replace function public.get_public_catalog(p_slug text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare org uuid; unit_id uuid; settings_row public.delivery_settings; result jsonb;
begin
  select o.id,bu.id into org,unit_id
  from public.organizations o
  join public.business_units bu on bu.organization_id=o.id and bu.type='STORE_DELIVERY' and bu.active
  where o.catalog_slug=lower(trim(p_slug)) and o.active limit 1;
  if org is null then raise exception 'Loja não encontrada'; end if;

  select * into settings_row from public.delivery_settings
  where organization_id=org and business_unit_id=unit_id;

  select jsonb_build_object(
    'store',jsonb_build_object(
      'name',settings_row.store_name,'slug',lower(trim(p_slug)),'description',settings_row.description,
      'is_open',settings_row.is_open,'minimum_order',settings_row.minimum_order,
      'delivery_enabled',settings_row.delivery_enabled,'pickup_enabled',settings_row.pickup_enabled,
      'local_enabled',settings_row.local_enabled,'whatsapp',settings_row.whatsapp,
      'opening_hours',settings_row.opening_hours,'accent_color',settings_row.accent_color,
      'logo_path',settings_row.logo_path,'banner_path',settings_row.banner_path
    ),
    'zones',coalesce((
      select jsonb_agg(jsonb_build_object('id',z.id,'name',z.name,'neighborhood',z.neighborhood,'fee',z.fee,'minimum_order',z.minimum_order) order by z.name)
      from public.delivery_zones z
      where z.organization_id=org and z.business_unit_id=unit_id and z.active
    ),'[]'::jsonb),
    'categories',coalesce((
      select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'description',c.description) order by c.name)
      from public.product_categories c
      where c.organization_id=org and c.active and c.deleted_at is null
        and exists(select 1 from public.ecommerce_products ep where ep.category_id=c.id and ep.business_unit_id=unit_id and ep.is_published)
    ),'[]'::jsonb),
    'products',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',p.id,'listing_id',ep.id,'name',ep.display_name,'slug',ep.slug,
        'description',coalesce(ep.short_description,ep.description,p.description),'category_id',ep.category_id,
        'price',case when ep.promotional_price is not null and (ep.promotion_starts_at is null or ep.promotion_starts_at<=now()) and (ep.promotion_ends_at is null or ep.promotion_ends_at>now()) then ep.promotional_price else coalesce(ep.online_price,p.sale_price) end,
        'regular_price',coalesce(ep.online_price,p.sale_price),
        'promotional',ep.promotional_price is not null and (ep.promotion_starts_at is null or ep.promotion_starts_at<=now()) and (ep.promotion_ends_at is null or ep.promotion_ends_at>now()),
        'available',least(
          greatest(0,coalesce(i.quantity,0)-coalesce(r.reserved,0)),
          coalesce(ep.max_per_order,greatest(0,coalesce(i.quantity,0)-coalesce(r.reserved,0)))
        ),
        'featured',ep.is_featured,'delivery',ep.available_for_delivery,'pickup',ep.available_for_pickup,
        'images',coalesce((
          select jsonb_agg(jsonb_build_object('path',img.storage_path,'alt',img.alt_text,'primary',img.is_primary) order by img.is_primary desc,img.position)
          from public.ecommerce_product_images img where img.ecommerce_product_id=ep.id and img.removed_at is null
        ),'[]'::jsonb),
        'option_groups',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',g.id,'name',g.name,'minimum',g.minimum_selections,'maximum',g.maximum_selections,
            'options',coalesce((
              select jsonb_agg(jsonb_build_object('id',op.id,'name',op.name,'price_delta',op.price_delta) order by op.position,op.name)
              from public.ecommerce_options op where op.option_group_id=g.id and op.active
            ),'[]'::jsonb)
          ) order by g.position,g.name)
          from public.ecommerce_option_groups g where g.ecommerce_product_id=ep.id and g.active
        ),'[]'::jsonb)
      ) order by ep.is_featured desc,ep.sort_order,ep.display_name)
      from public.ecommerce_products ep
      join public.products p on p.id=ep.product_id
      left join public.inventory i on i.organization_id=org and i.business_unit_id=unit_id and i.product_id=p.id
      left join lateral (
        select sum(ir.quantity) reserved from public.inventory_reservations ir
        where ir.organization_id=org and ir.business_unit_id=unit_id and ir.product_id=p.id
          and ir.status='ACTIVE' and ir.expires_at>now()
      ) r on true
      where ep.organization_id=org and ep.business_unit_id=unit_id and ep.is_published
        and p.active and p.deleted_at is null
    ),'[]'::jsonb)
  ) into result;
  return result;
end $$;

revoke all on function public.get_public_catalog(text) from public;
grant execute on function public.get_public_catalog(text) to anon,authenticated;
