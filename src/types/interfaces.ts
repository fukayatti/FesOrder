export interface Event {
    eventName: string;
    circleId: string[];
}

export interface Circle {
    id: string;
    name: string;
    description?: string;
    iconImagePath?: string;
    backgroundImagePath?: string;
}

export interface MenuItem {
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

export interface Topping {
    id: string;
    circleId?: string;
    toppingName: string;
    price: number;
    description?: string;
    soldOut: boolean;
}

export interface Order {
    id: string;
    circleId?: string;
    orderId: string;
    orderItems: string[];
    totalPrice: number;
    peopleCount: number;
    time: string;
    cashier: string;
    orderState: string;
}

export interface OrderItem {
    menuItemId: string;
    quantity: number;
    toppingIds?: string[];
    options?: string[];
}
