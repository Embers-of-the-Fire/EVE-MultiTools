import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { removeDuplicate } from '@/utils/iterator';

interface TypeExploreState {
  currentTypeID: number | null;
  history: number[];
}

interface TypeExploreActions {
  setCurrentTypeID: (typeID: number) => void;
  clearHistory: () => void;
}

type TypeExploreStore = TypeExploreState & TypeExploreActions;

export const useTypeExploreStore = create<TypeExploreStore>()(
  devtools((set, get) => ({
    // 初始状态
    currentTypeID: null,
    history: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

    // Actions
    setCurrentTypeID: (typeID: number) => {
      const { history } = get();
      set({
        currentTypeID: typeID,
        history: removeDuplicate([typeID, ...history]),
      });
    },

    clearHistory: () => {
      set({
        history: [],
        currentTypeID: null,
      });
    },
  }), {
    name: 'type-explore-store',
  })
);
