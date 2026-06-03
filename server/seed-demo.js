require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function run() {
  console.log('Starting seed-demo script...');
  try {
    const pwdHash = await bcrypt.hash('staff123', 12);

    // 1. Get Admins
    const { data: admins, error: adminsErr } = await supabase
      .from('business_admins')
      .select('*');

    if (adminsErr || !admins || admins.length === 0) {
      console.error('No admins found in the database. Please ensure you ran the schema.sql.', adminsErr);
      return;
    }

    console.log(`Found ${admins.length} admins.`);

    const adminEmailMap = {};
    admins.forEach(a => {
      adminEmailMap[a.email.toLowerCase()] = a;
    });

    const demoData = [
      {
        adminEmail: 'admin@gmail.com',
        bizName: 'City Dental Clinic',
        category: 'clinic',
        address: '101 Medical Plaza, Sector 15',
        branch: 'Downtown Branch',
        avgServiceTime: 15,
        staff: {
          name: 'Veena',
          email: 'veena@gmail.com',
          phone: '+91 9233654789'
        }
      },
      {
        adminEmail: 'admin@smartqueue.com',
        bizName: 'Vibrant Hair Salon',
        category: 'salon',
        address: 'Suite 202, Fashion Boulevard',
        branch: 'West Side',
        avgServiceTime: 30,
        staff: {
          name: 'Priya Sharma',
          email: 'priya@clinic.com',
          phone: '+91 90000 00000'
        }
      },
      {
        adminEmail: 'admin@smart.com',
        bizName: 'Apex Bank',
        category: 'bank',
        address: 'Apex Towers, Financial District',
        branch: 'City Center',
        avgServiceTime: 10,
        staff: {
          name: 'Rahul Kumar',
          email: 'rahul@bank.com',
          phone: '+91 98888 77777'
        }
      }
    ];

    const todayStr = new Date().toISOString().split('T')[0];

    for (const item of demoData) {
      const admin = adminEmailMap[item.adminEmail.toLowerCase()];
      if (!admin) {
        console.warn(`Admin with email ${item.adminEmail} not found, skipping this business.`);
        continue;
      }

      console.log(`\nSetting up demo data for admin: ${admin.email}`);

      // Create/Get Business
      let { data: business, error: bizErr } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', admin.id)
        .eq('name', item.bizName)
        .maybeSingle();

      if (bizErr) {
        console.error(`Error querying business ${item.bizName}:`, bizErr);
        continue;
      }

      if (!business) {
        console.log(`Creating business "${item.bizName}"...`);
        const { data: newBiz, error: newBizErr } = await supabase
          .from('businesses')
          .insert({
            owner_id: admin.id,
            name: item.bizName,
            category: item.category,
            address: item.address,
            branch: item.branch,
            avg_service_time: item.avgServiceTime
          })
          .select()
          .single();

        if (newBizErr) {
          console.error(`Failed to create business "${item.bizName}":`, newBizErr);
          if (newBizErr.code === '42501') {
            console.error('\n>>> ERROR: Row-Level Security (RLS) is blocking inserts into "businesses". Please disable RLS or add a policy in the Supabase Dashboard. <<<\n');
          }
          continue;
        }
        business = newBiz;
      }
      console.log(`Business "${business.name}" ready with ID: ${business.id}`);

      // Create/Get Staff
      let { data: staff, error: staffQueryErr } = await supabase
        .from('staff')
        .select('*')
        .eq('email', item.staff.email)
        .maybeSingle();

      if (staffQueryErr) {
        console.error(`Error querying staff ${item.staff.email}:`, staffQueryErr);
        continue;
      }

      if (!staff) {
        console.log(`Creating staff member "${item.staff.name}" (${item.staff.email})...`);
        const { data: newStaff, error: newStaffErr } = await supabase
          .from('staff')
          .insert({
            business_id: business.id,
            admin_id: admin.id,
            name: item.staff.name,
            email: item.staff.email,
            phone: item.staff.phone,
            password_hash: pwdHash
          })
          .select()
          .single();

        if (newStaffErr) {
          console.error(`Failed to create staff "${item.staff.name}":`, newStaffErr);
          continue;
        }
        staff = newStaff;
      }
      console.log(`Staff member "${staff.name}" ready.`);

      // Create some time slots for today if none exist
      const { data: existingSlots, error: slotsQueryErr } = await supabase
        .from('slots')
        .select('*')
        .eq('business_id', business.id)
        .eq('date', todayStr);

      if (slotsQueryErr) {
        console.error(`Error checking slots:`, slotsQueryErr);
        continue;
      }

      if (existingSlots.length === 0) {
        console.log(`Creating default slots for today (${todayStr})...`);
        const slotTimes = [
          { start: '09:00:00', end: '12:00:00' },
          { start: '13:00:00', end: '17:00:00' }
        ];

        for (const slot of slotTimes) {
          const { error: slotCreateErr } = await supabase
            .from('slots')
            .insert({
              business_id: business.id,
              date: todayStr,
              start_time: slot.start,
              end_time: slot.end,
              max_capacity: 15,
              booked_count: 0,
              is_active: true
            });
          if (slotCreateErr) {
            console.error(`Failed to create slot ${slot.start}-${slot.end}:`, slotCreateErr);
          }
        }
        console.log('Slots created.');
      } else {
        console.log(`Slots for today (${todayStr}) already exist.`);
      }
    }

    console.log('\nSeeding completed successfully!');
  } catch (e) {
    console.error('Unhandled error during seeding:', e);
  }
}

run();
