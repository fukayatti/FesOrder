"use client";

import { X } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface OrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    cart: OrderItem[];
    menuItems: MenuItem[];
    toppings: Topping[];
    numberOfPeople: number | null;
    onNumberOfPeopleChange: (value: number | null) => void;
    receivedAmount: number;
    onReceivedAmountChange: (value: number) => void;
    change: number;
    totalPrice: number;
    isSubmitting: boolean;
    onSubmit: () => void;
    onRemoveFromCart: (menuItemId: string) => void;
}

export function OrderDialog({
    isOpen,
    onClose,
    cart,
    menuItems,
    toppings,
    numberOfPeople,
    onNumberOfPeopleChange,
    receivedAmount,
    onReceivedAmountChange,
    change,
    totalPrice,
    isSubmitting,
    onSubmit,
    onRemoveFromCart,
}: OrderDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                                                onRemoveFromCart(
                                                    item.menuItemId
                                                )
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
                    <span className="text-xl font-semibold">¥{totalPrice}</span>
                </div>
                <div className="w-full mb-4">
                    <Label htmlFor="numberOfPeople">Number of People</Label>
                    <Input
                        id="numberOfPeople"
                        type="number"
                        value={numberOfPeople === null ? "" : numberOfPeople}
                        onChange={(e) =>
                            onNumberOfPeopleChange(
                                parseInt(e.target.value) || null
                            )
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
                            onReceivedAmountChange(
                                parseFloat(e.target.value) || 0
                            )
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
                        onClick={onSubmit}
                        disabled={isSubmitting || numberOfPeople === null}
                    >
                        {isSubmitting ? "Submitting..." : "Confirm Order"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
