import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LoadingState {
  id: string;
  message: string;
  progress?: number;
}

interface GlobalLoadingState {
  loadingStates: LoadingState[];
  showLoadingUI: boolean;
}

interface GlobalLoadingActions {
  showLoading: (id: string, message: string, progress?: number) => void;
  hideLoading: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  setShowLoadingUI: (show: boolean) => void;
}

type GlobalLoadingStore = GlobalLoadingState & GlobalLoadingActions;

export const useGlobalLoadingStore = create<GlobalLoadingStore>()(
  devtools((set) => ({
    // 初始状态
    loadingStates: [],
    showLoadingUI: false,

    // Actions
    showLoading: (id: string, message: string, progress?: number) => {
      set((state) => {
        const filtered = state.loadingStates.filter((loadingState) => loadingState.id !== id);
        return {
          loadingStates: [...filtered, { id, message, progress }],
        };
      });
    },

    hideLoading: (id: string) => {
      set((state) => ({
        loadingStates: state.loadingStates.filter((loadingState) => loadingState.id !== id),
      }));
    },

    updateProgress: (id: string, progress: number) => {
      set((state) => ({
        loadingStates: state.loadingStates.map((loadingState) =>
          loadingState.id === id ? { ...loadingState, progress } : loadingState
        ),
      }));
    },

    setShowLoadingUI: (show: boolean) => {
      set({ showLoadingUI: show });
    },
  }), {
    name: 'global-loading-store',
  })
);

// 计算属性的 selectors
export const useIsLoading = () => useGlobalLoadingStore((state) => state.loadingStates.length > 0);

export const useCurrentLoadingState = () => useGlobalLoadingStore((state) => {
  const loadingStates = state.loadingStates;
  return loadingStates[loadingStates.length - 1] || null;
});

export const useLoadingMessage = () => useGlobalLoadingStore((state) => {
  const loadingStates = state.loadingStates;
  const currentState = loadingStates[loadingStates.length - 1];
  return currentState?.message || '';
});

export const useLoadingProgress = () => useGlobalLoadingStore((state) => {
  const loadingStates = state.loadingStates;
  const currentState = loadingStates[loadingStates.length - 1];
  return currentState?.progress;
});
