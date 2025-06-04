"use client";

import React from "react";

import AuthGuard from "@/components/AuthGuard";

const DashboardPage: React.FC = () => {
    return (
        <AuthGuard>
            <div>this is dashboard</div>
        </AuthGuard>
    );
};

export default DashboardPage;
