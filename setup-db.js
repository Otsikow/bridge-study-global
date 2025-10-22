// Database setup script to fix authentication issues
// This script creates the necessary database records for authentication to work

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gbustuntgvmwkcttjojo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupDatabase() {
  console.log('Setting up database for authentication...');
  
  try {
    // 1. Create default tenant if it doesn't exist
    console.log('Creating default tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Global Education Gateway',
        slug: 'geg',
        email_from: 'noreply@globaleducationgateway.com',
        active: true,
        brand_colors: { primary: '#1e40af', secondary: '#3b82f6' },
        settings: {}
      }, { onConflict: 'id' })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      return;
    }
    
    console.log('✅ Default tenant created/updated:', tenant.name);

    // 2. Update the handle_new_user function
    console.log('Updating handle_new_user function...');
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          default_tenant_id uuid;
          new_role app_role;
          profile_created boolean := false;
        BEGIN
          -- Get the default tenant
          SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'geg' LIMIT 1;
          
          -- If still no tenant, create one as fallback
          IF default_tenant_id IS NULL THEN
            INSERT INTO public.tenants (id, name, slug, email_from, active)
            VALUES (
              gen_random_uuid(),
              'Default Tenant',
              'default',
              'noreply@example.com',
              true
            )
            RETURNING id INTO default_tenant_id;
          END IF;

          -- Determine role from metadata or default to student
          new_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role);

          -- Create profile
          INSERT INTO public.profiles (
            id, tenant_id, email, full_name, role, onboarded
          ) VALUES (
            NEW.id, 
            default_tenant_id, 
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
            new_role,
            false
          );
          
          profile_created := true;

          -- Create user role entry
          INSERT INTO public.user_roles (user_id, role)
          VALUES (NEW.id, new_role)
          ON CONFLICT (user_id, role) DO NOTHING;

          -- Create role-specific records
          IF new_role = 'student'::app_role THEN
            INSERT INTO public.students (tenant_id, profile_id)
            VALUES (default_tenant_id, NEW.id)
            ON CONFLICT (profile_id) DO NOTHING;
          END IF;

          IF new_role = 'agent'::app_role THEN
            INSERT INTO public.agents (tenant_id, profile_id)
            VALUES (default_tenant_id, NEW.id)
            ON CONFLICT (profile_id) DO NOTHING;
          END IF;

          -- Log successful profile creation
          IF profile_created THEN
            RAISE LOG 'Successfully created profile for user % with role %', NEW.id, new_role;
          END IF;

          RETURN NEW;
        EXCEPTION
          WHEN OTHERS THEN
            -- Log the error but don't fail the auth user creation
            RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
            RETURN NEW;
        END;
        $$;
      `
    });

    if (functionError) {
      console.error('Error updating function:', functionError);
    } else {
      console.log('✅ handle_new_user function updated');
    }

    // 3. Ensure the trigger is set up
    console.log('Setting up trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    });

    if (triggerError) {
      console.error('Error setting up trigger:', triggerError);
    } else {
      console.log('✅ Trigger set up successfully');
    }

    // 4. Add necessary policies
    console.log('Adding policies...');
    const policies = [
      "CREATE POLICY IF NOT EXISTS \"Allow profile creation during signup\" ON public.profiles FOR INSERT WITH CHECK (true);",
      "CREATE POLICY IF NOT EXISTS \"Allow user_roles creation during signup\" ON public.user_roles FOR INSERT WITH CHECK (true);",
      "CREATE POLICY IF NOT EXISTS \"Allow students creation during signup\" ON public.students FOR INSERT WITH CHECK (true);",
      "CREATE POLICY IF NOT EXISTS \"Allow agents creation during signup\" ON public.agents FOR INSERT WITH CHECK (true);"
    ];

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy });
      if (policyError) {
        console.error('Error creating policy:', policyError);
      }
    }

    console.log('✅ Policies added');

    console.log('🎉 Database setup completed successfully!');
    console.log('Authentication should now work properly.');

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the setup
setupDatabase();