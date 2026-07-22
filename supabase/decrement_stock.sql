-- Hiba Optics — stock auto-decrement on order.
--
-- Run this once in the Supabase SQL editor (or via the CLI). It creates an
-- atomic RPC that the storefront calls after a successful order to reduce the
-- purchased size's stock inside products.variants (jsonb).
--
-- WHY AN RPC (not a client read-modify-write):
--   * The storefront uses the anon/customer key, which has no UPDATE on
--     `products` (RLS restricts writes to the owner). SECURITY DEFINER lets this
--     one narrow, validated operation run with the function owner's rights.
--   * A single UPDATE recomputes `variants` from the row's own current value
--     under the row lock, so concurrent orders serialize and never lose each
--     other's decrement (no stale overwrite).
--
-- BEHAVIOUR:
--   * Only size-tracked lines decrement: needs a non-null p_size and p_qty > 0.
--     A color with no sizes has only an in_stock boolean (no count to reduce),
--     so those lines are intentionally a no-op — buying one shouldn't flip a
--     whole color out of stock.
--   * Stock is coerced to an integer and floored at 0 (never negative).
--   * Unknown product / variant / size is a safe no-op.

create or replace function public.decrement_stock(
  p_product_id uuid,
  p_variant_id text,
  p_size text,
  p_qty integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Nothing to do for color-level (sizeless) lines or non-positive quantities.
  if p_variant_id is null or p_size is null or p_qty is null or p_qty <= 0 then
    return;
  end if;

  update products p
  set variants = coalesce(
    (
      select jsonb_agg(
        case
          when variant->>'id' = p_variant_id then
            -- Rebuild only the matching variant's sizes with the target
            -- size's stock reduced (integer math, floored at 0).
            variant || jsonb_build_object(
              'sizes',
              coalesce(
                (
                  select jsonb_agg(
                    case
                      when sz->>'size' = p_size then
                        sz || jsonb_build_object(
                          'stock',
                          greatest(
                            0,
                            coalesce(nullif(sz->>'stock', '')::int, 0) - p_qty
                          )
                        )
                      else sz
                    end
                  )
                  from jsonb_array_elements(coalesce(variant->'sizes', '[]'::jsonb)) as sz
                ),
                coalesce(variant->'sizes', '[]'::jsonb)
              )
            )
          else variant
        end
      )
      from jsonb_array_elements(coalesce(p.variants, '[]'::jsonb)) as variant
    ),
    p.variants
  )
  where p.id = p_product_id;
end;
$$;

-- The storefront (guest + logged-in customer) must be able to call it.
grant execute on function public.decrement_stock(uuid, text, text, integer)
  to anon, authenticated;
