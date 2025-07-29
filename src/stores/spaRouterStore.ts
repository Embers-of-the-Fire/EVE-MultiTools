import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { RouteHistory, RouterState } from '@/types/router';

type RouterAction =
  | { type: 'NAVIGATE'; path: string; title: string }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'REPLACE'; path: string; title: string };

interface SPARouterState extends RouterState {}

interface SPARouterActions {
  navigate: (path: string, title: string) => void;
  goBack: () => void;
  goForward: () => void;
  replace: (path: string, title: string) => void;
  dispatch: (action: RouterAction) => void;
}

type SPARouterStore = SPARouterState & SPARouterActions;

const initialState: RouterState = {
  currentPath: '/',
  history: [{ path: '/', timestamp: Date.now(), title: 'Home' }],
  canGoBack: false,
  canGoForward: false,
};

function routerReducer(state: RouterState, action: RouterAction): RouterState {
  switch (action.type) {
    case 'NAVIGATE': {
      const newHistory = [...state.history];
      const currentIndex = newHistory.findIndex((h) => h.path === state.currentPath);

      // 如果不是当前路径，添加到历史记录
      if (action.path !== state.currentPath) {
        const newRecord: RouteHistory = {
          path: action.path,
          timestamp: Date.now(),
          title: action.title,
        };

        // 如果当前不在历史记录末尾，删除后面的记录
        if (currentIndex < newHistory.length - 1) {
          newHistory.splice(currentIndex + 1);
        }

        newHistory.push(newRecord);
      }

      return {
        ...state,
        currentPath: action.path,
        history: newHistory,
        canGoBack: newHistory.length > 1,
        canGoForward: false,
      };
    }

    case 'GO_BACK': {
      const currentIndex = state.history.findIndex((h) => h.path === state.currentPath);
      if (currentIndex > 0) {
        const previousPath = state.history[currentIndex - 1].path;
        return {
          ...state,
          currentPath: previousPath,
          canGoBack: currentIndex > 1,
          canGoForward: true,
        };
      }
      return state;
    }

    case 'GO_FORWARD': {
      const currentIndex = state.history.findIndex((h) => h.path === state.currentPath);
      if (currentIndex < state.history.length - 1) {
        const nextPath = state.history[currentIndex + 1].path;
        return {
          ...state,
          currentPath: nextPath,
          canGoBack: true,
          canGoForward: currentIndex < state.history.length - 2,
        };
      }
      return state;
    }

    case 'REPLACE': {
      const newHistory = [...state.history];
      const currentIndex = newHistory.findIndex((h) => h.path === state.currentPath);
      
      if (currentIndex >= 0) {
        newHistory[currentIndex] = {
          path: action.path,
          timestamp: Date.now(),
          title: action.title,
        };
      }

      return {
        ...state,
        currentPath: action.path,
        history: newHistory,
      };
    }

    default:
      return state;
  }
}

export const useSPARouterStore = create<SPARouterStore>()(
  devtools((set, get) => ({
    // 初始状态
    ...initialState,

    // Actions
    dispatch: (action: RouterAction) => {
      const currentState = get();
      const newState = routerReducer(currentState, action);
      set(newState);
    },

    navigate: (path: string, title: string) => {
      const { dispatch } = get();
      dispatch({ type: 'NAVIGATE', path, title });
    },

    goBack: () => {
      const { dispatch } = get();
      dispatch({ type: 'GO_BACK' });
    },

    goForward: () => {
      const { dispatch } = get();
      dispatch({ type: 'GO_FORWARD' });
    },

    replace: (path: string, title: string) => {
      const { dispatch } = get();
      dispatch({ type: 'REPLACE', path, title });
    },
  }), {
    name: 'spa-router-store',
  })
);
