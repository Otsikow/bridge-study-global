-- Seed a default tenant if none exists so signup trigger can create profiles
INSERT INTO public.tenants (id, name, slug, email_from)
SELECT gen_random_uuid(), 'UniDoxia', 'udx', 'noreply@unidoxia.com'
WHERE NOT EXISTS (SELECT 1 FROM public.tenants);
