-- Presentation-ready sneaker storefront seed.
-- The loader is scoped to the authenticated user's organization, is auditable,
-- and never resets stock that may already have been used operationally.

create or replace function public.populate_sneaker_demo_store()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := public.current_organization_id();
  v_actor uuid := public.current_profile_id();
  v_store_unit uuid;
  v_category uuid;
  v_brand uuid;
  v_supplier uuid;
  v_product uuid;
  v_listing uuid;
  v_size_group uuid;
  v_inserted integer;
  v_item record;
  v_size text;
begin
  if v_org is null or v_actor is null or not public.has_permission('settings.manage') then
    raise exception 'Acesso negado';
  end if;

  if exists (
    select 1
    from public.audit_logs
    where organization_id = v_org
      and action = 'SNEAKER_DEMO_DATA_SEEDED'
  ) then
    return jsonb_build_object(
      'created', false,
      'message', 'A loja de tênis de demonstração já foi criada nesta organização.'
    );
  end if;

  select id
  into v_store_unit
  from public.business_units
  where organization_id = v_org
    and type = 'STORE_DELIVERY'
    and active
  limit 1;

  if v_store_unit is null then
    raise exception 'Unidade Loja e Delivery não encontrada';
  end if;

  insert into public.delivery_settings (
    organization_id, business_unit_id, store_name, description, accent_color,
    banner_path, is_open, delivery_enabled, pickup_enabled, local_enabled,
    minimum_order, whatsapp, opening_hours
  ) values (
    v_org, v_store_unit, 'Sincro Sneakers',
    'Tênis para acompanhar seu ritmo. Modelos de corrida, treino, casual e infantil com entrega rápida e retirada na loja.',
    '#EA580C', '/demo/sneakers/hero.png', true, true, true, false,
    99, '(11) 99999-2026', 'Seg a sáb, das 9h às 19h'
  )
  on conflict (organization_id, business_unit_id) do update
  set store_name = excluded.store_name,
      description = excluded.description,
      accent_color = excluded.accent_color,
      banner_path = excluded.banner_path,
      is_open = excluded.is_open,
      delivery_enabled = excluded.delivery_enabled,
      pickup_enabled = excluded.pickup_enabled,
      local_enabled = excluded.local_enabled,
      minimum_order = excluded.minimum_order,
      whatsapp = excluded.whatsapp,
      opening_hours = excluded.opening_hours;

  insert into public.suppliers (
    organization_id, name, legal_name, document, email, phone, notes, created_by, updated_by
  ) values (
    v_org, 'Passo Certo Distribuidora', 'Passo Certo Artigos Esportivos Ltda.',
    '00.000.000/0001-91', 'comercial@passocerto.demo', '1133332026',
    'Fornecedor fictício criado para a apresentação da loja de tênis.', v_actor, v_actor
  )
  on conflict (organization_id, document) do update
  set name = excluded.name,
      legal_name = excluded.legal_name,
      email = excluded.email,
      phone = excluded.phone,
      notes = excluded.notes,
      active = true,
      deleted_at = null,
      deleted_by = null,
      updated_by = v_actor
  returning id into v_supplier;

  insert into public.product_categories (organization_id, name, description)
  values
    (v_org, 'Corrida', 'Amortecimento, leveza e resposta para treinos e provas.'),
    (v_org, 'Casual', 'Conforto e estilo para a rotina urbana.'),
    (v_org, 'Treino e Academia', 'Estabilidade e aderência para treinos funcionais e musculação.'),
    (v_org, 'Infantil', 'Modelos confortáveis e resistentes para acompanhar as crianças.'),
    (v_org, 'Trilha e Outdoor', 'Tração e proteção para terrenos irregulares.')
  on conflict (organization_id, name) do update
  set description = excluded.description,
      active = true,
      deleted_at = null;

  insert into public.brands (organization_id, name)
  values
    (v_org, 'Vértice'),
    (v_org, 'Urban Move'),
    (v_org, 'Pulse'),
    (v_org, 'Mini Passos'),
    (v_org, 'Terra Run')
  on conflict (organization_id, name) do update
  set active = true,
      deleted_at = null;

  for v_item in
    select *
    from jsonb_to_recordset($products$[
      {"sku":"SNK-RUN-001","name":"Vértice Aero Run","slug":"vertice-aero-run","category":"Corrida","brand":"Vértice","cost":239.90,"price":449.90,"promo":399.90,"stock":24,"featured":true,"sort":10,"short":"Leveza e amortecimento responsivo para seus quilômetros diários.","description":"Cabedal respirável em mesh, entressola de alta absorção e solado com borracha nas áreas de maior impacto. Indicado para caminhadas e corridas de 5 km a 15 km.","sizes":[35,36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-RUN-002","name":"Vértice Carbon Pace","slug":"vertice-carbon-pace","category":"Corrida","brand":"Vértice","cost":419.90,"price":799.90,"promo":699.90,"stock":14,"featured":true,"sort":20,"short":"Propulsão e velocidade para buscar seu melhor tempo.","description":"Tênis de performance com placa de carbono, espuma responsiva e geometria rocker. Desenvolvido para treinos de ritmo e provas de longa distância.","sizes":[36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-RUN-003","name":"Pulse Flow 2","slug":"pulse-flow-2","category":"Corrida","brand":"Pulse","cost":189.90,"price":369.90,"promo":null,"stock":31,"featured":false,"sort":30,"short":"Conforto versátil para começar a correr com confiança.","description":"Combina espuma macia, base estável e cabedal sem costuras. Uma escolha equilibrada para iniciantes, caminhada e uso diário.","sizes":[34,35,36,37,38,39,40,41,42,43]},
      {"sku":"SNK-RUN-004","name":"Pulse Tempo Pro","slug":"pulse-tempo-pro","category":"Corrida","brand":"Pulse","cost":299.90,"price":579.90,"promo":529.90,"stock":18,"featured":false,"sort":40,"short":"Resposta rápida para treinos intensos e rodagens progressivas.","description":"Entressola de dupla densidade, ajuste firme no médio pé e borracha de alta durabilidade. Ideal para quem alterna velocidade e volume semanal.","sizes":[36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-CAS-001","name":"Urban Move Soho","slug":"urban-move-soho","category":"Casual","brand":"Urban Move","cost":159.90,"price":329.90,"promo":289.90,"stock":36,"featured":true,"sort":50,"short":"Visual minimalista e conforto que combina com qualquer ocasião.","description":"Cabedal macio, palmilha anatômica removível e solado caixa antiderrapante. Um tênis urbano versátil para trabalho, passeio e viagem.","sizes":[34,35,36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-CAS-002","name":"Urban Move Brooklyn","slug":"urban-move-brooklyn","category":"Casual","brand":"Urban Move","cost":179.90,"price":359.90,"promo":null,"stock":29,"featured":false,"sort":60,"short":"Design retrô com acabamento premium para elevar o look.","description":"Mistura painéis texturizados, forro acolchoado e sola de borracha natural. Conforto duradouro com inspiração nos clássicos dos anos 80.","sizes":[35,36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-CAS-003","name":"Vértice Street Canvas","slug":"vertice-street-canvas","category":"Casual","brand":"Vértice","cost":109.90,"price":229.90,"promo":199.90,"stock":42,"featured":false,"sort":70,"short":"Leve, descomplicado e pronto para a rotina.","description":"Tênis em lona reforçada com palmilha de espuma e solado vulcanizado flexível. Fácil de combinar e confortável do primeiro ao último compromisso.","sizes":[34,35,36,37,38,39,40,41,42,43]},
      {"sku":"SNK-CAS-004","name":"Urban Move Slip Easy","slug":"urban-move-slip-easy","category":"Casual","brand":"Urban Move","cost":124.90,"price":259.90,"promo":null,"stock":27,"featured":false,"sort":80,"short":"Calce fácil com ajuste confortável e visual contemporâneo.","description":"Construção sem cadarço, tecido elástico respirável e palmilha com memória. Perfeito para quem procura praticidade sem abrir mão do estilo.","sizes":[34,35,36,37,38,39,40,41,42]},
      {"sku":"SNK-TRN-001","name":"Pulse Core Trainer","slug":"pulse-core-trainer","category":"Treino e Academia","brand":"Pulse","cost":219.90,"price":419.90,"promo":369.90,"stock":22,"featured":true,"sort":90,"short":"Base firme para treinos de força, mobilidade e funcional.","description":"Perfil baixo, suporte lateral reforçado e solado aderente. Entrega estabilidade em agachamentos e segurança nas mudanças rápidas de direção.","sizes":[35,36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-TRN-002","name":"Pulse Flex Studio","slug":"pulse-flex-studio","category":"Treino e Academia","brand":"Pulse","cost":174.90,"price":349.90,"promo":null,"stock":26,"featured":false,"sort":100,"short":"Flexibilidade e ventilação para treinos dinâmicos.","description":"Cabedal leve com zonas de ventilação, sulcos flexíveis no antepé e suporte moderado no calcanhar. Ideal para aulas, circuitos e academia.","sizes":[34,35,36,37,38,39,40,41,42]},
      {"sku":"SNK-TRN-003","name":"Vértice Lift Base","slug":"vertice-lift-base","category":"Treino e Academia","brand":"Vértice","cost":264.90,"price":499.90,"promo":449.90,"stock":16,"featured":false,"sort":110,"short":"Estabilidade máxima para quem leva força a sério.","description":"Base ampla e rígida, elevação moderada no calcanhar e tira de ajuste no médio pé. Projetado para levantamento e treinos de alta carga.","sizes":[36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-KID-001","name":"Mini Passos Cometa","slug":"mini-passos-cometa","category":"Infantil","brand":"Mini Passos","cost":99.90,"price":209.90,"promo":179.90,"stock":38,"featured":true,"sort":120,"short":"Conforto, cor e praticidade para brincar o dia inteiro.","description":"Fechamento por velcro, biqueira reforçada e solado flexível que não marca. Fácil de calçar e resistente para acompanhar todas as aventuras.","sizes":[25,26,27,28,29,30,31,32,33,34]},
      {"sku":"SNK-KID-002","name":"Mini Passos Flash","slug":"mini-passos-flash","category":"Infantil","brand":"Mini Passos","cost":119.90,"price":239.90,"promo":null,"stock":33,"featured":false,"sort":130,"short":"Leve e esportivo para escola, passeio e diversão.","description":"Mesh respirável, cadarço elástico e puxador traseiro para autonomia no calce. Amortecimento macio e solado de boa aderência.","sizes":[28,29,30,31,32,33,34,35,36]},
      {"sku":"SNK-KID-003","name":"Mini Passos Jump","slug":"mini-passos-jump","category":"Infantil","brand":"Mini Passos","cost":109.90,"price":219.90,"promo":189.90,"stock":30,"featured":false,"sort":140,"short":"Um tênis resistente para pequenos movimentos gigantes.","description":"Estrutura reforçada nas laterais, palmilha confortável e solado flexível. Criado para aguentar a rotina intensa das crianças.","sizes":[25,26,27,28,29,30,31,32,33,34]},
      {"sku":"SNK-TRL-001","name":"Terra Run Summit","slug":"terra-run-summit","category":"Trilha e Outdoor","brand":"Terra Run","cost":329.90,"price":629.90,"promo":569.90,"stock":17,"featured":true,"sort":150,"short":"Tração agressiva e proteção para explorar novos caminhos.","description":"Solado com travas multidirecionais, placa antiperfuração e cabedal resistente a respingos. Segurança para trilhas técnicas e terrenos soltos.","sizes":[36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-TRL-002","name":"Terra Run Canyon","slug":"terra-run-canyon","category":"Trilha e Outdoor","brand":"Terra Run","cost":279.90,"price":539.90,"promo":null,"stock":20,"featured":false,"sort":160,"short":"Conforto protegido para trilhas leves e caminhadas longas.","description":"Amortecimento equilibrado, biqueira protegida e sola aderente em piso seco ou úmido. Excelente transição entre cidade e natureza.","sizes":[35,36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-TRL-003","name":"Terra Run Horizon","slug":"terra-run-horizon","category":"Trilha e Outdoor","brand":"Terra Run","cost":299.90,"price":589.90,"promo":519.90,"stock":15,"featured":false,"sort":170,"short":"Mais estabilidade para aventuras que vão além do asfalto.","description":"Entressola estável, calcanhar estruturado e borracha de alta aderência. Feito para caminhadas, viagens e trilhas de dificuldade moderada.","sizes":[36,37,38,39,40,41,42,43,44]},
      {"sku":"SNK-RUN-005","name":"Vértice Daily Cloud","slug":"vertice-daily-cloud","category":"Corrida","brand":"Vértice","cost":209.90,"price":399.90,"promo":349.90,"stock":28,"featured":false,"sort":180,"short":"Maciez para correr, caminhar e viver em movimento.","description":"Amortecimento generoso com transição suave, forma confortável e cabedal respirável. O modelo coringa para treinos leves e uso prolongado.","sizes":[34,35,36,37,38,39,40,41,42,43,44]}
    ]$products$::jsonb) as x(
      sku text, name text, slug text, category text, brand text,
      cost numeric, price numeric, promo numeric, stock numeric,
      featured boolean, sort integer, short text, description text, sizes jsonb
    )
  loop
    select id into v_category
    from public.product_categories
    where organization_id = v_org and name = v_item.category;

    select id into v_brand
    from public.brands
    where organization_id = v_org and name = v_item.brand;

    insert into public.products (
      organization_id, sku, name, description, category_id, brand_id, supplier_id,
      cost_price, sale_price, minimum_stock, unit, location, active, notes, created_by, updated_by
    ) values (
      v_org, v_item.sku, v_item.name, v_item.description, v_category, v_brand, v_supplier,
      v_item.cost, v_item.price, 5, 'PAR', 'Showroom / Estoque principal', true,
      'Produto fictício da massa Sincro Sneakers.', v_actor, v_actor
    )
    on conflict (organization_id, sku) do update
    set name = excluded.name,
        description = excluded.description,
        category_id = excluded.category_id,
        brand_id = excluded.brand_id,
        supplier_id = excluded.supplier_id,
        cost_price = excluded.cost_price,
        sale_price = excluded.sale_price,
        minimum_stock = excluded.minimum_stock,
        unit = excluded.unit,
        location = excluded.location,
        active = true,
        deleted_at = null,
        deleted_by = null,
        notes = excluded.notes,
        updated_by = v_actor
    returning id into v_product;

    insert into public.inventory (organization_id, business_unit_id, product_id, quantity)
    values (v_org, v_store_unit, v_product, v_item.stock)
    on conflict (organization_id, business_unit_id, product_id) do nothing;

    get diagnostics v_inserted = row_count;
    if v_inserted > 0 then
      insert into public.inventory_movements (
        organization_id, business_unit_id, product_id, type, quantity,
        quantity_before, quantity_after, reference_type, reason, created_by
      ) values (
        v_org, v_store_unit, v_product, 'INITIAL', v_item.stock,
        0, v_item.stock, 'SNEAKER_DEMONSTRATION',
        'Carga inicial da loja de tênis de demonstração', v_actor
      );
    end if;

    insert into public.ecommerce_products (
      organization_id, business_unit_id, product_id, category_id, display_name, slug,
      short_description, description, online_price, promotional_price,
      promotion_starts_at, promotion_ends_at, is_published, is_featured,
      available_for_delivery, available_for_pickup, max_per_order, sort_order,
      seo_title, seo_description, published_at
    ) values (
      v_org, v_store_unit, v_product, v_category, v_item.name, v_item.slug,
      v_item.short, v_item.description, v_item.price, v_item.promo,
      case when v_item.promo is not null then now() - interval '1 day' end,
      case when v_item.promo is not null then now() + interval '45 days' end,
      true, v_item.featured, true, true, 3, v_item.sort,
      v_item.name || ' | Sincro Sneakers',
      left(v_item.short || ' Compre online com entrega rápida ou retirada na loja.', 170),
      now()
    )
    on conflict (organization_id, business_unit_id, product_id) do update
    set category_id = excluded.category_id,
        display_name = excluded.display_name,
        slug = excluded.slug,
        short_description = excluded.short_description,
        description = excluded.description,
        online_price = excluded.online_price,
        promotional_price = excluded.promotional_price,
        promotion_starts_at = excluded.promotion_starts_at,
        promotion_ends_at = excluded.promotion_ends_at,
        is_published = true,
        is_featured = excluded.is_featured,
        available_for_delivery = true,
        available_for_pickup = true,
        max_per_order = excluded.max_per_order,
        sort_order = excluded.sort_order,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        published_at = coalesce(public.ecommerce_products.published_at, now())
    returning id into v_listing;

    insert into public.ecommerce_product_images (
      organization_id, ecommerce_product_id, storage_path,
      alt_text, position, is_primary
    ) values (
      v_org,
      v_listing,
      case v_item.category
        when 'Corrida' then '/demo/sneakers/running.png?sku=' || lower(v_item.sku)
        when 'Casual' then '/demo/sneakers/casual.png?sku=' || lower(v_item.sku)
        when 'Treino e Academia' then '/demo/sneakers/training.png?sku=' || lower(v_item.sku)
        when 'Infantil' then '/demo/sneakers/kids.png?sku=' || lower(v_item.sku)
        else '/demo/sneakers/trail.png?sku=' || lower(v_item.sku)
      end,
      v_item.name || ' em destaque',
      0,
      true
    )
    on conflict (organization_id, storage_path) do update
    set ecommerce_product_id = excluded.ecommerce_product_id,
        alt_text = excluded.alt_text,
        position = excluded.position,
        is_primary = true,
        removed_at = null;

    select id into v_size_group
    from public.ecommerce_option_groups
    where organization_id = v_org
      and ecommerce_product_id = v_listing
      and name = 'Tamanho'
    order by created_at
    limit 1;

    if v_size_group is null then
      insert into public.ecommerce_option_groups (
        organization_id, ecommerce_product_id, name,
        minimum_selections, maximum_selections, position, active
      ) values (v_org, v_listing, 'Tamanho', 1, 1, 0, true)
      returning id into v_size_group;
    else
      update public.ecommerce_option_groups
      set minimum_selections = 1,
          maximum_selections = 1,
          position = 0,
          active = true
      where id = v_size_group;
    end if;

    for v_size in select value from jsonb_array_elements_text(v_item.sizes)
    loop
      if not exists (
        select 1
        from public.ecommerce_options
        where organization_id = v_org
          and option_group_id = v_size_group
          and name = v_size
      ) then
        insert into public.ecommerce_options (
          organization_id, option_group_id, name, price_delta, position, active
        ) values (v_org, v_size_group, v_size, 0, v_size::integer, true);
      end if;
    end loop;
  end loop;

  for v_item in
    select *
    from jsonb_to_recordset($customers$[
      {"name":"Ana Clara Martins","document":"390.111.220-01","phone":"11981112001","email":"ana.martins@sneakers.demo","points":180},
      {"name":"Bruno Ribeiro","document":"390.111.220-02","phone":"11981112002","email":"bruno.ribeiro@sneakers.demo","points":95},
      {"name":"Carolina Nunes","document":"390.111.220-03","phone":"11981112003","email":"carolina.nunes@sneakers.demo","points":240},
      {"name":"Diego Ferreira","document":"390.111.220-04","phone":"11981112004","email":"diego.ferreira@sneakers.demo","points":60},
      {"name":"Elisa Moraes","document":"390.111.220-05","phone":"11981112005","email":"elisa.moraes@sneakers.demo","points":320},
      {"name":"Felipe Andrade","document":"390.111.220-06","phone":"11981112006","email":"felipe.andrade@sneakers.demo","points":125},
      {"name":"Gabriela Alves","document":"390.111.220-07","phone":"11981112007","email":"gabriela.alves@sneakers.demo","points":75},
      {"name":"Henrique Souza","document":"390.111.220-08","phone":"11981112008","email":"henrique.souza@sneakers.demo","points":210},
      {"name":"Isabela Rocha","document":"390.111.220-09","phone":"11981112009","email":"isabela.rocha@sneakers.demo","points":45},
      {"name":"João Vitor Lima","document":"390.111.220-10","phone":"11981112010","email":"joao.lima@sneakers.demo","points":150}
    ]$customers$::jsonb) as x(name text, document text, phone text, email text, points integer)
  loop
    insert into public.customers (
      organization_id, name, document, phone, whatsapp, email,
      notes, active, created_by, updated_by
    ) values (
      v_org, v_item.name, v_item.document, v_item.phone, v_item.phone, v_item.email,
      'Cliente fictício da apresentação Sincro Sneakers.', true, v_actor, v_actor
    )
    on conflict (organization_id, document) do update
    set name = excluded.name,
        phone = excluded.phone,
        whatsapp = excluded.whatsapp,
        email = excluded.email,
        notes = excluded.notes,
        active = true,
        deleted_at = null,
        deleted_by = null,
        updated_by = v_actor
    returning id into v_product;

    insert into public.loyalty_accounts (organization_id, customer_id, points, lifetime_points)
    values (v_org, v_product, v_item.points, v_item.points + 100)
    on conflict (organization_id, customer_id) do nothing;
  end loop;

  insert into public.delivery_zones (
    organization_id, business_unit_id, name, neighborhood, fee, minimum_order
  ) values
    (v_org, v_store_unit, 'Centro', 'Centro', 7.90, 99),
    (v_org, v_store_unit, 'Zona Norte', 'Zona Norte', 12.90, 149),
    (v_org, v_store_unit, 'Zona Sul', 'Zona Sul', 14.90, 149),
    (v_org, v_store_unit, 'Zona Leste', 'Zona Leste', 16.90, 179),
    (v_org, v_store_unit, 'Zona Oeste', 'Zona Oeste', 16.90, 179)
  on conflict (organization_id, business_unit_id, neighborhood) do update
  set name = excluded.name,
      fee = excluded.fee,
      minimum_order = excluded.minimum_order,
      active = true;

  insert into public.coupons (
    organization_id, business_unit_id, code, discount_type,
    discount_value, minimum_order, maximum_discount, usage_limit, active
  ) values
    (v_org, v_store_unit, 'PRIMEIROPASSO', 'PERCENT', 10, 199, 80, 200, true),
    (v_org, v_store_unit, 'CORRIDA15', 'PERCENT', 15, 399, 120, 100, true),
    (v_org, v_store_unit, 'FRETEGRATIS', 'FIXED', 16.90, 299, 16.90, 150, true)
  on conflict (organization_id, business_unit_id, code) do update
  set discount_type = excluded.discount_type,
      discount_value = excluded.discount_value,
      minimum_order = excluded.minimum_order,
      maximum_discount = excluded.maximum_discount,
      usage_limit = excluded.usage_limit,
      active = true;

  insert into public.audit_logs (organization_id, user_id, action, entity, new_data)
  values (
    v_org, v_actor, 'SNEAKER_DEMO_DATA_SEEDED', 'demonstration',
    jsonb_build_object(
      'store_name', 'Sincro Sneakers',
      'products', 18,
      'categories', 5,
      'customers', 10,
      'delivery_zones', 5,
      'coupons', 3
    )
  );

  return jsonb_build_object(
    'created', true,
    'products', 18,
    'categories', 5,
    'customers', 10,
    'message', 'Sincro Sneakers criada com 18 produtos publicados, tamanhos, estoque, clientes e cupons.'
  );
end;
$$;

revoke all on function public.populate_sneaker_demo_store() from public;
grant execute on function public.populate_sneaker_demo_store() to authenticated;
