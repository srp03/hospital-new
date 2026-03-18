import { Link } from 'react-router-dom';
import {
    Heart,
    Activity,
    Stethoscope,
    Clock,
    ShieldCheck,
    Users,
    ChevronRight,
    ChevronDown,
    Phone,
    Mail,
    MapPin,
    Facebook,
    Instagram,
    Twitter,
    Menu,
    X,
    Plus,
    Check
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAllDepartments, setShowAllDepartments] = useState(false);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

    // Smooth scroll handler
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setIsMenuOpen(false);
        }
    };

    // Newsletter submit handler
    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        console.log('Newsletter email:', newsletterEmail);
        setNewsletterSubmitted(true);
        setNewsletterEmail('');
    };

    const mainDepartments = [
        { name: 'Cardiology', icon: '🫀' },
        { name: 'Neurology', icon: '🧠' },
        { name: 'Orthopedics', icon: '🦴' },
        { name: 'Pediatrics', icon: '👶' },
    ];

    const additionalDepartments = [
        { name: 'Dermatology', icon: '🩺' },
        { name: 'Ophthalmology', icon: '👁️' },
        { name: 'Psychiatry', icon: '🧘' },
        { name: 'Oncology', icon: '🎗️' },
    ];

    return (
        <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            {/* Header / Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-blue-100/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <motion.div
                            className="flex items-center gap-2 group cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => scrollToSection('home')}
                        >
                            <motion.div
                                className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200"
                                whileHover={{ rotate: 12 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Plus className="w-6 h-6 text-white" />
                            </motion.div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                                City Hospital
                            </span>
                        </motion.div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-10">
                            {[
                                { label: 'Home', id: 'home' },
                                { label: 'About', id: 'about' },
                                { label: 'Services', id: 'services' },
                                { label: 'Contact', id: 'contact' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))}
                            <Link to="/login">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="primary" size="sm" className="px-8 rounded-full shadow-lg hover:shadow-blue-200">
                                        Sign In
                                    </Button>
                                </motion.div>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                {isMenuOpen ? <X /> : <Menu />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white/95 backdrop-blur-lg border-b border-blue-100 overflow-hidden"
                        >
                            <div className="px-4 pt-2 pb-8 space-y-1">
                                {[
                                    { label: 'Home', id: 'home' },
                                    { label: 'About', id: 'about' },
                                    { label: 'Services', id: 'services' },
                                    { label: 'Contact', id: 'contact' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => scrollToSection(item.id)}
                                        className="block w-full text-left px-3 py-4 text-base font-semibold text-gray-700 border-b border-gray-50"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                <div className="pt-6">
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="primary" fullWidth size="lg">Sign In</Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-36 bg-white">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50/50 -z-10 rounded-l-[100px] hidden lg:block"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7 }}
                            className="flex-1 text-center lg:text-left space-y-10"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold shadow-sm ring-1 ring-blue-100"
                            >
                                <Activity className="w-4 h-4" />
                                <span className="uppercase tracking-widest text-[10px]">Your Health Our Priority</span>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-6xl lg:text-[84px] font-black text-gray-900 leading-[0.95] tracking-tight"
                            >
                                Health <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-500">
                                    Comes First
                                </span>
                                <br />
                                <span className="text-blue-400">Checkup Here</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-gray-500 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0"
                            >
                                Empowering patients with seamless appointment booking, digital records, and 24/7 specialist care access.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
                            >
                                <Link to="/register" className="w-full sm:w-auto">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button size="xl" className="w-full sm:w-auto px-12 rounded-2xl shadow-2xl shadow-blue-200 font-bold">
                                            Book Appointment
                                        </Button>
                                    </motion.div>
                                </Link>
                                <Link to="/login" className="w-full sm:w-auto">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button variant="ghost" size="xl" className="w-full sm:w-auto px-12 rounded-2xl border-2 border-blue-100 hover:bg-blue-50 hover:border-blue-200 font-bold text-blue-600">
                                            Patient Login
                                        </Button>
                                    </motion.div>
                                </Link>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                transition={{ delay: 0.6 }}
                                className="flex items-center justify-center lg:justify-start gap-8 pt-8"
                            >
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm font-bold text-gray-900 leading-tight">
                                    Trusted by 10k+ <br /> Patients Worldwide
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7 }}
                            className="flex-1 relative"
                        >
                            <div className="absolute -inset-10 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-[100px] -z-10 animate-pulse"></div>
                            {/* Decorative floating elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute top-10 left-10 w-4 h-4 rounded-full bg-blue-400/40"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute bottom-20 right-20 w-3 h-3 rounded-full bg-red-400/40"
                            />
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                <Plus className="absolute top-20 right-10 w-8 h-8 text-blue-100" />
                            </motion.div>
                            <motion.div
                                animate={{ rotate: [0, -360] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            >
                                <Heart className="absolute bottom-10 left-0 w-6 h-6 text-cyan-100" />
                            </motion.div>

                            <motion.img
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                src="/hospital_illustration.png"
                                alt="Modern Hospital Building"
                                className="relative w-full max-w-xl mx-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)]"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-32 bg-gray-50/50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto mb-20 space-y-6"
                    >
                        <h2 className="text-blue-600 font-black tracking-[0.2em] uppercase text-xs">Our Services</h2>
                        <h3 className="text-5xl font-extrabold text-gray-900 leading-tight">Advanced Care For You</h3>
                        <p className="text-gray-500 text-xl font-medium">Premium medical services designed around patient comfort and scientific excellence.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'Appointments', icon: Clock, desc: 'Schedule specialist visits instantly.', color: 'from-blue-500 to-blue-700' },
                            { title: 'Lab Reports', icon: Activity, desc: 'Secure digital access to your results.', color: 'from-cyan-500 to-cyan-600' },
                            { title: 'Prescriptions', icon: Stethoscope, desc: 'Manage medications with ease.', color: 'from-indigo-500 to-indigo-600' },
                            { title: 'Emergency', icon: ShieldCheck, desc: '24/7 priority emergency response.', color: 'from-blue-600 to-indigo-700' },
                        ].map((service, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="group p-1 bg-gradient-to-br from-white to-blue-50/50 rounded-[40px] hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 border border-blue-100/50"
                            >
                                <div className="p-8 h-full rounded-[38px] bg-white group-hover:bg-blue-50/10 transition-colors">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 6 }}
                                        transition={{ duration: 0.3 }}
                                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-8 shadow-xl shadow-blue-100`}
                                    >
                                        <service.icon className="w-8 h-8 text-white" />
                                    </motion.div>
                                    <h4 className="text-2xl font-black text-gray-900 mb-4">{service.title}</h4>
                                    <p className="text-gray-500 leading-relaxed font-medium mb-8">{service.desc}</p>
                                    <div className="flex items-center text-blue-600 font-black text-sm uppercase tracking-widest cursor-pointer group-hover:gap-3 transition-all">
                                        Detail <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Departments Section */}
            <section className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="max-w-2xl space-y-6"
                        >
                            <h3 className="text-5xl font-black text-gray-900 leading-tight">Specialized <br /><span className="text-blue-600">Departments</span></h3>
                            <p className="text-gray-500 text-xl font-medium">World-class specialized medical care across all major disciplines.</p>
                        </motion.div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAllDepartments(!showAllDepartments)}
                            className="rounded-2xl border-2 border-blue-50 text-blue-600 font-black py-4 px-10 hover:bg-blue-50 hover:border-blue-100 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                        >
                            {showAllDepartments ? 'Show Less' : 'View All Departments'}
                            <motion.div
                                animate={{ rotate: showAllDepartments ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDown className="w-4 h-4" />
                            </motion.div>
                        </motion.button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {mainDepartments.map((dept, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -8, scale: 1.05 }}
                                className="relative group overflow-hidden bg-white p-10 rounded-[40px] text-center border border-blue-50 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-500"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -z-10 group-hover:scale-[3] transition-transform duration-700 opacity-30"></div>
                                <motion.div
                                    whileHover={{ scale: 1.25, rotate: -12 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-6xl mb-8 drop-shadow-lg"
                                >
                                    {dept.icon}
                                </motion.div>
                                <h4 className="text-2xl font-black text-gray-900">{dept.name}</h4>
                            </motion.div>
                        ))}
                    </div>

                    {/* Additional Departments with Animation */}
                    <AnimatePresence>
                        {showAllDepartments && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.5 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
                                    {additionalDepartments.map((dept, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            transition={{ delay: idx * 0.1 }}
                                            whileHover={{ y: -8, scale: 1.05 }}
                                            className="relative group overflow-hidden bg-white p-10 rounded-[40px] text-center border border-blue-50 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-500"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -z-10 group-hover:scale-[3] transition-transform duration-700 opacity-30"></div>
                                            <motion.div
                                                whileHover={{ scale: 1.25, rotate: -12 }}
                                                transition={{ duration: 0.3 }}
                                                className="text-6xl mb-8 drop-shadow-lg"
                                            >
                                                {dept.icon}
                                            </motion.div>
                                            <h4 className="text-2xl font-black text-gray-900">{dept.name}</h4>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* About / Learn More Section */}
            <section id="about" className="py-32 bg-blue-50/40 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-4xl mx-auto mb-20 space-y-8"
                    >
                        <h2 className="text-blue-600 font-black tracking-[0.2em] uppercase text-xs">About Us</h2>
                        <h3 className="text-5xl font-black text-gray-900 leading-tight">Learn More About <span className="text-blue-600">City Hospital</span></h3>
                        <p className="text-gray-600 text-xl leading-relaxed font-medium">
                            City Hospital is a premier healthcare provider dedicated to innovation and human-centered design. Since 2010, we have integrated cutting-edge medical technology with warm human compassion to provide a unique healing experience.
                        </p>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row items-center gap-24">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex-1 relative order-2 lg:order-1"
                        >
                            <div className="relative h-[600px] w-full max-w-md mx-auto">
                                <div className="absolute top-0 right-0 w-full h-[500px] bg-blue-600 rounded-[100px] rotate-6"></div>
                                <div className="absolute top-0 right-0 w-full h-[500px] bg-gray-900 rounded-[100px] -rotate-3 overflow-hidden shadow-2xl">
                                    <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800" alt="Specialist" className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-1000" />
                                </div>
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[40px] shadow-2xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                                            <ShieldCheck className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-2xl font-black text-gray-900 tracking-tighter leading-none">100%</div>
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Verified Doctors</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex-1 space-y-12 order-1 lg:order-2"
                        >
                            <div className="space-y-6">
                                <h2 className="text-blue-600 font-black tracking-[0.2em] uppercase text-xs">Why Choose Us</h2>
                                <h3 className="text-6xl font-black text-gray-900 leading-[0.95]">Health Care With <br /><span className="text-blue-500 tracking-tighter">Human Touch</span></h3>
                                <p className="text-gray-500 text-xl font-medium leading-relaxed">We blend cutting-edge medical technology with warm human compassion to provide a unique healing experience.</p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8 pt-4">
                                {[
                                    { title: 'Secure Records', icon: ShieldCheck, desc: 'Encrypted & Private' },
                                    { title: 'Top Doctors', icon: Users, desc: 'Verified Experts' },
                                    { title: '24/7 Access', icon: Clock, desc: 'Patient Portal' },
                                    { title: 'Modern Labs', icon: Activity, desc: 'Quick Results' },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex gap-4 items-center group"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1, backgroundColor: '#2563eb' }}
                                            className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-lg transition-colors duration-300"
                                        >
                                            <item.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                                        </motion.div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-lg font-black text-gray-900">{item.title}</h4>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-gray-950 text-white pt-32 pb-16 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-20">
                        <div className="space-y-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                                    <Plus className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-2xl font-black tracking-tighter">City Hospital</span>
                            </div>
                            <p className="text-gray-400 text-lg leading-relaxed font-medium">
                                Providing premium healthcare through innovation and human-centered design since 2010.
                            </p>
                            <div className="flex gap-4">
                                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                                    <motion.a
                                        key={i}
                                        href="#"
                                        whileHover={{ scale: 1.1, backgroundColor: '#2563eb' }}
                                        className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-all duration-300"
                                    >
                                        <Icon className="w-5 h-5 text-gray-300" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-10 pt-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Quick Links</h4>
                            <ul className="space-y-5 text-gray-400 font-bold text-sm">
                                {[
                                    { label: 'Home', id: 'home' },
                                    { label: 'About Us', id: 'about' },
                                    { label: 'Services', id: 'services' },
                                    { label: 'Contact', id: 'contact' }
                                ].map((link) => (
                                    <li key={link.id}>
                                        <button onClick={() => scrollToSection(link.id)} className="hover:text-white transition-colors">
                                            {link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-10 pt-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Get In Touch</h4>
                            <ul className="space-y-8 font-medium">
                                {[
                                    { icon: Phone, text: '+91 98765 43210' },
                                    { icon: Mail, text: 'hello@cityhospital.com' },
                                    { icon: MapPin, text: 'Medical Hub, City Health St, NY' },
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 items-start text-gray-400">
                                        <item.icon className="w-6 h-6 text-blue-500 shrink-0" />
                                        <span className="text-sm leading-tight">{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-10 pt-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Newsletter</h4>
                            <p className="text-gray-400 font-medium">Join 5000+ patients getting our health updates.</p>

                            <AnimatePresence mode="wait">
                                {!newsletterSubmitted ? (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        onSubmit={handleNewsletterSubmit}
                                        className="relative group"
                                    >
                                        <input
                                            type="email"
                                            value={newsletterEmail}
                                            onChange={(e) => setNewsletterEmail(e.target.value)}
                                            placeholder="Email address"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-blue-600 outline-none transition-all group-hover:border-white/20"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-bold transition-all"
                                        >
                                            Join
                                        </motion.button>
                                    </motion.form>
                                ) : (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex items-center gap-3"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0"
                                        >
                                            <Check className="w-5 h-5 text-white" />
                                        </motion.div>
                                        <p className="text-green-400 font-bold text-sm">Success! You are now subscribed.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="pt-16 border-t border-white/5 text-center sm:flex sm:justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                        <p>&copy; {new Date().getFullYear()} City Hospital. Patient First always.</p>
                        <div className="flex justify-center gap-8 mt-4 sm:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
