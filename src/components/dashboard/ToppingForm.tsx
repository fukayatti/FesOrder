"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Topping {
    id: string;
    circleId?: string;
    toppingName: string;
    price: number;
    description?: string;
    soldOut: boolean;
}

interface ToppingFormProps {
    topping: Topping;
    onSubmit: (topping: Topping) => void;
}

export function ToppingForm({ topping, onSubmit }: ToppingFormProps) {
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
