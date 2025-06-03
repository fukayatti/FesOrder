"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Cashier {
    id: string;
    name: string;
}

interface CashierDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCashier: Cashier | null;
    onCashierChange: (cashier: Partial<Cashier>) => void;
}

export function CashierDialog({
    isOpen,
    onClose,
    selectedCashier,
    onCashierChange,
}: CashierDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                                onCashierChange({
                                    id: e.target.value,
                                    name: selectedCashier?.name || "",
                                })
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
                                onCashierChange({
                                    id: selectedCashier?.id || "",
                                    name: e.target.value,
                                })
                            }
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={onClose}
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
}
