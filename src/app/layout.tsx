import { Inter } from "next/font/google";

import "@/app/globals.css";
import Header from "@/components/Header";
import { PermissionProvider } from "@/components/PermissionProvider";
import SessionProvider from "@/components/SessionProvider";

import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "FesOrder",
    description: "Manage your food service orders efficiently",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="jp">
            <body className={inter.className}>
                <SessionProvider>
                    <PermissionProvider>
                        <div className="flex flex-col min-h-screen">
                            <Header />
                            <main className="flex-1 overflow-auto p-6">
                                {children}
                            </main>
                        </div>
                    </PermissionProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
