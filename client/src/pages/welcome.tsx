import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, CreditCard, ShieldCheck, BarChart3, Menu, X, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Welcome() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            {/* Navigation */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"
                    }`}
            >
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-white">B</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">BookerOS</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Características</a>
                        <a href="#testimonials" className="text-sm text-gray-300 hover:text-white transition-colors">Testimonios</a>
                        <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Precios</a>
                        <Link href="/auth">
                            <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/5">
                                Iniciar Sesión
                            </Button>
                        </Link>
                        <Link href="/auth">
                            <Button className="bg-white text-black hover:bg-gray-200 font-medium rounded-full px-6">
                                Comenzar Ahora
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-black pt-24 px-6 md:hidden"
                    >
                        <div className="flex flex-col gap-6 text-center">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium text-gray-300">Características</a>
                            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium text-gray-300">Testimonios</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium text-gray-300">Precios</a>
                            <Link href="/auth">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 mt-4">
                                    Comenzar Ahora
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-medium mb-6">
                            ✨ La plataforma definitiva para turismo
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 bg-gradient-to-r from-white via-blue-100 to-gray-400 bg-clip-text text-transparent">
                            Gestiona tu operación <br className="hidden md:block" />
                            turística sin fricción.
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                            Desde reservas y pagos hasta check-in y marketing automatizado.
                            Todo lo que necesitas para escalar tu negocio de tours y experiencias en un solo lugar.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/auth">
                                <Button className="h-14 px-8 rounded-full text-lg bg-blue-600 hover:bg-blue-500 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105">
                                    Empezar Gratis <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="#demo">
                                <Button variant="outline" className="h-14 px-8 rounded-full text-lg border-white/20 hover:bg-white/5 bg-transparent">
                                    Ver Demo
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Dashboard Preview Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-20 relative mx-auto max-w-5xl"
                    >
                        <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900/50 backdrop-blur-sm aspect-[16/9] group">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10" />
                            {/* This would be an actual dashboard screenshot or generated image */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-600">
                                <div className="flex flex-col items-center gap-4">
                                    <BarChart3 className="h-24 w-24 opacity-20" />
                                    <span className="text-xl font-medium opacity-40">Dashboard Preview</span>
                                </div>
                            </div>

                            {/* Floating UI Elements */}
                            <div className="absolute top-10 left-10 z-20 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl flex items-center gap-4 transform -rotate-1 group-hover:rotate-0 transition-transform duration-500">
                                <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Ingresos Hoy</p>
                                    <p className="text-lg font-bold text-white">$24,500 MXN</p>
                                </div>
                            </div>

                            <div className="absolute bottom-10 right-10 z-20 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl flex items-center gap-4 transform rotate-2 group-hover:rotate-0 transition-transform duration-500">
                                <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Pasajeros Abordados</p>
                                    <p className="text-lg font-bold text-white">45 / 50</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-black relative">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Todo bajo control.</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Diseñado específicamente para operadores de tours, transportadoras y experiencias.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Calendar className="h-8 w-8 text-blue-400" />}
                            title="Agenda Visual"
                            description="Visualiza ocupación, bloquea fechas y gestiona salidas diarias con una interfaz intuitiva tipo calendario."
                        />
                        <FeatureCard
                            icon={<CreditCard className="h-8 w-8 text-purple-400" />}
                            title="Pagos & Stripe Connect"
                            description="Automatiza cobros, divide comisiones automáticamente y gestiona reembolsos sin dolores de cabeza."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="h-8 w-8 text-green-400" />}
                            title="Check-in App"
                            description="Escanea códigos QR en el muelle. Sincronización en tiempo real para un abordaje rápido y seguro."
                        />
                    </div>
                </div>
            </section>

            {/* Analytics Section */}
            <section className="py-20 border-t border-white/5 bg-gradient-to-b from-black to-gray-900">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            Decisiones basadas en <br />
                            <span className="text-blue-500">datos reales</span>.
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                            Deja de adivinar. Obtén reportes detallados de ventas por canal, rendimiento de afiliados y proyecciones de ingresos.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-300">
                                <CheckCircle2 className="h-5 w-5 text-blue-500" /> Reportes de ocupación histórica
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <CheckCircle2 className="h-5 w-5 text-blue-500" /> Cálculo automático de comisiones
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <CheckCircle2 className="h-5 w-5 text-blue-500" /> Exportación a CSV/Excel
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative border border-white/10 rounded-xl p-8 bg-black/50 backdrop-blur-md">
                            {/* Abstract Chart Representation */}
                            <div className="flex items-end justify-between h-48 gap-2">
                                {[40, 60, 45, 90, 75, 50, 80].map((h, i) => (
                                    <div key={i} className="w-full bg-blue-600/20 rounded-t-sm relative group overflow-hidden" style={{ height: `${h}%` }}>
                                        <div className="absolute bottom-0 left-0 right-0 h-0 bg-blue-500 transition-all duration-1000 ease-out group-hover:h-full" style={{ height: `${h}%` }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5" />
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8">¿Listo para escalar?</h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Únete a las empresas líderes que ya gestionan su operación con BookerOS.
                    </p>
                    <Link href="/auth">
                        <Button className="h-16 px-10 rounded-full text-xl bg-white text-black hover:bg-gray-200 shadow-xl transition-transform hover:scale-105">
                            Crear Cuenta Gratis
                        </Button>
                    </Link>
                    <p className="mt-6 text-sm text-gray-500">
                        No se requiere tarjeta de crédito · Setup en 5 minutos
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-12 bg-black">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center opacity-60">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <div className="h-6 w-6 bg-white/20 rounded-md" />
                        <span className="font-bold">BookerOS</span>
                    </div>
                    <div className="flex gap-8 text-sm">
                        <a href="#" className="hover:text-white">Privacidad</a>
                        <a href="#" className="hover:text-white">Términos</a>
                        <Link href="/guide" className="hover:text-white">Guía</Link>
                        <a href="#" className="hover:text-white">Soporte</a>
                    </div>
                    <div className="mt-4 md:mt-0 text-sm">
                        &copy; 2026 BookerOS. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/10 transition-all group">
            <div className="mb-6 p-4 rounded-xl bg-black border border-white/10 w-fit group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <p className="text-gray-400 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
