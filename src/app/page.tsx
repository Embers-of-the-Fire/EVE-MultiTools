"use client";
import "@/locale/i18n";

import { SPALayout } from "@/components/SPALayout";

declare global {
    interface BigInt {
        toJSON(): string;
    }
}

BigInt.prototype.toJSON = function () {
    return `<bigint>${this.toString()}`;
};

export default function Home() {
    return <SPALayout />;
}
