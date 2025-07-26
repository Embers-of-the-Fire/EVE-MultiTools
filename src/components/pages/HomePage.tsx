"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons";
import { subtitle } from "@/components/primitives";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout/PageContainer";

export function HomePage() {
    const { t } = useTranslation();

    return (
        <PageContainer className="flex flex-1 flex-col gap-4 pt-0">
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-xxl text-center justify-center">
                    <span
                        className="tracking-tight inline font-semibold bg-linear-to-b from-[#FF1CF7] to-[#b249f8]
                        text-[2.3rem] lg:text-5xl leading-9 bg-clip-text text-transparent"
                    >
                        EVE MultiTools&nbsp;
                    </span>
                    <div className={subtitle({ class: "mt-4" })}>{t("main.description")}</div>
                </div>

                <div className="flex gap-3">
                    <Button asChild size="lg" className="rounded-full">
                        <a href={siteConfig.links.docs} target="_blank" rel="noopener noreferrer">
                            {t("common.documentation")}
                        </a>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full">
                        <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
                            <GithubIcon size={20} />
                            {t("common.github")}
                        </a>
                    </Button>
                </div>

                <div className="mt-8">
                    <Badge variant="outline" className="px-4 py-2">
                        <span>
                            {t("main.get_started_hint")}
                            <code className="font-mono text-sm font-medium">
                                components/pages/HomePage.tsx
                            </code>
                        </span>
                    </Badge>
                </div>
            </section>
        </PageContainer>
    );
}
