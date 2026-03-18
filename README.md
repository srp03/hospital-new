# Hospital Management System

A complete, patient-friendly Hospital Management System built with React, Vite, Tailwind CSS, and Supabase.

## Features

- 🏥 **4 Role-based Dashboards**: Patient, Doctor, Lab Technician, Admin
- 🔒 **Secure Authentication**: Supabase Auth with Row Level Security
- 💊 **Prescription Management**: Doctors can create and manage prescriptions
- 🔬 **Lab Management**: Request tests, upload reports with drag & drop
- 💰 **Billing System**: Track patient bills and payments
- 📱 **Responsive Design**: Works on all devices
- 🎨 **Beautiful UI**: Soft colors, rounded corners, friendly design

## Quick Start

### 1. Install Dependencies
```bash
cd hospital
npm install
```

### 2. Set Up Supabase

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Run the following files in order:
   - `supabase/schema.sql` - Creates all tables
   - `supabase/rls_policies.sql` - Sets up security
   - `supabase/seed.sql` - Adds sample data (beds)

### 3. Create Test Users

In Supabase Dashboard > Authentication > Users, create these users:

| Email | Password | Role |
|-------|----------|------|
| patient@test.com | password123 | Patient |
| doctor@test.com | password123 | Doctor |
| lab@test.com | password123 | Lab Tech |
| admin@test.com | password123 | Admin |

After creating users, run the profile/role inserts from `seed.sql` with actual user IDs.

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

## Project Structure

```
hospital/
├── src/
│   ├── components/
│   │   ├── ui/         # Button, Card, Input, Modal, Badge
│   │   ├── layout/     # Sidebar, DashboardLayout, ProtectedRoute
│   │   └── shared/     # LoadingSpinner, EmptyState
│   ├── pages/
│   │   ├── auth/       # Login, Register
│   │   ├── patient/    # PatientDashboard
│   │   ├── doctor/     # DoctorDashboard
│   │   ├── lab/        # LabDashboard
│   │   └── admin/      # AdminDashboard
│   ├── contexts/       # AuthContext
│   ├── lib/            # supabase.js
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── schema.sql      # Database tables
│   ├── rls_policies.sql # Security policies
│   └── seed.sql        # Sample data
└── index.html
```

## Test Flow

1. **Patient Registration**
   - Go to `/register`
   - Fill in details
   - Get auto-generated Patient ID

2. **Doctor Prescribes**
   - Login as doctor@test.com
   - Search for patient
   - Add vitals, create prescription, request lab test

3. **Lab Uploads Report**
   - Login as lab@test.com
   - Find pending test
   - Mark as collected, then upload report

4. **Patient Views Data**
   - Login as the patient
   - See vitals, prescriptions, lab reports on dashboard

5. **Admin Monitors**
   - Login as admin@test.com
   - View stats, manage billing

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Icons**: Heroicons (inline SVG)
- **Notifications**: react-hot-toast

## License

MIT
