"use client";

import Cookies from "js-cookie";
import { User } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import { CashierDialog } from "@/components/cashier/CashierDialog";
import { MenuList } from "@/components/menu/MenuList";
import { MenuItemDialog } from "@/components/menu/MenuItemDialog";
import { OrderDialog } from "@/components/order/OrderDialog";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
    id: string;
    menuName: string;
    price: number;
    imagePath: string;
    toppingIds: string[];
    description: string;
    additionalInfo: string;
    soldOut: boolean;
}

interface Topping {
    id: string;
    toppingName: string;
    price: number;
    description: string;
    soldOut: boolean;
}

interface OrderItem {
    menuItemId: string;
    quantity: number;
    toppingIds: string[];
}

interface Cashier {
    id: string;
    name: string;
}

export default function RegisterPage() {
    const [circleId, setCircleId] = useState<string>("");
    const [circleName, setCircleName] = useState<string>("");
    const [_eventName, _setEventName] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [tempItem, setTempItem] = useState<OrderItem | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [orderNumber, setOrderNumber] = useState<string>("");
    const [numberOfPeople, setNumberOfPeople] = useState<number | null>(null);
    const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(
        null
    );
    const [showCashierDialog, setShowCashierDialog] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showOrderDialog, setShowOrderDialog] = useState<boolean>(false);
    const [showItemDialog, setShowItemDialog] = useState<boolean>(false);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);
    const [change, setChange] = useState<number>(0);
    const { toast } = useToast();

    const fetchMenuItems = useCallback(async () => {
        try {
            if (circleId) {
                const response = await fetch(
                    `/api/menus/${encodeURIComponent(circleId)}`
                );
                const menuData: MenuItem[] = await response.json();
                if (response.ok) {
                    setMenuItems(menuData);

                    const toppingsResponse = await fetch(
                        `/api/toppings/${encodeURIComponent(circleId)}`
                    );
                    const toppingsData: Topping[] =
                        await toppingsResponse.json();
                    if (toppingsResponse.ok) {
                        setToppings(toppingsData);
                    } else {
                        console.error("Error fetching toppings:", toppingsData);
                    }
                } else {
                    console.error("Error fetching menu items:", menuData);
                }
            } else {
                console.error("Circle ID not found in cookies");
            }
        } catch (error) {
            console.error("Error fetching menu items:", error);
        }
    }, [circleId]);

    useEffect(() => {
        const storedCircleId = "09e6beabe3504beeb6b51d9efa7d3e6f";
        const storedCircleName: string | undefined = Cookies.get("circleName");
        const storedEventName: string | undefined = Cookies.get("eventName");
        if (storedCircleId && storedCircleName && storedEventName) {
            setCircleId(storedCircleId);
            setCircleName(storedCircleName);
            _setEventName(storedEventName);
        }
        setOrderNumber(`${new Date().toISOString().split("T")[0]}-${uuidv4()}`);
        fetchMenuItems();
    }, [circleId, fetchMenuItems]);

    const handleItemClick = (item: MenuItem) => {
        setSelectedItem(item);
        setTempItem({
            menuItemId: item.id,
            quantity: 1,
            toppingIds: [],
        });
        setShowItemDialog(true);
    };

    const addToCart = () => {
        if (tempItem) {
            setCart((prevCart) => [...prevCart, tempItem]);
            setTempItem(null);
            setShowItemDialog(false);
        }
    };

    const removeFromCart = (menuItemId: string) => {
        setCart((prevCart) =>
            prevCart.filter((item) => item.menuItemId !== menuItemId)
        );
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => {
            const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
            if (!menuItem) return total;

            const itemTotal = menuItem.price * item.quantity;
            const toppingsTotal = (item.toppingIds || []).reduce(
                (tTotal, toppingId) => {
                    const topping = toppings.find((t) => t.id === toppingId);
                    return tTotal + (topping?.price || 0);
                },
                0
            );
            return total + itemTotal + toppingsTotal;
        }, 0);
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (numberOfPeople === null || numberOfPeople < 1) {
            toast({
                title: "Invalid Number of People",
                description:
                    "Please enter a valid number of people (1 or more).",
                variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);

        const orderData: any = {
            orderId: orderNumber,
            circleId: circleId,
            orderItems: cart,
            time: new Date().toISOString(),
            peopleCount: numberOfPeople,
            totalPrice: getTotalPrice(),
            cashier: selectedCashier?.name || "",
            orderState: "Pending",
        };

        try {
            const response = await fetch(
                `/api/orders/${encodeURIComponent(circleName)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderData),
                }
            );

            if (response.ok) {
                toast({
                    title: "Order Submitted",
                    description: "Your order has been successfully submitted.",
                });
                setOrderNumber(
                    `${new Date().toISOString().split("T")[0]}-${uuidv4()}`
                );
                setCart([]);
                setShowOrderDialog(false);
                setNumberOfPeople(null);
                setReceivedAmount(0);
                setChange(0);
            } else {
                throw new Error("Failed to submit order");
            }
        } catch (error) {
            console.error("Error sending order:", error);
            toast({
                title: "Order Submission Failed",
                description: "Failed to submit your order. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateChange = (amount: number) => {
        const totalPrice = getTotalPrice();
        const calculatedChange = amount - totalPrice;
        setReceivedAmount(amount);
        setChange(calculatedChange >= 0 ? calculatedChange : 0);
    };

    const handleCashierChange = (cashierData: Partial<Cashier>) => {
        setSelectedCashier((prev) => ({
            id: cashierData.id || prev?.id || "",
            name: cashierData.name || prev?.name || "",
        }));
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <header className="bg-primary text-primary-foreground p-4 flex items-center">
                <h1 className="text-xl font-bold">Menu</h1>
                <Badge variant="secondary" className="ml-auto mr-2">
                    Order #: {orderNumber}
                </Badge>
                {selectedCashier && (
                    <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{selectedCashier.name}</span>
                    </div>
                )}
            </header>
            <main className="flex-1 overflow-hidden p-4">
                <MenuList
                    menuItems={menuItems}
                    cart={cart}
                    onItemClick={handleItemClick}
                    onRefresh={fetchMenuItems}
                    onProceedToOrder={() => setShowOrderDialog(true)}
                />
            </main>

            <MenuItemDialog
                isOpen={showItemDialog}
                onClose={() => setShowItemDialog(false)}
                selectedItem={selectedItem}
                tempItem={tempItem}
                toppings={toppings}
                onTempItemChange={setTempItem}
                onAddToCart={addToCart}
            />

            <OrderDialog
                isOpen={showOrderDialog}
                onClose={() => setShowOrderDialog(false)}
                cart={cart}
                menuItems={menuItems}
                toppings={toppings}
                numberOfPeople={numberOfPeople}
                onNumberOfPeopleChange={setNumberOfPeople}
                receivedAmount={receivedAmount}
                onReceivedAmountChange={calculateChange}
                change={change}
                totalPrice={getTotalPrice()}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onRemoveFromCart={removeFromCart}
            />

            <CashierDialog
                isOpen={showCashierDialog}
                onClose={() => setShowCashierDialog(false)}
                selectedCashier={selectedCashier}
                onCashierChange={handleCashierChange}
            />

            <Toaster />
        </div>
    );
}
