"use client";

import { Loader2, Plus, Trash, Edit } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getCircleId } from "@/lib/auth";

interface MenuItem {
    id: string;
    circleId?: string;
    menuName: string;
    price: number;
    imagePath: string;
    description: string;
    toppingIds: string[];
    additionalInfo?: string;
    soldOut: boolean;
}

interface Topping {
    id: string;
    circleId?: string;
    toppingName: string;
    price: number;
    description?: string;
    soldOut: boolean;
}

export default function MenuManagement() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [circleId, setCircleId] = useState<string>("");
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
    const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
    const [isToppingDialogOpen, setIsToppingDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchMenuData = useCallback(async () => {
        setLoading(true);
        const circleId = getCircleId();

        if (!circleId) {
            window.location.href = "/login";
            return;
        }
        setCircleId(circleId);
        try {
            const menuResponse = await fetch(
                `/api/menus/${encodeURIComponent(circleId)}`
            );
            const menuData = await menuResponse.json();
            setMenuItems(menuData);

            const toppingResponse = await fetch(
                `/api/toppings/${encodeURIComponent(circleId)}`
            );
            const toppingData = await toppingResponse.json();
            setToppings(toppingData);
        } catch (error) {
            console.error("Error fetching menu data:", error);
            toast({
                title: "Error",
                description: "Failed to fetch menu data. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchMenuData();
    }, [fetchMenuData]);

    const handleAddOrEditMenuItem = async (item: MenuItem) => {
        try {
            const method = item.id ? "PATCH" : "POST";
            const url = `/api/menus/${circleId}`;

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...item, circleId }),
            });
            if (response.ok) {
                toast({
                    title: "Success",
                    description: `Menu item ${
                        item.id ? "updated" : "added"
                    } successfully.`,
                });
                fetchMenuData();
                setIsMenuDialogOpen(false);
            } else {
                throw new Error(
                    `Failed to ${item.id ? "update" : "add"} menu item`
                );
            }
        } catch (error) {
            console.error("Error adding/editing menu item:", error);
            toast({
                title: "Error",
                description: `Failed to ${
                    item.id ? "update" : "add"
                } menu item. Please try again.`,
                variant: "destructive",
            });
        }
    };

    const handleDeleteMenuItem = async (id: string) => {
        if (confirm("Are you sure you want to delete this menu item?")) {
            try {
                const response = await fetch(`/api/menus/${id}`, {
                    method: "DELETE",
                });
                if (response.ok) {
                    toast({
                        title: "Success",
                        description: "Menu item deleted successfully.",
                    });
                    fetchMenuData();
                } else {
                    throw new Error("Failed to delete menu item");
                }
            } catch (error) {
                console.error("Error deleting menu item:", error);
                toast({
                    title: "Error",
                    description:
                        "Failed to delete menu item. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };

    const handleAddOrEditTopping = async (topping: Topping) => {
        try {
            const method = topping.id ? "PATCH" : "POST";
            const url = `/api/toppings/${circleId}`;
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(topping),
            });
            if (response.ok) {
                toast({
                    title: "Success",
                    description: `Topping ${
                        topping.id ? "updated" : "added"
                    } successfully.`,
                });
                fetchMenuData();
                setIsToppingDialogOpen(false);
            } else {
                throw new Error(
                    `Failed to ${topping.id ? "update" : "add"} topping`
                );
            }
        } catch (error) {
            console.error("Error adding/editing topping:", error);
            toast({
                title: "Error",
                description: `Failed to ${
                    topping.id ? "update" : "add"
                } topping. Please try again.`,
                variant: "destructive",
            });
        }
    };

    const handleDeleteTopping = async (id: string) => {
        if (confirm("Are you sure you want to delete this topping?")) {
            try {
                const response = await fetch(`/api/toppings/${id}`, {
                    method: "DELETE",
                });
                if (response.ok) {
                    toast({
                        title: "Success",
                        description: "Topping deleted successfully.",
                    });
                    fetchMenuData();
                } else {
                    throw new Error("Failed to delete topping");
                }
            } catch (error) {
                console.error("Error deleting topping:", error);
                toast({
                    title: "Error",
                    description: "Failed to delete topping. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6">Menu Management</h1>
                <Tabs defaultValue="menu-items">
                    <TabsList className="mb-4">
                        <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
                        <TabsTrigger value="toppings">Toppings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="menu-items">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">
                                Menu Items
                            </h2>
                            <Dialog
                                open={isMenuDialogOpen}
                                onOpenChange={setIsMenuDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        onClick={() => setEditingItem(null)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add
                                        Menu Item
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingItem
                                                ? "Edit Menu Item"
                                                : "Add Menu Item"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <MenuItemForm
                                        item={
                                            editingItem || {
                                                id: "",
                                                menuName: "",
                                                price: 0,
                                                imagePath: "",
                                                description: "",
                                                additionalInfo: "",
                                                soldOut: false,
                                                toppingIds: [],
                                            }
                                        }
                                        toppings={toppings}
                                        onSubmit={handleAddOrEditMenuItem}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {menuItems.map((item) => (
                                <Card key={item.id}>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            {item.menuName}
                                            <div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setIsMenuDialogOpen(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleDeleteMenuItem(
                                                            item.id
                                                        )
                                                    }
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p>Price: ¥{item.price}</p>
                                        <p>Description: {item.description}</p>
                                        <p>
                                            Sold Out:{" "}
                                            {item.soldOut ? "Yes" : "No"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="toppings">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Toppings</h2>
                            <Dialog
                                open={isToppingDialogOpen}
                                onOpenChange={setIsToppingDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        onClick={() => setEditingTopping(null)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add
                                        Topping
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingTopping
                                                ? "Edit Topping"
                                                : "Add Topping"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <ToppingForm
                                        topping={
                                            editingTopping || {
                                                id: "",
                                                circleId: "",
                                                toppingName: "",
                                                price: 0,
                                                description: "",
                                                soldOut: false,
                                            }
                                        }
                                        onSubmit={handleAddOrEditTopping}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {toppings.map((topping) => (
                                <Card key={topping.id}>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            {topping.toppingName}
                                            <div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingTopping(
                                                            topping
                                                        );
                                                        setIsToppingDialogOpen(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleDeleteTopping(
                                                            topping.id
                                                        )
                                                    }
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p>Price: ¥{topping.price}</p>
                                        <p>
                                            Description: {topping.description}
                                        </p>
                                        <p>
                                            Sold Out:{" "}
                                            {topping.soldOut ? "Yes" : "No"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthGuard>
    );
}

interface MenuItemFormProps {
    item: MenuItem;
    toppings: Topping[];
    onSubmit: (item: MenuItem) => void;
}

function MenuItemForm({ item, toppings, onSubmit }: MenuItemFormProps) {
    const [formData, setFormData] = useState<MenuItem>({
        ...item,
        toppingIds: item.toppingIds || [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleToppingChange = (toppingId: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            toppingIds: checked
                ? [...prev.toppingIds, toppingId]
                : prev.toppingIds.filter((id) => id !== toppingId),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="menuName">Name</Label>
                <Input
                    id="menuName"
                    name="menuName"
                    value={formData.menuName}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="price">Price</Label>
                <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>
            <div>
                <Label htmlFor="imagePath">Image Path</Label>
                <Input
                    id="imagePath"
                    name="imagePath"
                    value={formData.imagePath}
                    onChange={handleChange}
                />
            </div>
            <div>
                <Label htmlFor="additionalInfo">Additional Info</Label>
                <Input
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="soldOut"
                    name="soldOut"
                    checked={formData.soldOut}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                            ...prev,
                            soldOut: checked as boolean,
                        }))
                    }
                />
                <Label htmlFor="soldOut">Sold Out</Label>
            </div>
            <div>
                <Label>Toppings</Label>
                <div className="space-y-2">
                    {toppings.map((topping) => (
                        <div
                            key={topping.id}
                            className="flex items-center space-x-2"
                        >
                            <Checkbox
                                id={`topping-${topping.id}`}
                                checked={formData.toppingIds.includes(
                                    topping.id
                                )}
                                onCheckedChange={(checked) =>
                                    handleToppingChange(
                                        topping.id,
                                        checked as boolean
                                    )
                                }
                            />
                            <Label htmlFor={`topping-${topping.id}`}>
                                {topping.toppingName}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
            <Button type="submit">Save</Button>
        </form>
    );
}

interface ToppingFormProps {
    topping: Topping;
    onSubmit: (topping: Topping) => void;
}

function ToppingForm({ topping, onSubmit }: ToppingFormProps) {
    const [formData, setFormData] = useState(topping);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="toppingName">Name</Label>
                <Input
                    id="toppingName"
                    name="toppingName"
                    value={formData.toppingName}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="price">Price</Label>
                <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="soldOut"
                    name="soldOut"
                    checked={formData.soldOut}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                            ...prev,
                            soldOut: checked as boolean,
                        }))
                    }
                />
                <Label htmlFor="soldOut">Sold Out</Label>
            </div>
            <Button type="submit">Save</Button>
        </form>
    );
}
