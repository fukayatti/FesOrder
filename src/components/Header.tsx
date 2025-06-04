"use client";

import {
    Menu,
    BarChart,
    UtensilsCrossed,
    ClipboardList,
    SmartphoneNfc,
    LogOut,
    User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    isAuthenticated as isTraditionalAuth,
    getCircleName,
    getEventName,
    getCircleId,
    logout,
} from "@/lib/auth";
import { useAuth, syncSessionWithCookies } from "@/lib/auth-client";

export default function Header() {
    const [eventName, setEventName] = useState("");
    const [circleName, setCircleName] = useState("");
    const [isAuth, setIsAuth] = useState(false);
    const [userDisplayName, setUserDisplayName] = useState("");

    const {
        session,
        isAuthenticated: isNextAuthAuthenticated,
        signOut,
    } = useAuth();

    useEffect(() => {
        const checkAuthStatus = () => {
            // NextAuth.jsによる認証をチェック
            const nextAuthAuth = isNextAuthAuthenticated;

            // 従来の認証をチェック（サークルIDの存在確認）
            const traditionalAuth = isTraditionalAuth();
            const circleId = getCircleId();

            // サークルIDが存在する場合のみ認証済みとする
            const authenticated =
                nextAuthAuth || (traditionalAuth && !!circleId);

            setIsAuth(authenticated);

            if (authenticated) {
                if (session?.user) {
                    // NextAuth.jsのセッションがある場合
                    setUserDisplayName(
                        session.user.name || session.user.email || "ユーザー"
                    );
                    setCircleName(session.user.name || "");
                    setEventName(""); // NextAuthの場合はイベント名は不明

                    // セッション情報をCookieと同期
                    syncSessionWithCookies(session);
                } else if (circleId) {
                    // 従来の認証の場合（サークルIDが存在する場合のみ）
                    const circle = getCircleName();
                    const event = getEventName();
                    setCircleName(circle || "");
                    setEventName(event || "");
                    setUserDisplayName(circle || `サークル ${circleId}`);
                }
            } else {
                // 認証されていない場合は情報をクリア
                setCircleName("");
                setEventName("");
                setUserDisplayName("");
            }
        };

        checkAuthStatus();

        // クッキーの変更を監視するため、定期的にチェック
        const interval = setInterval(checkAuthStatus, 1000);

        return () => clearInterval(interval);
    }, [session, isNextAuthAuthenticated]);

    const handleLogin = () => {
        window.location.href = "/login";
    };

    const handleLogout = async () => {
        if (session) {
            // NextAuth.jsのログアウト
            await signOut();
        } else {
            // 従来のログアウト
            logout();
        }
    };

    const navItems = [
        {
            href: "/register",
            icon: <SmartphoneNfc className="mr-2 h-4 w-4" />,
            label: "Register",
        },
        {
            href: "/dashboard/sales",
            icon: <BarChart className="mr-2 h-4 w-4" />,
            label: "Sales Dashboard",
        },
        {
            href: "/dashboard/menus",
            icon: <UtensilsCrossed className="mr-2 h-4 w-4" />,
            label: "Menu Management",
        },
        {
            href: "/dashboard/orders",
            icon: <ClipboardList className="mr-2 h-4 w-4" />,
            label: "Order Management",
        },
    ];

    return (
        <header className="flex items-center justify-between p-4 bg-black text-white">
            <div className="flex items-center space-x-4">
                {(eventName && circleName) || session?.user ? (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <nav className="flex flex-col space-y-4 mt-6">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={`${item.href}`}
                                        className="flex items-center text-sm hover:text-gray-300"
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                ) : null}
                <div>
                    <Image
                        src="/logo.png"
                        alt="FesOrder Logo"
                        width={40}
                        height={40}
                    />
                </div>
                <h1 className="text-xl font-bold">FesOrder</h1>
                {userDisplayName && (
                    <span className="text-sm">{userDisplayName}</span>
                )}
                {eventName && (
                    <span className="text-xs text-gray-300">@{eventName}</span>
                )}
            </div>

            {/* 認証ボタン */}
            <div className="flex items-center space-x-2">
                {isAuth ? (
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{userDisplayName}</span>
                            {session?.provider && (
                                <span className="text-xs text-gray-300">
                                    ({session.provider})
                                </span>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="text-black"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            ログアウト
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogin}
                        className="text-black"
                    >
                        ログイン
                    </Button>
                )}
            </div>
        </header>
    );
}
