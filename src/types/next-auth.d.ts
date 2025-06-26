import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string | null;
            role?: string;
            circle?: string;
        };
        provider?: string;
        providerAccountId?: string;
        role?: string;
        circle?: string;
    }

    interface User extends DefaultUser {
        id: string;
        email: string;
        name: string;
        role?: string;
        circle?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        userId?: string;
        provider?: string;
        providerAccountId?: string;
        role?: string;
        circle?: string;
    }
}
