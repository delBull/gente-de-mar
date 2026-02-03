import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    BookOpen,
    Calendar,
    QrCode,
    CreditCard,
    LayoutDashboard,
    Users,
    Settings,
    ChevronRight,
    HelpCircle
} from "lucide-react";

export default function Guide() {
    const [activeSection, setActiveSection] = useState("intro");

    const sections = [
        { id: "intro", label: "Introducción", icon: <BookOpen className="h-4 w-4" /> },
        { id: "agenda", label: "Agenda y Reservas", icon: <Calendar className="h-4 w-4" /> },
        { id: "check-in", label: "App de Check-in", icon: <QrCode className="h-4 w-4" /> },
        { id: "finance", label: "Finanzas y Pagos", icon: <CreditCard className="h-4 w-4" /> },
        { id: "customers", label: "Clientes", icon: <Users className="h-4 w-4" /> },
    ];

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-6 p-6">
            {/* Sidebar Navigation */}
            <Card className="w-64 flex-shrink-0 h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-500" />
                        Guía de Uso
                    </CardTitle>
                    <CardDescription>Documentación interna</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-12rem)]">
                        <div className="flex flex-col p-2 gap-1">
                            {sections.map((section) => (
                                <Button
                                    key={section.id}
                                    variant={activeSection === section.id ? "secondary" : "ghost"}
                                    className="justify-start gap-3"
                                    onClick={() => setActiveSection(section.id)}
                                >
                                    {section.icon}
                                    {section.label}
                                    {activeSection === section.id && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Content Area */}
            <Card className="flex-1 h-full overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-8 max-w-4xl mx-auto space-y-8">
                        {activeSection === "intro" && <IntroSection />}
                        {activeSection === "agenda" && <AgendaSection />}
                        {activeSection === "check-in" && <CheckInSection />}
                        {activeSection === "finance" && <FinanceSection />}
                        {activeSection === "customers" && <CustomersSection />}
                    </div>
                </ScrollArea>
            </Card>
        </div>
    );
}

function IntroSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">Bienvenido a BookerOS</h1>
                <p className="text-gray-500 text-lg">La plataforma integral para la gestión de su operación turística.</p>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
                <p>
                    Esta guía está diseñada para ayudar a administradores y staff operativos a sacar el máximo provecho de la plataforma.
                    Navegue por el menú de la izquierda para encontrar instrucciones detalladas sobre cada módulo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                    <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                        <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Para Administradores</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside text-gray-600 dark:text-gray-300">
                            <li>Gestión financiera y reportes</li>
                            <li>Configuración de tours y precios</li>
                            <li>Administración de usuarios</li>
                        </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-900/10">
                        <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">Para Staff Operativo</h3>
                        <ul className="text-sm space-y-1 list-disc list-inside text-gray-600 dark:text-gray-300">
                            <li>Check-in de pasajeros (QR)</li>
                            <li>Consulta de manifiestos</li>
                            <li>Verificación de reservas</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AgendaSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">Agenda y Reservas</h1>
                <p className="text-gray-500">Gestione su disponibilidad y visualice la ocupación.</p>
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        Código de Colores
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="p-4 border rounded-lg flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-green-500" />
                            <div>
                                <p className="font-medium">Disponible</p>
                                <p className="text-xs text-gray-500">Ocupación baja / media</p>
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-yellow-500" />
                            <div>
                                <p className="font-medium">Limitado</p>
                                <p className="text-xs text-gray-500">Últimos lugares</p>
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                            <div>
                                <p className="font-medium">Lleno / Bloqueado</p>
                                <p className="text-xs text-gray-500">Sin disponibilidad</p>
                            </div>
                        </div>
                    </div>
                </section>

                <Separator />

                <section>
                    <h2 className="text-xl font-semibold mb-4">Bloqueo Rápido de Fechas</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Para cerrar ventas en una fecha específica (por clima, mantenimiento o evento privado):
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-4">
                        <li>Vaya a la vista de <strong>Agenda</strong>.</li>
                        <li>Haga clic en la fecha deseada.</li>
                        <li>Seleccione la opción <strong>"Bloquear Fecha"</strong> en el panel lateral.</li>
                        <li>Ingrese el motivo (opcional) y confirme.</li>
                    </ol>
                </section>
            </div>
        </div>
    );
}

function CheckInSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">App de Check-in</h1>
                <p className="text-gray-500">Control de abordaje y verificación de tickets.</p>
            </div>

            <div className="bg-slate-950 text-white p-6 rounded-xl border border-slate-800">
                <h3 className="text-lg font-semibold mb-2 text-blue-400">Acceso Rápido</h3>
                <p className="mb-4 text-sm text-slate-400">
                    El personal de muelle puede acceder a la versión simplificada desde cualquier móvil:
                </p>
                <code className="bg-black px-4 py-2 rounded text-green-400 font-mono text-sm block w-fit mb-4">
                    /check-in
                </code>
                <p className="text-xs text-slate-500">Nota: Requiere inicio de sesión con cuenta de staff.</p>
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4">Proceso de Abordaje</h2>
                <div className="space-y-4">
                    <div className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                        <div>
                            <h4 className="font-medium">Escanear QR</h4>
                            <p className="text-sm text-gray-500">Utilice la cámara del dispositivo para escanear el código QR en el boleto del cliente (digital o impreso).</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                        <div>
                            <h4 className="font-medium">Verificar Datos</h4>
                            <p className="text-sm text-gray-500">La pantalla mostrará el nombre, número de pax y estado del ticket. Verifique que coincida con los pasajeros presentes.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                        <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                        <div>
                            <h4 className="font-medium">Confirmar Abordaje</h4>
                            <p className="text-sm text-gray-500">Presione el botón "Confirmar Check-in". Si el ticket ya fue usado, el sistema mostrará una alerta roja.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FinanceSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">Finanzas y Pagos</h1>
                <p className="text-gray-500">Entendiendo sus ingresos y comisiones.</p>
            </div>

            <section className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-gray-500">Ingreso Neto</CardTitle>
                        <CardDescription>Lo que usted recibe</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            El ingreso neto se calcula restando todas las retenciones y comisiones del precio total de venta.
                        </p>
                        <div className="mt-4 p-3 bg-muted rounded text-sm font-mono">
                            Total Venta - (Comisión App + Impuestos + Comisión Bancaria)
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-gray-500">Stripe Connect</CardTitle>
                        <CardDescription>Pagos Automáticos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">
                            Utilizamos Stripe Connect para dispersar fondos. Asegúrese de completar su onboarding en <strong>Configuración {">"} Pagos</strong> para recibir transferencias automáticas.
                        </p>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

function CustomersSection() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold mb-2">Gestión de Clientes</h1>
                <p className="text-gray-500">Base de datos y comunicación.</p>
            </div>

            <p>
                La sección de clientes mantiene un historial de todas las personas que han reservado.
                Desde aquí puede:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Ver historial de reservas por cliente.</li>
                <li>Contactar vía WhatsApp con un clic.</li>
                <li>Verificar estado de waivers (próximamente).</li>
            </ul>
        </div>
    );
}
