import type { Language } from "@/native";
import type { DataGetter } from "@/stores/dataStore";
import { LinkKey } from "@/types/data";

export async function getMarketTypeLinks(
    typeId: number,
    {
        language,
        t,
        getData,
    }: { language: Language; t: (key: string) => string; getData: DataGetter }
): Promise<
    {
        url: string;
        name: string;
    }[]
> {
    const links = [];

    const c3qUrl =
        language === "zh"
            ? await getData("getLinkUrl", LinkKey.MarketEveC3qCc, {
                  typeId: typeId.toString(),
              })
            : await getData("getLinkUrl", LinkKey.MarketEveC3qCcEn, {
                  typeId: typeId.toString(),
              });
    if (c3qUrl)
        links.push({
            url: c3qUrl,
            name: t("market.link.eve_c3q_cc"),
        });

    const tycoonUrl = await getData("getLinkUrl", LinkKey.MarketEveTycoon, {
        typeId: typeId.toString(),
    });
    if (tycoonUrl)
        links.push({
            url: tycoonUrl,
            name: t("market.link.eve_tycoon"),
        });

    return links;
}
