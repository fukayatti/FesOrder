"use client";

import { format } from "date-fns";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

import AuthGuard from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getCircleId } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface OrderItem {
    menuItemId: string;
    quantity: number;
    toppingIds: string[];
}

interface Order {
    id: string;
    orderId: string;
    orderItems: string;
    totalPrice: number;
    peopleCount: number;
    time: string;
    cashier: string;
    orderState: string;
    isCompleted: boolean;
}

interface MenuItem {
    id: string;
    menuName: string;
    price: number;
}

interface Topping {
    id: string;
    toppingName: string;
    price: number;
}

export default function Component() {
    const [circleId, setCircleId] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<keyof Order>("time");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [filterField, setFilterField] = useState<any>(null);
    const [filterValue, setFilterValue] = useState<string>("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editingOrderItems, setEditingOrderItems] = useState<OrderItem[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
    const [date, setDate] = useState<Date>();
    const router = useRouter();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const storedCircleId = getCircleId();
            if (!storedCircleId) {
                router.push("/login");
                return;
            }
            setCircleId(storedCircleId);

            const response = await fetch(`/api/orders/${storedCircleId}`);
            const newOrders = await response.json();

            setOrders((prevOrders) => {
                const existingOrderIds = new Set(
                    prevOrders.map((order) => order.id)
                );
                const newOrdersToAdd = newOrders.filter(
                    (newOrder: Order) => !existingOrderIds.has(newOrder.id)
                );
                const updatedExistingOrders = prevOrders.map(
                    (existingOrder) => {
                        const updatedOrder = newOrders.find(
                            (newOrder: Order) =>
                                newOrder.id === existingOrder.id
                        );
                        return updatedOrder
                            ? {
                                  ...updatedOrder,
                                  isCompleted: existingOrder.isCompleted,
                              }
                            : existingOrder;
                    }
                );
                return [...newOrdersToAdd, ...updatedExistingOrders];
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const fetchMenuItems = useCallback(async () => {
        try {
            const response = await fetch(`/api/menus/${circleId}`);
            const data = await response.json();
            setMenuItems(data);
        } catch (error) {
            console.error("Error fetching menu items:", error);
        }
    }, [circleId]);

    const fetchToppings = useCallback(async () => {
        try {
            const response = await fetch(`/api/toppings/${circleId}`);
            const data = await response.json();
            setToppings(data);
        } catch (error) {
            console.error("Error fetching toppings:", error);
        }
    }, [circleId]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        if (circleId) {
            fetchMenuItems();
            fetchToppings();
        }
    }, [circleId, fetchMenuItems, fetchToppings]);

    // Auto-refresh orders every minute
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchOrders();
        }, 30000); // 60000 ms = 1 minute

        return () => clearInterval(intervalId);
    }, [fetchOrders]);

    const _handleSort = (field: keyof Order) => {
        if (field === sortField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleFilter = () => {
        if (!filterField || filterField === "none" || !filterValue)
            return orders;

        return orders.filter((order: any) => {
            const orderValue: any = order[filterField];
            if (typeof orderValue === "string") {
                return orderValue
                    .toLowerCase()
                    .includes(filterValue.toLowerCase());
            } else if (typeof orderValue === "number") {
                return orderValue.toString().includes(filterValue);
            }
            return false;
        });
    };

    const sortedAndFilteredOrders = handleFilter().sort((a, b) => {
        if (a[sortField] < b[sortField])
            return sortDirection === "asc" ? -1 : 1;
        if (a[sortField] > b[sortField])
            return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
        setEditingOrderItems(JSON.parse(order.orderItems));
        setDate(new Date(order.time));
        setIsDialogOpen(true);
    };

    const handleOrderUpdate = async (updatedOrder: Order) => {
        try {
            const response = await fetch(`/api/orders/${circleId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedOrder),
            });
            if (response.ok) {
                setOrders((prevOrders) =>
                    prevOrders.map((order) =>
                        order.id === updatedOrder.id ? updatedOrder : order
                    )
                );
                setIsDialogOpen(false);
            } else {
                console.error("Failed to update order");
            }
        } catch (error) {
            console.error("Error updating order:", error);
        }
    };

    const handleOrderCreate = async (newOrder: Omit<Order, "id">) => {
        try {
            const response = await fetch(`/api/orders/${circleId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newOrder, circleId }),
            });
            if (response.ok) {
                const createdOrder = await response.json();
                setOrders((prevOrders) => [createdOrder, ...prevOrders]);
                setIsDialogOpen(false);
            } else {
                console.error("Failed to create order");
            }
        } catch (error) {
            console.error("Error creating order:", error);
        }
    };

    const handleOrderDelete = async (id: string) => {
        setOrderToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!orderToDelete) return;

        try {
            const response = await fetch(`/api/orders/${circleId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: orderToDelete }),
            });
            if (response.ok) {
                setOrders((prevOrders) =>
                    prevOrders.filter((order) => order.id !== orderToDelete)
                );
                setIsDeleteDialogOpen(false);
                setOrderToDelete(null);
            } else {
                console.error("Failed to delete order");
            }
        } catch (error) {
            console.error("Error deleting order:", error);
        }
    };

    const addOrderItem = () => {
        setEditingOrderItems([
            ...editingOrderItems,
            { menuItemId: "", quantity: 1, toppingIds: [] },
        ]);
    };

    const removeOrderItem = (index: number) => {
        setEditingOrderItems(editingOrderItems.filter((_, i) => i !== index));
    };

    const updateOrderItem = (
        index: number,
        field: keyof OrderItem,
        value: any
    ) => {
        const updatedItems = [...editingOrderItems];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setEditingOrderItems(updatedItems);
    };

    const calculateTotalPrice = () => {
        return editingOrderItems.reduce((total, item) => {
            const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
            const toppingPrice = item.toppingIds.reduce((tTotal, tId) => {
                const topping = toppings.find((t) => t.id === tId);
                return tTotal + (topping ? topping.price : 0);
            }, 0);
            return (
                total +
                (menuItem ? (menuItem.price + toppingPrice) * item.quantity : 0)
            );
        }, 0);
    };

    const handleCompletionToggle = (orderId: string, isCompleted: boolean) => {
        setOrders((prevOrders) =>
            prevOrders.map((order) =>
                order.id === orderId ? { ...order, isCompleted } : order
            )
        );
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
                <h1 className="text-3xl font-bold mb-6">Order Management</h1>

                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <Select
                        value={filterField}
                        onValueChange={(value) =>
                            setFilterField(value as keyof Order | null)
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="orderId">Order ID</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                            <SelectItem value="orderState">
                                Order State
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Filter value"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full sm:w-[200px]"
                    />
                    <Button
                        onClick={() => {
                            setSelectedOrder(null);
                            setEditingOrderItems([]);
                            setDate(new Date());
                            setIsDialogOpen(true);
                        }}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Order
                    </Button>
                    <Button onClick={fetchOrders} className="w-full sm:w-auto">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reload Orders
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedAndFilteredOrders.map((order) => (
                        <Card
                            key={order.id}
                            className={cn(
                                "cursor-pointer",
                                order.isCompleted && "opacity-50"
                            )}
                            onClick={() => handleOrderClick(order)}
                        >
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Order #{order.orderId}</span>
                                    <Badge>{order.orderState}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mb-2">
                                    <p>Total: ¥{order.totalPrice}</p>
                                    <Checkbox
                                        checked={order.isCompleted}
                                        onCheckedChange={(checked) => {
                                            handleCompletionToggle(
                                                order.id,
                                                checked as boolean
                                            );
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <p>People: {order.peopleCount}</p>
                                <p>
                                    Time:{" "}
                                    {new Date(order.time).toLocaleString()}
                                </p>
                                <p>Cashier: {order.cashier}</p>
                                <ScrollArea className="h-40 mt-2">
                                    {JSON.parse(order.orderItems).map(
                                        (item: OrderItem, index: number) => {
                                            const menuItem = menuItems.find(
                                                (mi) =>
                                                    mi.id === item.menuItemId
                                            );
                                            return (
                                                <div
                                                    key={index}
                                                    className="mb-2"
                                                >
                                                    <p>
                                                        {menuItem?.menuName} x
                                                        {item.quantity}
                                                    </p>
                                                    {item.toppingIds &&
                                                        item.toppingIds.length >
                                                            0 && (
                                                            <p className="text-sm text-gray-500">
                                                                Toppings:{" "}
                                                                {item.toppingIds
                                                                    .map(
                                                                        (
                                                                            id: string
                                                                        ) =>
                                                                            toppings.find(
                                                                                (
                                                                                    t
                                                                                ) =>
                                                                                    t.id ===
                                                                                    id
                                                                            )
                                                                                ?.toppingName
                                                                    )
                                                                    .join(", ")}
                                                            </p>
                                                        )}
                                                </div>
                                            );
                                        }
                                    )}
                                </ScrollArea>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="mt-2"
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        handleOrderDelete(order.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedOrder ? "Edit Order" : "New Order"}
                            </DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const orderData = {
                                    id: selectedOrder?.id ?? "",
                                    orderId: formData.get("orderId") as string,
                                    orderItems:
                                        JSON.stringify(editingOrderItems),
                                    totalPrice: calculateTotalPrice(),
                                    peopleCount: Number(
                                        formData.get("peopleCount")
                                    ),
                                    time:
                                        date?.toISOString() ??
                                        new Date().toISOString(),
                                    cashier: formData.get("cashier") as string,
                                    orderState: formData.get(
                                        "orderState"
                                    ) as string,
                                    isCompleted:
                                        selectedOrder?.isCompleted ?? false,
                                };
                                if (selectedOrder) {
                                    handleOrderUpdate(orderData as Order);
                                } else {
                                    handleOrderCreate(orderData);
                                }
                            }}
                        >
                            <div className="grid gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="orderId">Order ID</Label>
                                    <Input
                                        id="orderId"
                                        name="orderId"
                                        defaultValue={selectedOrder?.orderId}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="peopleCount">
                                        People Count
                                    </Label>
                                    <Input
                                        id="peopleCount"
                                        name="peopleCount"
                                        type="number"
                                        defaultValue={
                                            selectedOrder?.peopleCount
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="time">Time</Label>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-[280px] justify-start text-left font-normal",
                                                        !date &&
                                                            "text-muted-foreground"
                                                    )}
                                                >
                                                    {date ? (
                                                        format(date, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={setDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Input
                                            type="time"
                                            value={
                                                date
                                                    ? format(date, "HH:mm")
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const [hours, minutes] =
                                                    e.target.value.split(":");
                                                const newDate = new Date(
                                                    date || new Date()
                                                );
                                                newDate.setHours(
                                                    parseInt(hours)
                                                );
                                                newDate.setMinutes(
                                                    parseInt(minutes)
                                                );
                                                setDate(newDate);
                                            }}
                                            className="w-[120px]"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="cashier">Cashier</Label>
                                    <Input
                                        id="cashier"
                                        name="cashier"
                                        defaultValue={selectedOrder?.cashier}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="orderState">
                                        Order State
                                    </Label>
                                    <Input
                                        id="orderState"
                                        name="orderState"
                                        defaultValue={selectedOrder?.orderState}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Order Items</Label>
                                    <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                                        {editingOrderItems.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="mb-4 p-4 border rounded-lg"
                                                >
                                                    <div className="flex flex-col gap-2 mb-2">
                                                        <Label>Menu Item</Label>
                                                        <Select
                                                            value={
                                                                item.menuItemId
                                                            }
                                                            onValueChange={(
                                                                value
                                                            ) =>
                                                                updateOrderItem(
                                                                    index,
                                                                    "menuItemId",
                                                                    value
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select menu item" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {menuItems.map(
                                                                    (
                                                                        menuItem
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                menuItem.id
                                                                            }
                                                                            value={
                                                                                menuItem.id
                                                                            }
                                                                        >
                                                                            {
                                                                                menuItem.menuName
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex flex-col gap-2 mb-2">
                                                        <Label>Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            value={
                                                                item.quantity
                                                            }
                                                            onChange={(e) =>
                                                                updateOrderItem(
                                                                    index,
                                                                    "quantity",
                                                                    parseInt(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                            min="1"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2 mb-2">
                                                        <Label>Toppings</Label>
                                                        <ScrollArea className="h-[100px] w-full rounded-md border p-2">
                                                            {toppings.map(
                                                                (topping) => (
                                                                    <div
                                                                        key={
                                                                            topping.id
                                                                        }
                                                                        className="flex items-center space-x-2 mb-2"
                                                                    >
                                                                        <Checkbox
                                                                            id={`${index}-${topping.id}`}
                                                                            checked={item.toppingIds.includes(
                                                                                topping.id
                                                                            )}
                                                                            onCheckedChange={(
                                                                                checked
                                                                            ) => {
                                                                                const newToppingIds =
                                                                                    checked
                                                                                        ? [
                                                                                              ...item.toppingIds,
                                                                                              topping.id,
                                                                                          ]
                                                                                        : item.toppingIds.filter(
                                                                                              (
                                                                                                  id
                                                                                              ) =>
                                                                                                  id !==
                                                                                                  topping.id
                                                                                          );
                                                                                updateOrderItem(
                                                                                    index,
                                                                                    "toppingIds",
                                                                                    newToppingIds
                                                                                );
                                                                            }}
                                                                        />
                                                                        <label
                                                                            htmlFor={`${index}-${topping.id}`}
                                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                        >
                                                                            {
                                                                                topping.toppingName
                                                                            }
                                                                        </label>
                                                                    </div>
                                                                )
                                                            )}
                                                        </ScrollArea>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeOrderItem(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        Remove Item
                                                    </Button>
                                                </div>
                                            )
                                        )}
                                    </ScrollArea>
                                    <Button
                                        type="button"
                                        onClick={addOrderItem}
                                        className="mt-2"
                                    >
                                        Add Item
                                    </Button>
                                </div>
                                <div>
                                    <p className="text-right font-bold">
                                        Total Price: ¥{calculateTotalPrice()}
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {selectedOrder ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                        </DialogHeader>
                        <p>Are you sure you want to delete this order?</p>
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                onClick={() => setIsDeleteDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthGuard>
    );
}
