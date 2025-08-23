import { OctagonAlertIcon } from "lucide-react";
import type React from "react";
import { useLanguage } from "@/hooks/useAppSettings";
import { InternalLink } from "../Links";
import { PageLayout } from "../layout";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const GET_STARTED = {
    zh: (
        <>
            <h1>快速上手</h1>
            <p>
                Multitools
                被设计为支持多个游戏版本、多个游戏服务商和多个游戏账户，因此在使用基本功能前，需要进行一些基础的设置。
            </p>
            <h2>游戏数据</h2>
            <p>
                EVE Multitools 的所有所用到静态数据和 API
                配置均被预先打包为数据包，以供快加载和切换。在使用 EVE Multitools
                之前，你需要先获取一个数据包。 一般而言，数据包是一个以 <code>bundle</code>{" "}
                为后缀名的压缩文件。正常运营状况下，任何游戏的版本更新或软件更新都应该导致 EVE
                Multitools
                发布新的官方数据包。但是，你也可以从一些其他地方获取第三数据包（例如旧版本数据或自主打包数据）。
                <br />
                <b>EVE Multitools 不对非官方数据包的正常运行作保证。</b>
            </p>
            <p>
                当你获取一个这样的数据包后，你可以通过点击左侧栏的
                <InternalLink link="/bundle">数据包</InternalLink>子菜单来打开数据包管理页面。
            </p>
            <p>如果你已经导入了一些数据包，你可以在页面的右上角处切换数据包。</p>
            <h2>角色数据</h2>
            <Alert className="mt-8" variant="destructive">
                <OctagonAlertIcon />
                <AlertTitle>警告</AlertTitle>
                <AlertDescription>
                    角色数据为开发中功能，任何内容和指南可能大幅度修改而不进行预先提醒。
                </AlertDescription>
            </Alert>
            <p>当前版本暂时不支持角色相关功能。相应的菜单均为占位符。</p>
        </>
    ),
    en: (
        <>
            <h1>Quick Start</h1>
            <p>
                Multitools is designed to support multiple game versions, multiple game service
                providers, and multiple game accounts. Therefore, some basic setup is required
                before using the core features.
            </p>
            <h2>Game Data</h2>
            <p>
                All static data and API configurations used by EVE Multitools are pre-packaged into
                data bundles for fast loading and switching. Before using EVE Multitools, you need
                to obtain a data bundle first. Generally, a data bundle is a compressed file with
                the <code>bundle</code> suffix. Under normal operating conditions, any game version
                update or software update should result in EVE Multitools releasing new official
                data bundles. However, you can also obtain third-party data bundles from other
                sources (such as legacy version data or self-packaged data).
                <br />
                <b>
                    EVE Multitools does not guarantee the normal operation of unofficial data
                    bundles.
                </b>
            </p>
            <p>
                Once you have obtained such a data bundle, you can open the data bundle management
                page by clicking the
                <InternalLink link="/bundle">Data Bundle</InternalLink> submenu in the left sidebar.
            </p>
            <p>
                If you have already imported some data bundles, you can switch between data bundles
                in the upper right corner of the page.
            </p>
            <h2>Character Data</h2>
            <Alert className="mt-8" variant="destructive">
                <OctagonAlertIcon />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                    Character data is a feature under development. Any content and guides may be
                    significantly modified without prior notice.
                </AlertDescription>
            </Alert>
            <p>
                The current version does not yet support character-related features. The
                corresponding menus are all placeholders.
            </p>
        </>
    ),
} as const;

export function GetStartedPage() {
    const { language } = useLanguage();

    let localized: React.ReactNode;
    switch (language) {
        case "zh":
            localized = GET_STARTED.zh;
            break;
        // biome-ignore lint/complexity/noUselessSwitchCase: For future extension.
        case "en":
        default:
            localized = GET_STARTED.en;
            break;
    }

    return (
        <PageLayout>
            <section className="prose dark:prose-invert self-center">{localized}</section>
        </PageLayout>
    );
}
