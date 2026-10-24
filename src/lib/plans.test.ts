import { describe, expect, it } from 'vitest';
import { assertChannelAllowed, featureError, hasFeature, isUpgrade, planOf } from './plans';

describe('plans', () => {
  it('treats missing or unknown plans as free', () => {
    expect(planOf({})).toBe('free');
    expect(planOf({ plan: 'bogus' })).toBe('free');
  });

  it('gives each plan its features', () => {
    expect(hasFeature({ plan: 'free' }, 'publish')).toBe(false);
    expect(hasFeature({ plan: 'essentials' }, 'publish')).toBe(true);
    expect(hasFeature({ plan: 'essentials' }, 'sms')).toBe(false);
    expect(hasFeature({ plan: 'essentials' }, 'music')).toBe(false);
    expect(hasFeature({ plan: 'essentials' }, 'design_studio')).toBe(false);
    expect(hasFeature({ plan: 'premium' }, 'sms')).toBe(true);
    expect(hasFeature({ plan: 'premium' }, 'music')).toBe(true);
    expect(hasFeature({ plan: 'premium' }, 'design_studio')).toBe(true);
  });

  it('only allows SMS channels on Premium', () => {
    expect(assertChannelAllowed({ plan: 'essentials' }, 'email')).toBeNull();
    expect(assertChannelAllowed({ plan: 'essentials' }, 'sms')).toBe(featureError('sms'));
    expect(assertChannelAllowed({ plan: 'essentials' }, 'both')).toBe(featureError('sms'));
    expect(assertChannelAllowed({ plan: 'premium' }, 'both')).toBeNull();
  });

  it('only counts moves to a higher plan as upgrades', () => {
    expect(isUpgrade('free', 'essentials')).toBe(true);
    expect(isUpgrade('essentials', 'premium')).toBe(true);
    expect(isUpgrade('premium', 'essentials')).toBe(false);
    expect(isUpgrade('premium', 'premium')).toBe(false);
  });
});
