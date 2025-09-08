import type React from "react";
import { useEffect, useImperativeHandle, useRef } from "react";

export interface AlongsideMainHandle {
    listenHeightChange?: (listener: (height: number) => void) => ResizeObserver;
}

export const AlongsideMain = ({
    ref,
    ...props
}: { ref?: React.Ref<AlongsideMainHandle> } & React.HTMLAttributes<HTMLDivElement>) => {
    const divRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        listenHeightChange(listener) {
            const ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === divRef.current) {
                        listener(entry.contentRect.height);
                    }
                }
            });
            if (divRef.current) {
                ro.observe(divRef.current);
            }
            return ro;
        },
    }));

    return <div ref={divRef} {...props}></div>;
};

export interface AlongsideSlaveHandle {
    setHeight?: (height: number) => void;
}

export const AlongsideSlave = ({
    ref,
    ...props
}: { ref?: React.Ref<AlongsideSlaveHandle> } & React.HTMLAttributes<HTMLDivElement>) => {
    const divRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        setHeight(height) {
            if (divRef.current) {
                divRef.current.style.height = `${height}px`;
            }
        },
    }));

    return <div ref={divRef} {...props}></div>;
};

export interface AlongsideProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    children: (
        main: React.Ref<AlongsideMainHandle>,
        slave: React.Ref<AlongsideSlaveHandle>
    ) => React.ReactNode;
}

export const Alongside = ({ children, ...props }: AlongsideProps) => {
    const mainRef = useRef<AlongsideMainHandle>(null);
    const slaveRef = useRef<AlongsideSlaveHandle>(null);

    useEffect(() => {
        if (mainRef.current && slaveRef.current) {
            const ro = mainRef.current.listenHeightChange?.((height) => {
                slaveRef.current?.setHeight?.(height);
            });
            return () => ro?.disconnect();
        }
    }, []);

    return <div {...props}>{children(mainRef, slaveRef)}</div>;
};
