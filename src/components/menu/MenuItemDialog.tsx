"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Plus, Minus } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

interface MenuItemDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItem: MenuItem | null;
    tempItem: OrderItem | null;
    toppings: Topping[];
    onTempItemChange: (item: OrderItem | null) => void;
    onAddToCart: () => void;
}

export function MenuItemDialog({
    isOpen,
    onClose,
    selectedItem,
    tempItem,
    toppings,
    onTempItemChange,
    onAddToCart,
}: MenuItemDialogProps) {
    if (!selectedItem || !tempItem) return null;

    const handleToppingChange = (toppingId: string, checked: boolean) => {
        onTempItemChange({
            ...tempItem,
            toppingIds: checked
                ? [...(tempItem.toppingIds || []), toppingId]
                : tempItem.toppingIds?.filter((id) => id !== toppingId) || [],
        });
    };

    const handleQuantityChange = (delta: number) => {
        onTempItemChange({
            ...tempItem,
            quantity: Math.max(1, tempItem.quantity + delta),
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={onClose}>
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
                                            onClick={onClose}
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
                                                selectedItem.toppingIds.length >
                                                    0 && (
                                                    <div className="mb-4">
                                                        <h3 className="font-semibold mb-2">
                                                            Toppings
                                                        </h3>
                                                        {toppings
                                                            .filter((topping) =>
                                                                selectedItem.toppingIds.includes(
                                                                    topping.id
                                                                )
                                                            )
                                                            .map((topping) => (
                                                                <div
                                                                    key={
                                                                        topping.id
                                                                    }
                                                                    className="flex items-baseline space-x-2 space-y-4"
                                                                >
                                                                    <Checkbox
                                                                        id={`topping-${topping.id}`}
                                                                        checked={tempItem.toppingIds?.includes(
                                                                            topping.id
                                                                        )}
                                                                        onCheckedChange={(
                                                                            checked
                                                                        ) =>
                                                                            handleToppingChange(
                                                                                topping.id,
                                                                                checked as boolean
                                                                            )
                                                                        }
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
                                                                        )
                                                                        {topping.soldOut &&
                                                                            " (Sold Out)"}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}

                                            {selectedItem.additionalInfo && (
                                                <div className="mb-4">
                                                    <h3 className="font-semibold mb-2">
                                                        Additional Information
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
                                                        handleQuantityChange(-1)
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
                                                        handleQuantityChange(1)
                                                    }
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t p-4">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button onClick={onAddToCart}>
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
}
