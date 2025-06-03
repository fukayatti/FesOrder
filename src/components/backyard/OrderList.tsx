"use client";

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
import { MenuItem, Topping, Order, OrderItem } from "@/types/interfaces";

interface OrderListProps {
    orders: Order[];
    menuItems: Record<string, MenuItem>;
    toppings: Record<string, Topping>;
    completedItems: Record<string, Set<string>>;
    onToggleItemCompletion: (orderId: string, itemId: string) => void;
    onCompleteOrder: (orderId: string) => void;
    isOrderComplete: (order: Order) => boolean;
}

export function OrderList({
    orders,
    menuItems,
    toppings,
    completedItems,
    onToggleItemCompletion,
    onCompleteOrder,
    isOrderComplete,
}: OrderListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
                <Card key={order.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Order #{order.orderId}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {order.orderItems.map((itemId: string) => {
                            const orderItem = JSON.parse(itemId) as OrderItem;
                            const menuItem = menuItems[orderItem.menuItemId];
                            if (!menuItem) return null;
                            return (
                                <div
                                    key={orderItem.menuItemId}
                                    className="flex items-center space-x-2 mb-2"
                                >
                                    <Checkbox
                                        id={`${order.id}-${orderItem.menuItemId}`}
                                        checked={completedItems[order.id]?.has(
                                            itemId
                                        )}
                                        onCheckedChange={() =>
                                            onToggleItemCompletion(
                                                order.id,
                                                itemId
                                            )
                                        }
                                    />
                                    <label
                                        htmlFor={`${order.id}-${orderItem.menuItemId}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {menuItem.menuName} x
                                        {orderItem.quantity}
                                        {orderItem.toppingIds &&
                                            orderItem.toppingIds.length > 0 && (
                                                <span className="block text-xs text-gray-500">
                                                    Toppings:{" "}
                                                    {orderItem.toppingIds
                                                        .map(
                                                            (id) =>
                                                                toppings[id]
                                                                    ?.toppingName
                                                        )
                                                        .join(", ")}
                                                </span>
                                            )}
                                    </label>
                                </div>
                            );
                        })}
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            disabled={!isOrderComplete(order)}
                            onClick={() => onCompleteOrder(order.id)}
                        >
                            Complete Order
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
