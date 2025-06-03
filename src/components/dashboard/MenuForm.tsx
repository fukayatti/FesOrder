"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface MenuFormProps {
    item: MenuItem;
    toppingIds: Topping[];
    onSubmit: (item: MenuItem) => void;
}

export function MenuForm({ item, toppingIds, onSubmit }: MenuFormProps) {
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
                    {toppingIds.map((topping) => (
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
