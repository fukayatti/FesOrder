"use client";

import { RefreshCw, ShoppingCart } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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

interface MenuListProps {
    menuItems: MenuItem[];
    cart: any[];
    onItemClick: (item: MenuItem) => void;
    onRefresh: () => void;
    onProceedToOrder: () => void;
}

export function MenuList({
    menuItems,
    cart,
    onItemClick,
    onRefresh,
    onProceedToOrder,
}: MenuListProps) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Menu</span>
                    <Button variant="outline" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Menu
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                        {menuItems.map((item) => (
                            <Card
                                key={item.id}
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    item.soldOut ? "opacity-50" : ""
                                }`}
                                onClick={() => {
                                    if (!item.soldOut) {
                                        onItemClick(item);
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
            <CardFooter className="border-t p-4">
                <Button
                    onClick={onProceedToOrder}
                    className="w-full"
                    disabled={cart.length === 0}
                >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Proceed to Order ({cart.length})
                </Button>
            </CardFooter>
        </Card>
    );
}
