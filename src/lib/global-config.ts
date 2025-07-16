"use client";

import type { i18n as I18nType } from "i18next";
import { i18n } from "@/locale/i18n";

// 配置项类型定义
interface AppSettings {
    theme: "Dark" | "Light";
    language: "zh" | "en";
    [key: string]: string | number | boolean;
}

// 全局配置管理器单例类
class GlobalConfigManager {
    private static instance: GlobalConfigManager;
    private _settings: AppSettings | null = null;
    private _i18n: I18nType | null = null;
    private _isInitialized = false;
    private _initPromise: Promise<void> | null = null;
    private _listeners: Set<() => void> = new Set();

    private constructor() {
        // 私有构造函数防止外部实例化
        // 使用全局i18n实例
        this._i18n = i18n;
    }

    // 获取单例实例
    static getInstance(): GlobalConfigManager {
        if (!GlobalConfigManager.instance) {
            GlobalConfigManager.instance = new GlobalConfigManager();
        }
        return GlobalConfigManager.instance;
    }

    // 初始化配置和i18n
    async initialize(settings?: AppSettings): Promise<void> {
        // 如果已经初始化，直接返回
        if (this._isInitialized) {
            console.log("GlobalConfigManager already initialized, skipping...");
            return;
        }

        if (this._initPromise) {
            return this._initPromise;
        }

        this._initPromise = this._doInitialize(settings);
        return this._initPromise;
    }

    private async _doInitialize(settings?: AppSettings): Promise<void> {
        try {
            // 如果没有提供settings，使用默认值
            if (!settings) {
                settings = {
                    theme: "Light",
                    language: "zh",
                };
            }

            this._settings = settings;

            // 如果语言不是当前语言，更新i18n
            if (this._i18n && this._i18n.language !== settings.language) {
                await this._i18n.changeLanguage(settings.language);
            }

            this._isInitialized = true;
            this._notifyListeners();

            console.log("GlobalConfigManager initialized with settings:", settings);
        } catch (error) {
            console.error("Error initializing GlobalConfigManager:", error);
            throw error;
        }
    }

    // 获取配置
    getSettings(): AppSettings | null {
        return this._settings;
    }

    // 获取i18n实例
    getI18n(): I18nType | null {
        return this._i18n;
    }

    // 检查是否已初始化
    isInitialized(): boolean {
        return this._isInitialized;
    }

    // 更新配置
    async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
        if (!this._settings) {
            throw new Error("GlobalConfigManager not initialized");
        }

        const oldSettings = { ...this._settings };

        // 过滤掉undefined值
        const filteredSettings = Object.entries(newSettings).reduce(
            (acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            },
            {} as Record<string, string | number | boolean>
        );

        this._settings = { ...this._settings, ...filteredSettings };

        // 如果语言发生变化，更新i18n
        if (newSettings.language && newSettings.language !== oldSettings.language && this._i18n) {
            try {
                await this._i18n.changeLanguage(newSettings.language);
                console.log("Language changed to:", newSettings.language);
            } catch (error) {
                console.error("Error changing language:", error);
            }
        }

        this._notifyListeners();
        console.log("Settings updated:", this._settings);
    }

    // 添加配置变化监听器
    addListener(listener: () => void): () => void {
        this._listeners.add(listener);

        // 返回取消订阅函数
        return () => {
            this._listeners.delete(listener);
        };
    }

    // 通知所有监听器
    private _notifyListeners(): void {
        this._listeners.forEach((listener) => {
            try {
                listener();
            } catch (error) {
                console.error("Error in config listener:", error);
            }
        });
    }

    // 重置配置（主要用于测试）
    reset(): void {
        this._settings = null;
        this._i18n = null;
        this._isInitialized = false;
        this._initPromise = null;
        this._listeners.clear();
    }
}

// 导出单例实例
export const globalConfig = GlobalConfigManager.getInstance();

// 导出类型
export type { AppSettings };
