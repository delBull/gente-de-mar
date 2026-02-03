import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Shield, Briefcase, User as UserIcon, CheckCircle2, XCircle } from "lucide-react";

interface User {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    businessId?: number | null;
    createdAt?: string;
}

export default function Users() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        fullName: "",
        role: "seller",
        businessId: "",
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/users");
            if (!response.ok) throw new Error("Failed to fetch users");
            const data = await response.json();
            setUsers(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    businessId: formData.businessId ? parseInt(formData.businessId) : null,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create user");
            }

            toast({
                title: "Usuario Creado",
                description: "El usuario ha sido creado exitosamente.",
            });

            setIsCreateDialogOpen(false);
            setFormData({
                username: "",
                email: "",
                password: "",
                fullName: "",
                role: "seller",
                businessId: "",
            });
            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleActive = async (userId: number, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (!response.ok) throw new Error("Failed to update user");

            toast({
                title: "Usuario Actualizado",
                description: `El usuario ha sido ${!currentStatus ? "activado" : "desactivado"}.`,
            });

            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "master_admin":
                return <Shield className="w-4 h-4 text-purple-600" />;
            case "seller":
                return <Briefcase className="w-4 h-4 text-blue-600" />;
            case "provider":
                return <UserIcon className="w-4 h-4 text-green-600" />;
            default:
                return <UserIcon className="w-4 h-4" />;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "master_admin":
                return "Master Admin";
            case "seller":
                return "Seller";
            case "provider":
                return "Provider";
            default:
                return role;
        }
    };

    if (currentUser?.role !== "master_admin") {
        return (
            <div className="container mx-auto p-6">
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Acceso Denegado</CardTitle>
                        <CardDescription>
                            Solo los administradores maestros pueden gestionar usuarios.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">
                        Administra usuarios y sus roles en el sistema
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Crear Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleCreateUser}>
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                                <DialogDescription>
                                    Completa los datos del nuevo usuario
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Nombre Completo</Label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fullName: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="username">Usuario</Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) =>
                                            setFormData({ ...formData, username: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Rol</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, role: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="seller">Seller</SelectItem>
                                            <SelectItem value="provider">Provider</SelectItem>
                                            <SelectItem value="master_admin">Master Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="businessId">Business ID (opcional)</Label>
                                    <Input
                                        id="businessId"
                                        type="number"
                                        value={formData.businessId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, businessId: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? "Creando..." : "Crear Usuario"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usuarios del Sistema</CardTitle>
                    <CardDescription>
                        Lista completa de usuarios registrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.fullName}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    @{user.username}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getRoleIcon(user.role)}
                                                <span className="text-sm">{getRoleLabel(user.role)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.isActive ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Activo
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Inactivo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {user.isActive ? "Desactivar" : "Activar"}
                                                </span>
                                                <Switch
                                                    checked={user.isActive}
                                                    onCheckedChange={() =>
                                                        handleToggleActive(user.id, user.isActive)
                                                    }
                                                    disabled={user.id === currentUser?.id}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
