"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ControlPanelProps {
    useWebSocket: boolean;
    onWebSocketToggle: (checked: boolean) => void;
    pollingInterval: number;
    onIntervalChange: (value: string) => void;
    onReloadOrders: () => void;
}

export function ControlPanel({
    useWebSocket,
    onWebSocketToggle,
    pollingInterval,
    onIntervalChange,
    onReloadOrders,
}: ControlPanelProps) {
    return (
        <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-2">
                <Switch
                    id="use-websocket"
                    checked={useWebSocket}
                    onCheckedChange={onWebSocketToggle}
                />
                <Label htmlFor="use-websocket">Use WebSocket</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Label htmlFor="polling-interval">Polling Interval</Label>
                <Select
                    onValueChange={onIntervalChange}
                    defaultValue={pollingInterval.toString()}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30000">30 seconds</SelectItem>
                        <SelectItem value="60000">1 minute</SelectItem>
                        <SelectItem value="300000">5 minutes</SelectItem>
                        <SelectItem value="600000">10 minutes</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={onReloadOrders}>Reload Orders</Button>
        </div>
    );
}
