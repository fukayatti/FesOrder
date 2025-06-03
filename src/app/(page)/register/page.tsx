"use client";

import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import {
    ChevronLeft,
    ShoppingCart,
    Plus,
    Minus,
    X,
    User,
    RefreshCw,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function Component() {
    const [circleId, setCircleId] = useState<string>("");
    const [circleName, setCircleName] = useState<string>("");
    const [_eventName, _setEventName] = useState<string>("");
    const [_currentView, _setCurrentView] = useState<"menu" | "details">(
        "menu"
    );
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [tempItem, setTempItem] = useState<OrderItem | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [orderNumber, setOrderNumber] = useState<string>("");
    const [numberOfPeople, setNumberOfPeople] = useState<number | null>(null);
    const [selectedCashier, setSelectedCashier] = useState<{
        id: string;
        name: string;
    } | null>(null);
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

                    // Fetch toppings data
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
        const circleId = "09e6beabe3504beeb6b51d9efa7d3e6f";
        const circleName: string | undefined = Cookies.get("circleName");
        const eventName: string | undefined = Cookies.get("eventName");
        if (circleId && circleName && eventName) {
            setCircleId(circleId);
            setCircleName(circleName);
            _setEventName(eventName);
        }
        setOrderNumber(`${new Date().toISOString().split("T")[0]}-${uuidv4()}`);
        fetchMenuItems();
    }, [circleId, fetchMenuItems]);

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

    const renderMenu = () => (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Menu</span>
                    <Button variant="outline" onClick={fetchMenuItems}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Menu
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pb-20">
                        {menuItems.map((item) => (
                            <Card
                                key={item.id}
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    item.soldOut ? "opacity-50" : ""
                                }`}
                                onClick={() => {
                                    if (!item.soldOut) {
                                        setSelectedItem(item);
                                        setTempItem({
                                            menuItemId: item.id,
                                            quantity: 1,
                                            toppingIds: [],
                                        });
                                        setShowItemDialog(true);
                                    }
                                }}
                            >
                                <Image
                                    src={item.imagePath}
                                    alt={item.menuName}
                                    width={400}
                                    height={128}
                                    className="w-full h-32 object-cover rounded-t-lg"
                                />
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-lg">
                                        {item.menuName}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        ¥{item.price}
                                    </p>
                                    {item.soldOut && (
                                        <Badge variant="secondary">
                                            Sold Out
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );

    const renderItemDialog = () => {
        if (!selectedItem || !tempItem) return null;

        return (
            <AnimatePresence>
                {showItemDialog && (
                    <Dialog
                        open={showItemDialog}
                        onOpenChange={setShowItemDialog}
                    >
                        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="w-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Button
                                                variant="ghost"
                                                className="mr-2"
                                                onClick={() =>
                                                    setShowItemDialog(false)
                                                }
                                            >
                                                <ChevronLeft className="h-6 w-6" />
                                            </Button>
                                            {selectedItem.menuName}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <Image
                                                src={selectedItem.imagePath}
                                                alt={selectedItem.menuName}
                                                width={400}
                                                height={192}
                                                className="w-full md:w-1/2 h-48 object-cover rounded-lg mb-4"
                                            />
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold mb-2">
                                                    {selectedItem.menuName}
                                                </h2>
                                                <p className="text-xl mb-4">
                                                    ¥{selectedItem.price}
                                                </p>
                                                <p className="text-muted-foreground mb-4">
                                                    {selectedItem.description}
                                                </p>

                                                {selectedItem.toppingIds &&
                                                    selectedItem.toppingIds
                                                        .length > 0 && (
                                                        <div className="mb-4">
                                                            <h3 className="font-semibold mb-2">
                                                                Toppings
                                                            </h3>
                                                            {toppings
                                                                .filter(
                                                                    (topping) =>
                                                                        selectedItem.toppingIds.includes(
                                                                            topping.id
                                                                        )
                                                                )
                                                                .map(
                                                                    (
                                                                        topping
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                topping.id
                                                                            }
                                                                            className=" flex items-baseline space-x-2 space-y-4"
                                                                        >
                                                                            <Checkbox
                                                                                id={`topping-${topping.id}`}
                                                                                checked={tempItem.toppingIds?.includes(
                                                                                    topping.id
                                                                                )}
                                                                                onCheckedChange={(
                                                                                    checked
                                                                                ) => {
                                                                                    setTempItem(
                                                                                        (
                                                                                            prev
                                                                                        ) => {
                                                                                            if (
                                                                                                !prev
                                                                                            )
                                                                                                return null;
                                                                                            const newToppingIds =
                                                                                                checked
                                                                                                    ? [
                                                                                                          ...(prev.toppingIds ||
                                                                                                              []),
                                                                                                          topping.id,
                                                                                                      ]
                                                                                                    : prev.toppingIds?.filter(
                                                                                                          (
                                                                                                              id
                                                                                                          ) =>
                                                                                                              id !==
                                                                                                              topping.id
                                                                                                      ) ||
                                                                                                      [];
                                                                                            return {
                                                                                                ...prev,
                                                                                                toppingIds:
                                                                                                    newToppingIds,
                                                                                            };
                                                                                        }
                                                                                    );
                                                                                }}
                                                                                disabled={
                                                                                    topping.soldOut
                                                                                }
                                                                            />
                                                                            <Label
                                                                                htmlFor={`topping-${topping.id}`}
                                                                                className={
                                                                                    topping.soldOut
                                                                                        ? "text-muted-foreground text-center"
                                                                                        : ""
                                                                                }
                                                                            >
                                                                                {
                                                                                    topping.toppingName
                                                                                }{" "}
                                                                                (+¥
                                                                                {
                                                                                    topping.price
                                                                                }

                                                                                ){" "}
                                                                                {topping.soldOut &&
                                                                                    "(Sold Out)"}
                                                                            </Label>
                                                                        </div>
                                                                    )
                                                                )}
                                                        </div>
                                                    )}

                                                {selectedItem.additionalInfo && (
                                                    <div className="mb-4">
                                                        <h3 className="font-semibold mb-2">
                                                            Additional
                                                            Information
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                selectedItem.additionalInfo
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-center space-x-4 mt-4">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            setTempItem(
                                                                (prev) =>
                                                                    prev && {
                                                                        ...prev,
                                                                        quantity:
                                                                            Math.max(
                                                                                1,
                                                                                prev.quantity -
                                                                                    1
                                                                            ),
                                                                    }
                                                            )
                                                        }
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="text-xl font-semibold">
                                                        {tempItem.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            setTempItem(
                                                                (prev) =>
                                                                    prev && {
                                                                        ...prev,
                                                                        quantity:
                                                                            prev.quantity +
                                                                            1,
                                                                    }
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between border-t p-4">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setShowItemDialog(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={addToCart}>
                                            Add to Cart
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>
        );
    };

    const renderOrderDialog = () => (
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
            <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Order Summary</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[50vh]">
                    {cart.map((item) => {
                        const menuItem = menuItems.find(
                            (mi) => mi.id === item.menuItemId
                        );
                        if (!menuItem) return null;
                        return (
                            <Card key={item.menuItemId} className="mb-4">
                                <CardContent className="flex justify-between items-center p-4">
                                    <div>
                                        <h3 className="font-semibold">
                                            {menuItem.menuName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Quantity: {item.quantity}
                                        </p>
                                        {item.toppingIds &&
                                            item.toppingIds.length > 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    Toppings:{" "}
                                                    {item.toppingIds
                                                        .map(
                                                            (t) =>
                                                                toppings.find(
                                                                    (topping) =>
                                                                        topping.id ===
                                                                        t
                                                                )?.toppingName
                                                        )
                                                        .join(", ")}
                                                </p>
                                            )}
                                    </div>
                                    <div className="flex items-center">
                                        <p className="font-semibold mr-4">
                                            ¥{menuItem.price * item.quantity}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                removeFromCart(item.menuItemId)
                                            }
                                            aria-label={`Remove ${menuItem.menuName} from cart`}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </ScrollArea>
                <div className="flex justify-between items-center w-full mb-4">
                    <span className="text-xl font-semibold">Total:</span>
                    <span className="text-xl font-semibold">
                        ¥{getTotalPrice()}
                    </span>
                </div>
                <div className="w-full mb-4">
                    <Label htmlFor="numberOfPeople">Number of People</Label>
                    <Input
                        id="numberOfPeople"
                        type="number"
                        value={numberOfPeople === null ? "" : numberOfPeople}
                        onChange={(e) =>
                            setNumberOfPeople(parseInt(e.target.value) || null)
                        }
                        min="1"
                        className={
                            numberOfPeople === null ? "border-red-500" : ""
                        }
                    />
                    {numberOfPeople === null && (
                        <p className="text-red-500 text-sm mt-1">
                            Please enter the number of people
                        </p>
                    )}
                </div>
                <div className="w-full mb-4">
                    <Label htmlFor="receivedAmount">Received Amount</Label>
                    <Input
                        id="receivedAmount"
                        type="number"
                        value={receivedAmount}
                        onChange={(e) =>
                            calculateChange(parseFloat(e.target.value) || 0)
                        }
                        min="0"
                    />
                </div>
                <div className="flex justify-between items-center w-full mb-4">
                    <span className="text-xl font-semibold">Change:</span>
                    <span className="text-xl font-semibold">¥{change}</span>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || numberOfPeople === null}
                    >
                        {isSubmitting ? "Submitting..." : "Confirm Order"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const renderCashierDialog = () => (
        <Dialog open={showCashierDialog} onOpenChange={setShowCashierDialog}>
            <DialogContent className="sm:max-w-[90vw] md:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enter Cashier Information</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cashierId" className="text-right">
                            Cashier ID
                        </Label>
                        <Input
                            id="cashierId"
                            value={selectedCashier?.id || ""}
                            onChange={(e) =>
                                setSelectedCashier((prev) =>
                                    prev
                                        ? { ...prev, id: e.target.value }
                                        : { id: e.target.value, name: "" }
                                )
                            }
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cashierName" className="text-right">
                            Cashier Name
                        </Label>
                        <Input
                            id="cashierName"
                            value={selectedCashier?.name || ""}
                            onChange={(e) =>
                                setSelectedCashier((prev) =>
                                    prev
                                        ? { ...prev, name: e.target.value }
                                        : { id: "", name: e.target.value }
                                )
                            }
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={() => setShowCashierDialog(false)}
                        disabled={
                            !selectedCashier?.id || !selectedCashier?.name
                        }
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

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
            <main className="flex-1 overflow-hidden p-4">{renderMenu()}</main>

            {/* Fixed order button at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
                <Button
                    onClick={() => setShowOrderDialog(true)}
                    className="w-full"
                    disabled={cart.length === 0}
                    size="lg"
                >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Proceed to Order ({cart.length})
                </Button>
            </div>

            {renderItemDialog()}
            {renderOrderDialog()}
            {renderCashierDialog()}
            <Toaster />
        </div>
    );
}
