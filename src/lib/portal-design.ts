import type React from 'react';
import type {
  GuestPortalContainerPadding,
  GuestPortalSectionId,
  GuestPortalSectionStyle,
  GuestPortalSectionStyleTarget,
  TemplateDesignRecord,
} from '@/lib/types';

/** The design fields the Studio preview and the guest portal both style from. */
export type DesignStyleSource = Partial<
  Pick<
    TemplateDesignRecord,
    | 'surface_color'
    | 'border_color'
    | 'shadow_color'
    | 'bg_color'
    | 'container_surface_color'
    | 'container_border_color'
    | 'container_shadow_color'
    | 'container_radius'
    | 'container_border_width'
    | 'container_layout'
    | 'container_padding'
    | 'text_frame_style'
    | 'text_frame_radius'
    | 'text_frame_border_width'
    | 'section_styles'
    | 'section_order'
    | 'hidden_sections'
    | 'page_background_mode'
    | 'page_background_image_url'
  >
>;

export const ALL_GUEST_SECTIONS: GuestPortalSectionId[] = [
  'our-story',
  'schedule',
  'travel',
  'rsvp',
  'registry',
  'photos',
  'wedding-party',
  'local-recs',
  'faq',
];

/**
 * Studio designs set container_layout; the built-in themes do not.
 * The portal applies layout controls only to Studio designs, so built-in themes keep their look.
 */
export function isStudioDesign(design: DesignStyleSource): boolean {
  return !!design.container_layout;
}

export function computeSectionStyle(
  design: DesignStyleSource,
  target: GuestPortalSectionStyleTarget
): GuestPortalSectionStyle {
  const styles = design.section_styles || {};
  const style = styles[target] || {};

  if (!style.useCustomStyle) {
    return {
      containerLayout: design.container_layout || 'card',
      containerPadding: design.container_padding || 'balanced',
      containerSurface: design.container_surface_color || design.surface_color || '#FFFFFF',
      containerBorder: design.container_border_color || design.border_color || '#E8E0D7',
      containerShadow: design.container_shadow_color || design.shadow_color || 'rgba(44, 37, 35, 0.06)',
      containerRadius: design.container_radius ?? 28,
      containerBorderWidth: design.container_border_width ?? 1,
      textFrameStyle: design.text_frame_style || 'glass',
      textFrameRadius: design.text_frame_radius ?? 20,
      textFrameBorderWidth: design.text_frame_border_width ?? 1,
      backgroundMode: 'none',
      backgroundImageUrl: '',
    };
  }

  return {
    useCustomStyle: true,
    containerLayout: style.containerLayout || design.container_layout || 'card',
    containerPadding: style.containerPadding || design.container_padding || 'balanced',
    containerSurface: style.containerSurface || design.container_surface_color || design.surface_color || '#FFFFFF',
    containerBorder: style.containerBorder || design.container_border_color || design.border_color || '#E8E0D7',
    containerShadow: style.containerShadow || design.container_shadow_color || design.shadow_color || 'rgba(44, 37, 35, 0.06)',
    containerRadius: style.containerRadius ?? design.container_radius ?? 28,
    containerBorderWidth: style.containerBorderWidth ?? design.container_border_width ?? 1,
    backgroundMode: style.backgroundMode || 'none',
    backgroundImageUrl: style.backgroundImageUrl || '',
    contentImageUrl: style.contentImageUrl,
    textFrameStyle: style.textFrameStyle || design.text_frame_style || 'glass',
    textFrameRadius: style.textFrameRadius ?? design.text_frame_radius ?? 20,
    textFrameBorderWidth: style.textFrameBorderWidth ?? design.text_frame_border_width ?? 1,
  };
}

export function containerInlineStyle(style: GuestPortalSectionStyle): React.CSSProperties {
  const isBorderless = style.containerLayout === 'borderless';

  return {
    backgroundColor: isBorderless ? 'transparent' : style.containerSurface,
    borderColor: isBorderless ? 'transparent' : style.containerBorder,
    borderStyle: 'solid',
    borderRadius: isBorderless ? 0 : `${style.containerRadius}px`,
    borderWidth: isBorderless ? 0 : `${style.containerBorderWidth}px`,
    boxShadow: isBorderless ? 'none' : `0 12px 36px ${style.containerShadow}`,
  };
}

const PADDING_CLASSES: Record<GuestPortalContainerPadding, string> = {
  compact: 'p-4 sm:p-5',
  balanced: 'p-6 sm:p-8',
  spacious: 'p-8 sm:p-12',
};

/** Classes for a section container: padding, plus edge-to-edge for full-width and extra inset for inset. */
export function containerClassName(style: GuestPortalSectionStyle): string {
  const padding = PADDING_CLASSES[style.containerPadding || 'balanced'];
  if (style.containerLayout === 'full-width') return `${padding} -mx-5 sm:-mx-8`;
  if (style.containerLayout === 'inset') return `${padding} mx-2 sm:mx-6`;
  return padding;
}

/** Every section in the design's order. Unknown ids are dropped and missing ones appended. */
export function normalizedSectionOrder(design: DesignStyleSource): GuestPortalSectionId[] {
  const known = new Set<string>(ALL_GUEST_SECTIONS);
  const ordered = (design.section_order || []).filter((id): id is GuestPortalSectionId => known.has(id));
  return [...new Set([...ordered, ...ALL_GUEST_SECTIONS])];
}

/** Visible sections in the design's order. */
export function orderedVisibleSections(design: DesignStyleSource): GuestPortalSectionId[] {
  const hidden = new Set<string>(design.hidden_sections || []);
  return normalizedSectionOrder(design).filter((id) => !hidden.has(id));
}

export function pageBackgroundStyle(design: DesignStyleSource): React.CSSProperties {
  const url = design.page_background_image_url;
  if (!url || !design.page_background_mode || design.page_background_mode === 'none') return {};

  const image = `url("${url.replace(/"/g, '%22')}")`;
  switch (design.page_background_mode) {
    case 'full-bleed':
      return { backgroundImage: image, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' };
    case 'soft-fill': {
      const tint = `color-mix(in srgb, ${design.bg_color || '#FAF7F2'} 85%, transparent)`;
      return {
        backgroundImage: `linear-gradient(${tint}, ${tint}), ${image}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    case 'pattern':
      return { backgroundImage: image, backgroundSize: '320px', backgroundRepeat: 'repeat' };
    default:
      return {};
  }
}
