import type React from "react";
import { useLanguage } from "@/hooks/useAppSettings";
import { Described } from "../Described";
import { ExternalLink } from "../Links";
import { PageLayout } from "../layout";

const ABOUT = {
    zh: (
        <>
            <h1>关于 EVE Multitools</h1>
            <p>
                <b>EVE Multitools</b> 是一个开源的跨平台桌面应用程序，旨在为
                <ExternalLink link="https://www.eveonline.com/">EVE Online</ExternalLink>
                玩家提供一站式的工具和资源。它集成了多种功能，帮助玩家更高效地管理游戏内的各种活动和信息。
            </p>
            <h2>主要功能</h2>
            <p>
                EVE Multitools
                侧重于提供基于游戏数据的数据展示、管理和计算功能，而非提供一个实时的、游戏外的模拟游戏环境。
                EVE Multitools
                的目标是成为一个多功能的工具箱，帮助玩家更好地理解和利用游戏内的数据和机制，从而提升他们的游戏体验。
            </p>
            <details>
                <summary>设计功能</summary>
                <ul>
                    <li>市场查询、批量订单统计和估价</li>
                    <li>资产查询和估价</li>
                    <li>制造、反应和提炼精算</li>
                    <li>角色邮件管理</li>
                    <li>角色技能统计和技能队列查看</li>
                </ul>
            </details>
            <h2>安全</h2>
            <p>
                考虑到有关
                <ExternalLink link="https://support.eveonline.com/hc/zh-cn/articles/8413329735580-EVE%E6%9C%80%E7%BB%88%E7%94%A8%E6%88%B7%E8%AE%B8%E5%8F%AF%E5%8D%8F%E8%AE%AE">
                    EVE Online EULA
                </ExternalLink>
                的限制，EVE Multitools 不计划提供云服务功能。也就是说，所有 EVE Multitools
                展示的内容，均为借助官方 API（即
                <Described title="EVE Swagger Interface" asChild>
                    <ExternalLink link="https://developers.eveonline.com/api-explorer">
                        ESI
                    </ExternalLink>
                </Described>
                ） 获取的公开数据，或是用户自行导入的数据。
            </p>
            <p>
                部分功能可能会涉及到需要用户提供其角色的 ESI
                绑定。这些绑定信息仅存储在用户的本地设备上，绝不会上传到任何服务器或云端。 EVE
                Multitools 不会收集、存储或分享任何用户的个人数据，确保用户的隐私和账号安全。
                <br />
                <b>请勿向任何人透露您的 EVE 账号信息，包括但不限于用户名、密码等。</b>
            </p>
            <p>
                EVE Multitools 基于 Tauri 开发，因此前端展示使用 HTML 引擎实现。
                为了便于报告错误，EVE Multitools 在发行版中同样开启了调试工具权限。 你可以通过
                <kbd>F12</kbd> 打开调试工具。
                <br />
                <b className="text-red-500">
                    不要黏贴任何不可信来源的文本到调试工具中！！！这可能会导致账号信息泄露！！！
                </b>
            </p>
            <h2>开源</h2>
            <p>
                EVE Multitools 在
                <ExternalLink link="https://mit-license.org/">MIT 许可证</ExternalLink>和/或
                <ExternalLink link="https://www.apache.org/licenses/LICENSE-2.0.html">
                    Apache 2.0 许可证
                </ExternalLink>
                下开源。
            </p>
            <p>
                <ExternalLink link="https://github.com/Embers-of-the-Fire/eve-multitools">
                    EVE Multitools on GitHub
                </ExternalLink>
            </p>
            <h3>致谢</h3>
            <p>感谢以下开源项目支持 EVE Multitools 的开发：</p>
            <ul>
                <li>
                    <ExternalLink link="https://tauri.app">Tauri</ExternalLink> -
                    用于构建跨平台桌面应用程序的框架
                </li>
                <li>
                    <ExternalLink link="https://nextjs.org">Next.js</ExternalLink> - React
                    的服务端渲染框架
                </li>
                <li>
                    <ExternalLink link="https://ui.shadcn.com">ShadCN/UI</ExternalLink> - 基于 Radix
                    UI 和 Tailwind CSS 的组件库
                </li>
                <li>
                    <ExternalLink link="https://react.dev/">React</ExternalLink> -
                    用于构建用户界面的 JavaScript 库
                </li>
                <li>
                    <ExternalLink link="https://www.typescriptlang.org/">TypeScript</ExternalLink>-
                    JavaScript 的超集，添加了静态类型
                </li>
                <li>
                    <ExternalLink link="https://rust-lang.org">Rust</ExternalLink> -
                    用于编写高性能后端逻辑的系统编程语言
                </li>
            </ul>
            <p>以及众多其他开源项目和库。</p>
            <p>
                特别感谢 <ExternalLink link="https://ccpgames.com/">CCP Games</ExternalLink>
                创造了 EVE Online 这个令人着迷的宇宙，以及他们对第三方开发者社区的支持和开放态度。
            </p>
            <p>感谢 EVE Online 玩家社区的反馈和建议，你们的支持是这个工具不断改进的动力。</p>
            <p>感谢所有测试用户，感谢你们的耐心和宝贵意见，帮助我们发现并修复了许多问题。</p>
            <p>
                最后，感谢每一位使用 EVE Multitools
                的克隆飞行员，愿这个工具能让你们的新伊甸之旅更加精彩。
            </p>
            <p>Fly safe, o7</p>
        </>
    ),
    en: (
        <>
            <h1>About EVE Multitools</h1>
            <p>
                <b>EVE Multitools</b> is an open-source cross-platform desktop application designed
                to provide
                <ExternalLink link="https://www.eveonline.com/">EVE Online</ExternalLink>
                players with a one-stop solution for tools and resources. It integrates multiple
                functions to help players more efficiently manage various in-game activities and
                information.
            </p>
            <h2>Main Features</h2>
            <p>
                EVE Multitools focuses on providing data display, management, and calculation
                functions based on game data, rather than providing a real-time, out-of-game
                simulated gaming environment. The goal of EVE Multitools is to become a
                multifunctional toolbox that helps players better understand and utilize in-game
                data and mechanics, thereby enhancing their gaming experience.
            </p>
            <details>
                <summary>Designed Features</summary>
                <ul>
                    <li>Market queries, bulk order statistics and pricing</li>
                    <li>Asset queries and valuation</li>
                    <li>Manufacturing, reaction and refining calculations</li>
                    <li>Character mail management</li>
                    <li>Character skill statistics and skill queue viewing</li>
                </ul>
            </details>
            <h2>Security</h2>
            <p>
                Considering the restrictions of the
                <ExternalLink link="https://support.eveonline.com/hc/en-us/articles/8413329735580-EVE-Online-End-User-License-Agreement">
                    EVE Online EULA
                </ExternalLink>
                , EVE Multitools does not plan to provide cloud service functionality. This means
                that all content displayed by EVE Multitools is either public data obtained through
                the official API (i.e.,
                <Described title="EVE Swagger Interface" asChild>
                    <ExternalLink link="https://developers.eveonline.com/api-explorer">
                        ESI
                    </ExternalLink>
                </Described>
                ) or data imported by users themselves.
            </p>
            <p>
                Some features may require users to provide ESI bindings for their characters. This
                binding information is only stored on the user's local device and will never be
                uploaded to any server or cloud. EVE Multitools does not collect, store, or share
                any user's personal data, ensuring user privacy and account security.
                <br />
                <b>
                    Please do not disclose your EVE account information to anyone, including but not
                    limited to username, password, etc.
                </b>
            </p>
            <p>
                EVE Multitools is developed based on Tauri, so the frontend display is implemented
                using an HTML engine. For ease of error reporting, EVE Multitools also enables debug
                tool permissions in the release version. You can open the devtools by pressing
                <kbd>F12</kbd>.
                <br />
                <b className="text-red-500">
                    Do not paste any text from untrusted sources into the devtools!!! This may lead
                    to account information leakage!!!
                </b>
            </p>
            <h2>Open Source</h2>
            <p>
                EVE Multitools is open source under the
                <ExternalLink link="https://mit-license.org/">MIT License</ExternalLink> and/or
                <ExternalLink link="https://www.apache.org/licenses/LICENSE-2.0.html">
                    Apache 2.0 License
                </ExternalLink>
                .
            </p>
            <p>
                <ExternalLink link="https://github.com/Embers-of-the-Fire/eve-multitools">
                    EVE Multitools on GitHub
                </ExternalLink>
            </p>
            <h3>Acknowledgments</h3>
            <p>
                Thanks to the following open source projects that support the development of EVE
                Multitools:
            </p>
            <ul>
                <li>
                    <ExternalLink link="https://tauri.app">Tauri</ExternalLink> - A framework for
                    building cross-platform desktop applications
                </li>
                <li>
                    <ExternalLink link="https://nextjs.org">Next.js</ExternalLink> - A server-side
                    rendering framework for React
                </li>
                <li>
                    <ExternalLink link="https://ui.shadcn.com">ShadCN/UI</ExternalLink> - A
                    component library based on Radix UI and Tailwind CSS
                </li>
                <li>
                    <ExternalLink link="https://react.dev/">React</ExternalLink> - A JavaScript
                    library for building user interfaces
                </li>
                <li>
                    <ExternalLink link="https://www.typescriptlang.org/">TypeScript</ExternalLink> -
                    A superset of JavaScript that adds static typing
                </li>
                <li>
                    <ExternalLink link="https://rust-lang.org">Rust</ExternalLink> - A systems
                    programming language for writing high-performance backend logic
                </li>
            </ul>
            <p>And many other open source projects and libraries.</p>
            <p>
                Special thanks to
                <ExternalLink link="https://ccpgames.com/">CCP Games</ExternalLink>
                for creating the fascinating universe of EVE Online, and for their support and open
                attitude towards the third-party developer community.
            </p>
            <p>
                Thanks to the EVE Online player community for their feedback and suggestions. Your
                support is the driving force behind the continuous improvement of this tool.
            </p>
            <p>
                Thanks to all beta testers for your patience and valuable feedback, which helped us
                discover and fix many issues.
            </p>
            <p>
                Finally, thanks to every capsuleer who uses EVE Multitools. May this tool make your
                journey in New Eden even more exciting.
            </p>
            <p>Fly safe, o7</p>
        </>
    ),
} as const;

export function AboutPage() {
    const { language } = useLanguage();

    let localized: React.ReactNode;
    switch (language) {
        case "zh":
            localized = ABOUT.zh;
            break;
        // biome-ignore lint/complexity/noUselessSwitchCase: For future language expansion.
        case "en":
        default:
            localized = ABOUT.en;
            break;
    }

    return (
        <PageLayout>
            <section className="prose dark:prose-invert self-center">{localized}</section>
        </PageLayout>
    );
}
