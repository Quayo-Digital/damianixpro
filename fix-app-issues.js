#!/usr/bin/env node

/**
 * Fix DamianixPro App Issues
 * This script addresses the agent role and property creation issues
 *
 * Requires env (e.g. from repo root `.env`):
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_URL  (or VITE_SUPABASE_URL as fallback for local dev)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function requireEnv(name, value) {
  const v = (value ?? '').trim();
  if (!v) {
    console.error(
      `Missing required env: ${name}\n` +
        'Set it in .env at the repo root or export it before running:\n' +
        '  node fix-app-issues.js',
    );
    process.exit(1);
  }
  return v;
}

const SUPABASE_URL = requireEnv(
  'SUPABASE_URL (or VITE_SUPABASE_URL)',
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
);
const SUPABASE_SERVICE_ROLE_KEY = requireEnv(
  'SUPABASE_SERVICE_ROLE_KEY',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

console.log('🔧 Fixing DamianixPro App Issues...\n');

async function fixAppIssues() {
  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('1. Checking current database state...');
    
    // Check existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`   Found ${users.users.length} users in the system`);
    
    // Check user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    } else {
      console.log(`   Found ${userRoles?.length || 0} user roles`);
      const agentCount = userRoles?.filter(role => role.role === 'agent').length || 0;
      console.log(`   Found ${agentCount} agent users`);
    }
    
    // Check properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, name, price')
      .limit(5);
    
    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
    } else {
      console.log(`   Found ${properties?.length || 0} properties`);
    }

    console.log('\n2. Creating test users...');
    
    // Create test agent user
    const { error: agentError } = await supabase.auth.admin.createUser({
      email: 'agent@nigeriahomes.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Agent',
        role: 'agent'
      }
    });
    
    if (agentError) {
      console.log('   Agent user might already exist:', agentError.message);
    } else {
      console.log('   ✅ Test agent user created');
    }
    
    // Create test owner user
    const { error: ownerError } = await supabase.auth.admin.createUser({
      email: 'owner@nigeriahomes.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Owner',
        role: 'owner'
      }
    });
    
    if (ownerError) {
      console.log('   Owner user might already exist:', ownerError.message);
    } else {
      console.log('   ✅ Test owner user created');
    }

    console.log('\n3. Setting up user profiles and roles...');
    
    // Get the created users
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const agentUserData = allUsers.users.find(u => u.email === 'agent@nigeriahomes.com');
    const ownerUserData = allUsers.users.find(u => u.email === 'owner@nigeriahomes.com');
    
    if (agentUserData) {
      // Create agent profile
      const { error: agentProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: agentUserData.id,
          full_name: 'Test Agent',
          email: 'agent@nigeriahomes.com',
          phone: '+234-800-000-0000',
          role: 'agent'
        });
      
      if (agentProfileError) {
        console.log('   Agent profile error:', agentProfileError.message);
      } else {
        console.log('   ✅ Agent profile created/updated');
      }
      
      // Assign agent role
      const { error: agentRoleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: agentUserData.id,
          role: 'agent'
        });
      
      if (agentRoleError) {
        console.log('   Agent role error:', agentRoleError.message);
      } else {
        console.log('   ✅ Agent role assigned');
      }
    }
    
    if (ownerUserData) {
      // Create owner profile
      const { error: ownerProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: ownerUserData.id,
          full_name: 'Test Owner',
          email: 'owner@nigeriahomes.com',
          phone: '+234-800-000-0001',
          role: 'owner'
        });
      
      if (ownerProfileError) {
        console.log('   Owner profile error:', ownerProfileError.message);
      } else {
        console.log('   ✅ Owner profile created/updated');
      }
      
      // Assign owner role
      const { error: ownerRoleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: ownerUserData.id,
          role: 'owner'
        });
      
      if (ownerRoleError) {
        console.log('   Owner role error:', ownerRoleError.message);
      } else {
        console.log('   ✅ Owner role assigned');
      }
    }

    console.log('\n4. Creating test property...');
    
    if (agentUserData && ownerUserData) {
      const { error: propertyError } = await supabase
        .from('properties')
        .insert({
          name: 'Beautiful 3-Bedroom Apartment in Lekki',
          address: '123 Admiralty Way, Lekki Phase 1, Lagos',
          type: 'apartment',
          price: 250000.00,
          location: 'Lekki, Lagos',
          status: 'available',
          description: 'A modern 3-bedroom apartment with stunning ocean views, fully furnished and ready for immediate occupancy.',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 120.00,
          amenities: ['parking', 'security', 'generator', 'air_conditioning', 'balcony'],
          owner_id: ownerUserData.id,
          agent_id: agentUserData.id
        });
      
      if (propertyError) {
        console.log('   Property creation error:', propertyError.message);
      } else {
        console.log('   ✅ Test property created');
      }
    }

    console.log('\n5. Final verification...');
    
    // Check agent users
    const { data: finalAgents } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'agent');
    
    console.log(`   ✅ Found ${finalAgents?.length || 0} agent users`);
    
    // Check properties
    const { data: finalProperties } = await supabase
      .from('properties')
      .select('id, name, price');
    
    console.log(`   ✅ Found ${finalProperties?.length || 0} properties`);

    console.log('\n🎉 App issues fixed! You can now:');
    console.log('   - Access the app at http://localhost:3000');
    console.log('   - Login with agent@nigeriahomes.com / password123');
    console.log('   - Login with owner@nigeriahomes.com / password123');
    console.log('   - Create and manage properties');
    
  } catch (error) {
    console.error('❌ Error fixing app issues:', error);
  }
}

// Run the fix
fixAppIssues();
