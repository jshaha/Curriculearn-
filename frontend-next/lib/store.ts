import { create } from "zustand";

import type { SectionId } from "@/content/siteContent";

interface UIState {
  hoveredSectionId: SectionId | null;
  selectedSectionId: SectionId | null;
  isModalOpen: boolean;
  selectedItemId: string | null;
  projectsFilterTags: string[];
  prefersReducedMotion: boolean;
  isScrolling: boolean;
  setHover: (sectionId: SectionId | null) => void;
  openSection: (sectionId: SectionId) => void;
  openItem: (itemId: string) => void;
  backToList: () => void;
  closeModal: () => void;
  setProjectsFilterTags: (tags: string[]) => void;
  toggleProjectFilterTag: (tag: string) => void;
  clearProjectFilters: () => void;
  setPrefersReducedMotion: (value: boolean) => void;
  setScrolling: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  hoveredSectionId: null,
  selectedSectionId: null,
  isModalOpen: false,
  selectedItemId: null,
  projectsFilterTags: [],
  prefersReducedMotion: false,
  isScrolling: false,
  setHover: (sectionId) =>
    set((state) =>
      state.hoveredSectionId === sectionId
        ? state
        : { hoveredSectionId: sectionId }
    ),
  openSection: (sectionId) =>
    set({
      selectedSectionId: sectionId,
      isModalOpen: true,
      selectedItemId: null
    }),
  openItem: (itemId) => set({ selectedItemId: itemId }),
  backToList: () => set({ selectedItemId: null }),
  closeModal: () =>
    set({
      isModalOpen: false,
      selectedSectionId: null,
      selectedItemId: null,
      hoveredSectionId: null,
      projectsFilterTags: []
    }),
  setProjectsFilterTags: (tags) => set({ projectsFilterTags: tags }),
  toggleProjectFilterTag: (tag) =>
    set((state) => ({
      projectsFilterTags: state.projectsFilterTags.includes(tag)
        ? state.projectsFilterTags.filter((currentTag) => currentTag !== tag)
        : [...state.projectsFilterTags, tag]
    })),
  clearProjectFilters: () => set({ projectsFilterTags: [] }),
  setPrefersReducedMotion: (value) => set({ prefersReducedMotion: value }),
  setScrolling: (value) => set({ isScrolling: value })
}));

export const selectIsMotionReduced = (state: UIState) =>
  state.prefersReducedMotion || state.isScrolling || state.isModalOpen;
