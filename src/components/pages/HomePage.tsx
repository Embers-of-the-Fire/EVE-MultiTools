"use client";

import { useTranslation } from "react-i18next";
import { GithubIcon } from "@/components/icons";
import { PageContainer } from "@/components/layout/PageContainer";
import { subtitle } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useSPARouter } from "@/hooks/useSPARouter";

export function HomePage() {
    const { t } = useTranslation();
    const { navigate } = useSPARouter();

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
                    <Button
                        size="lg"
                        className="rounded-full"
                        onClick={() => navigate("/about", "about")}
                    >
                        {t("common.about")}
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full">
                        <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
                            <GithubIcon size={20} />
                            {t("common.github")}
                        </a>
                    </Button>
                </div>
            </section>
        </PageContainer>
    );
}
