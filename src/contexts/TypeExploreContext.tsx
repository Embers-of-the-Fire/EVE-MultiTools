import { removeDuplicate } from "@/utils/iterator";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface TypeExploreState {
    currentTypeID: number | null;
    history: number[];
    setCurrentTypeID: (typeID: number) => void;
    clearHistory: () => void;
}

const TypeExploreContext = createContext<TypeExploreState | undefined>(undefined);

export const TypeExploreProvider = ({ children }: { children: ReactNode }) => {
    const [currentTypeID, setCurrentTypeIDState] = useState<number | null>(null);
    const [history, setHistory] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    const setCurrentTypeID = (typeID: number) => {
        setCurrentTypeIDState(typeID);
        setHistory((prev) => removeDuplicate([typeID, ...prev]));
    };

    const clearHistory = () => {
        setHistory([]);
        setCurrentTypeIDState(null);
    };

    return (
        <TypeExploreContext.Provider
            value={{ currentTypeID, history, setCurrentTypeID, clearHistory }}
        >
            {children}
        </TypeExploreContext.Provider>
    );
};

export const useTypeExplore = () => {
    const ctx = useContext(TypeExploreContext);
    if (!ctx) throw new Error("useTypeExplore must be used within a TypeExploreProvider");
    return ctx;
};
