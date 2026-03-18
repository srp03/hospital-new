require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Bed = require('./models/Bed');
const Department = require('./models/Department');
const Profile = require('./models/Profile');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const LabTechnician = require('./models/LabTechnician');
const generatePatientUid = require('./utils/generatePatientUid');

const seedData = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // ============================
  // Seed Departments
  // ============================
  const departments = [
    { name: 'General Medicine', description: 'Primary care and internal medicine' },
    { name: 'Cardiology', description: 'Heart and cardiovascular system' },
    { name: 'Neurology', description: 'Brain and nervous system' },
    { name: 'Orthopedics', description: 'Musculoskeletal system' },
    { name: 'Pediatrics', description: 'Child healthcare' },
    { name: 'Dermatology', description: 'Skin conditions' },
    { name: 'Gynecology', description: 'Female reproductive health' },
    { name: 'Oncology', description: 'Cancer treatment' },
    { name: 'Emergency', description: 'Emergency and trauma care' },
    { name: 'Laboratory', description: 'Diagnostic testing' },
  ];

  for (const dept of departments) {
    await Department.findOneAndUpdate(
      { name: dept.name },
      dept,
      { upsert: true, new: true }
    );
  }
  console.log(`  ✅ ${departments.length} departments seeded`);

  // ============================
  // Seed Beds
  // ============================
  const beds = [
    { bed_number: 'A-101', ward: 'General Ward', bed_type: 'general', is_available: true, daily_rate: 500 },
    { bed_number: 'A-102', ward: 'General Ward', bed_type: 'general', is_available: true, daily_rate: 500 },
    { bed_number: 'A-103', ward: 'General Ward', bed_type: 'general', is_available: true, daily_rate: 500 },
    { bed_number: 'B-201', ward: 'Semi-Private', bed_type: 'semi-private', is_available: true, daily_rate: 1000 },
    { bed_number: 'B-202', ward: 'Semi-Private', bed_type: 'semi-private', is_available: true, daily_rate: 1000 },
    { bed_number: 'C-301', ward: 'Private', bed_type: 'private', is_available: true, daily_rate: 2000 },
    { bed_number: 'C-302', ward: 'Private', bed_type: 'private', is_available: true, daily_rate: 2000 },
    { bed_number: 'ICU-01', ward: 'ICU', bed_type: 'icu', is_available: true, daily_rate: 5000 },
    { bed_number: 'ICU-02', ward: 'ICU', bed_type: 'icu', is_available: true, daily_rate: 5000 },
    { bed_number: 'ICU-03', ward: 'ICU', bed_type: 'icu', is_available: true, daily_rate: 5000 },
  ];

  for (const bed of beds) {
    await Bed.findOneAndUpdate(
      { bed_number: bed.bed_number },
      bed,
      { upsert: true, new: true }
    );
  }
  console.log(`  ✅ ${beds.length} beds seeded`);

  // ============================
  // Seed Users (all roles)
  // ============================
  const seedUsers = [
    {
      email: 'admin@hospital.com',
      password: 'admin123',
      full_name: 'Admin User',
      role: 'admin',
    },
    {
      email: 'doctor@hospital.com',
      password: 'doctor123',
      full_name: 'Dr. Raj Mehta',
      role: 'doctor',
    },
    {
      email: 'patient@hospital.com',
      password: 'patient123',
      full_name: 'Amit Sharma',
      role: 'patient',
    },
    {
      email: 'lab@hospital.com',
      password: 'lab123',
      full_name: 'Ravi Kumar',
      role: 'lab',
    },
  ];

  for (const user of seedUsers) {
    const existing = await Profile.findOne({ email: user.email });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      const profile = await Profile.create({
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: null,
        password: hashedPassword,
      });

      console.log(`  ✅ ${user.role} user created (${user.email} / ${user.password})`);

      // Create role-specific records
      if (user.role === 'doctor') {
        const existingDoc = await Doctor.findOne({ user_id: profile._id });
        if (!existingDoc) {
          await Doctor.create({
            user_id: profile._id,
            full_name: user.full_name,
            specialization: 'General Medicine',
            qualification: 'MBBS, MD',
            experience_years: 10,
            consultation_fee: 500,
          });
          console.log(`     └─ Doctor record created for ${user.full_name}`);
        }
      }

      if (user.role === 'patient') {
        const existingPat = await Patient.findOne({ user_id: profile._id });
        if (!existingPat) {
          const patient_uid = await generatePatientUid();
          await Patient.create({
            user_id: profile._id,
            patient_uid,
            full_name: user.full_name,
            age: 30,
            gender: 'male',
            blood_group: 'O+',
            phone: '9876543210',
          });
          console.log(`     └─ Patient record created for ${user.full_name} (${patient_uid})`);
        }
      }

      if (user.role === 'lab') {
        const existingTech = await LabTechnician.findOne({ user_id: profile._id });
        if (!existingTech) {
          await LabTechnician.create({
            user_id: profile._id,
            full_name: user.full_name,
            specialization: 'Clinical Pathology',
          });
          console.log(`     └─ Lab Technician record created for ${user.full_name}`);
        }
      }
    } else {
      console.log(`  ℹ️  ${user.role} user already exists (${user.email})`);

      // Ensure role-specific records exist even if profile already exists
      if (user.role === 'doctor') {
        const existingDoc = await Doctor.findOne({ user_id: existing._id });
        if (!existingDoc) {
          await Doctor.create({
            user_id: existing._id,
            full_name: existing.full_name,
            specialization: 'General Medicine',
            qualification: 'MBBS, MD',
            experience_years: 10,
            consultation_fee: 500,
          });
          console.log(`     └─ Doctor record created for ${existing.full_name}`);
        }
      }

      if (user.role === 'patient') {
        const existingPat = await Patient.findOne({ user_id: existing._id });
        if (!existingPat) {
          const patient_uid = await generatePatientUid();
          await Patient.create({
            user_id: existing._id,
            patient_uid,
            full_name: existing.full_name,
            age: 30,
            gender: 'male',
            blood_group: 'O+',
            phone: '9876543210',
          });
          console.log(`     └─ Patient record created for ${existing.full_name} (${patient_uid})`);
        }
      }

      if (user.role === 'lab') {
        const existingTech = await LabTechnician.findOne({ user_id: existing._id });
        if (!existingTech) {
          await LabTechnician.create({
            user_id: existing._id,
            full_name: existing.full_name,
            specialization: 'Clinical Pathology',
          });
          console.log(`     └─ Lab Technician record created for ${existing.full_name}`);
        }
      }
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Test credentials:');
  console.log('   Admin:   admin@hospital.com   / admin123');
  console.log('   Doctor:  doctor@hospital.com  / doctor123');
  console.log('   Patient: patient@hospital.com / patient123');
  console.log('   Lab:     lab@hospital.com     / lab123');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
