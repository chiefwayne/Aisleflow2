import type { EventRecord } from '@/lib/types';

export interface MenuOption {
  name: string;
  description?: string;
}

/** The couple's meal options. Empty means guests type their meal as free text. */
export function getMenuOptions(event: Pick<EventRecord, 'custom_sections'>): MenuOption[] {
  const options = (event.custom_sections as any)?.menu?.options;
  if (!Array.isArray(options)) return [];
  return options
    .filter((option) => typeof option?.name === 'string' && option.name.trim())
    .map((option) => ({ name: option.name.trim(), description: option.description?.trim() || undefined }));
}

/** True when the meal is blank, there is no menu, or it matches a menu option. */
export function isMealOnMenu(menu: MenuOption[], meal?: string | null): boolean {
  if (!meal || menu.length === 0) return true;
  return menu.some((option) => option.name === meal);
}
