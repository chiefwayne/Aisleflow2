/** Plans: free builds and previews; Essentials publishes and emails; Premium adds SMS, music and the Design Studio. */
export type PlanId = 'free' | 'essentials' | 'premium';
export type Feature = 'publish' | 'sms' | 'music' | 'design_studio' | 'memories' | 'save_the_date' | 'seating';

const PLAN_ORDER: PlanId[] = ['free', 'essentials', 'premium'];

export const PLAN_FEATURES: Record<PlanId, Record<Feature, boolean>> = {
  free: { publish: false, sms: false, music: false, design_studio: false, memories: false, save_the_date: false, seating: false },
  essentials: { publish: true, sms: false, music: false, design_studio: false, memories: false, save_the_date: false, seating: false },
  premium: { publish: true, sms: true, music: true, design_studio: true, memories: true, save_the_date: true, seating: true },
};

export const PLAN_NAMES: Record<PlanId, string> = {
  free: 'Free',
  essentials: 'Essentials',
  premium: 'Premium',
};

export function planOf(event: { plan?: string | null }): PlanId {
  return PLAN_ORDER.includes(event.plan as PlanId) ? (event.plan as PlanId) : 'free';
}

export function hasFeature(event: { plan?: string | null }, feature: Feature): boolean {
  return PLAN_FEATURES[planOf(event)][feature];
}

export function featureError(feature: Feature): string {
  switch (feature) {
    case 'publish':
      return 'Choose Essentials or Premium to publish your invitation.';
    case 'sms':
      return 'SMS is part of Premium. Upgrade to send text messages.';
    case 'music':
      return 'Your own song is part of Premium. Upgrade to add music.';
    case 'design_studio':
      return 'The Design Studio is part of Premium. Upgrade to customise your invitation.';
    case 'seating':
      return 'The seating chart is part of Premium.';
    case 'save_the_date':
      return 'Save-the-date mode is part of Premium.';
    case 'memories':
      return 'The Memories album is part of Premium. Upgrade to collect photos, messages and voice notes.';
  }
}

/** Returns the error to show, or null when the plan allows this channel. */
export function assertChannelAllowed(event: { plan?: string | null }, channel: 'email' | 'sms' | 'both'): string | null {
  return channel !== 'email' && !hasFeature(event, 'sms') ? featureError('sms') : null;
}

export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return PLAN_ORDER.indexOf(to) > PLAN_ORDER.indexOf(from);
}
