import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { bundleCommands, type BundleMetadata } from '@/native/bundle';
import { listen } from '@tauri-apps/api/event';

interface BundleState {
  // 状态
  bundles: BundleMetadata[];
  activeBundle: BundleMetadata | null;
  switchingToBundleId: string | null;
  failedBundleIds: Set<string>;
  isLoading: boolean;
  error: string | null;
}

interface BundleActions {
  // 方法
  loadBundles: (shouldAutoEnable?: boolean) => Promise<void>;
  switchBundle: (bundle: BundleMetadata) => Promise<void>;
  refreshBundles: () => Promise<void>;
  clearError: () => void;
  setSwitchingToBundleId: (id: string | null) => void;
  addFailedBundleId: (id: string) => void;
  removeFailedBundleId: (id: string) => void;
  setActiveBundle: (bundle: BundleMetadata | null) => void;
  setBundles: (bundles: BundleMetadata[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type BundleStore = BundleState & BundleActions;

// 用于存储事件监听器清理函数的全局变量
let unlisteners: (() => void)[] = [];
let switchingToBundleIdRef: string | null = null;

export const useBundleStore = create<BundleStore>()(
  devtools((set, get) => ({
    // 初始状态
    bundles: [],
    activeBundle: null,
    switchingToBundleId: null,
    failedBundleIds: new Set<string>(),
    isLoading: false,
    error: null,

    // Actions
    setSwitchingToBundleId: (id: string | null) => {
      switchingToBundleIdRef = id;
      set({ switchingToBundleId: id });
    },

    addFailedBundleId: (id: string) => {
      const { failedBundleIds } = get();
      const newSet = new Set(failedBundleIds);
      newSet.add(id);
      set({ failedBundleIds: newSet });
    },

    removeFailedBundleId: (id: string) => {
      const { failedBundleIds } = get();
      const newSet = new Set(failedBundleIds);
      newSet.delete(id);
      set({ failedBundleIds: newSet });
    },

    setActiveBundle: (bundle: BundleMetadata | null) => {
      set({ activeBundle: bundle });
    },

    setBundles: (bundles: BundleMetadata[]) => {
      set({ bundles });
    },

    setIsLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    // 加载所有bundle和当前启用的bundle
    loadBundles: async (shouldAutoEnable = false) => {
      const { setIsLoading, setError, setBundles, setActiveBundle } = get();
      
      try {
        setIsLoading(true);
        setError(null);

        // 获取所有bundle
        const allBundles = await bundleCommands.getBundles();
        setBundles(allBundles);

        // 获取当前启用的bundle ID
        const enabledBundleId = await bundleCommands.getEnabledBundleId();
        const active = allBundles.find((b) => b.serverID === enabledBundleId);
        setActiveBundle(active || null);

        // 如果需要，自动启用第一个
        if (shouldAutoEnable && !active && allBundles.length > 0) {
          const firstBundle = allBundles[0];
          // 触发切换，但不在此处等待
          bundleCommands.enableBundle(firstBundle.serverID);
        } else if (!active && allBundles.length === 0) {
          setActiveBundle(null);
        }
      } catch (err) {
        console.error('Failed to load bundles:', err);
        setError('Failed to load bundles');
      } finally {
        setIsLoading(false);
      }
    },

    // 刷新bundles（不自动启用）
    refreshBundles: async () => {
      const { loadBundles } = get();
      return loadBundles(false);
    },

    // 仅触发切换命令
    switchBundle: async (bundle: BundleMetadata) => {
      const { switchingToBundleId, setError, removeFailedBundleId, addFailedBundleId, setSwitchingToBundleId } = get();
      
      if (switchingToBundleId) return; // 防止重复点击
      
      try {
        setError(null);
        // 先移除失败状态（如果之前失败过）
        removeFailedBundleId(bundle.serverID);
        await bundleCommands.enableBundle(bundle.serverID);
      } catch (err) {
        console.error('Failed to initiate bundle switch:', err);
        setError('Failed to switch bundle');
        // 标记为失败
        addFailedBundleId(bundle.serverID);
        // 确保切换状态清除
        setSwitchingToBundleId(null);
      }
    },

    // 清除错误
    clearError: () => {
      set({ error: null });
    },
  }), {
    name: 'bundle-store',
  })
);

// 初始化事件监听器的函数
export const initializeBundleListeners = async () => {
  const { setSwitchingToBundleId, removeFailedBundleId, loadBundles } = useBundleStore.getState();
  
  try {
    // 清理之前的监听器
    unlisteners.forEach((unlisten) => unlisten());
    unlisteners = [];

    // Bundle切换开始事件
    const bundleChangeStartUnlisten = await listen<{ serverId: string }>(
      'bundle-change-start',
      (event) => {
        setSwitchingToBundleId(event.payload.serverId);
      }
    );
    unlisteners.push(bundleChangeStartUnlisten);

    // Bundle切换完成事件
    const bundleChangeFinishedUnlisten = await listen('bundle-change-finished', () => {
      const currentSwitchingId = switchingToBundleIdRef;
      setSwitchingToBundleId(null);
      // 成功切换时，移除失败状态
      if (currentSwitchingId) {
        removeFailedBundleId(currentSwitchingId);
      }
      loadBundles(false); // 切换完成后加载，不自动启用
    });
    unlisteners.push(bundleChangeFinishedUnlisten);

    // Bundle列表变化事件
    const bundlesChangedUnlisten = await listen('bundles-changed', () => {
      loadBundles(false); // 列表变化后加载，不自动启用
    });
    unlisteners.push(bundlesChangedUnlisten);
  } catch (e) {
    console.error('Failed to set up bundle listeners', e);
  }
};

// 清理事件监听器的函数
export const cleanupBundleListeners = () => {
  unlisteners.forEach((unlisten) => unlisten());
  unlisteners = [];
};
