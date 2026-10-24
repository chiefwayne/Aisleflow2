'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Gift,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
  Lock,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Users,
  Coffee,
  Utensils,
  Compass,
  Hotel,
  HelpCircle,
  Check,
  CalendarPlus
} from 'lucide-react';
import {
  EventRecord,
  GuestRecord,
  ScheduleItemRecord,
  CustomRsvpQuestionRecord,
  RegistryItemRecord,
  PhotoRecord,
  TemplateDesignRecord,
  GuestPortalSectionId
} from '@/lib/types';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import {
  computeSectionStyle,
  containerClassName,
  containerInlineStyle,
  isStudioDesign,
  orderedVisibleSections,
  pageBackgroundStyle,
} from '@/lib/portal-design';
import WaxSealOpening from '@/components/WaxSeal';
import { BotanicalCorner, GoldHairlineDivider } from '@/components/MotifDecorations';
import { buildIcs, downloadIcs } from '@/lib/ics';
import { getMenuOptions } from '@/lib/menu';
import { fill, PORTAL_LANGUAGES, portalLanguageOf, portalStrings } from '@/lib/portal-i18n';
import { hasFeature } from '@/lib/plans';
import { submitRsvpAction, uploadPhotoAction, contributeToRegistryAction } from '@/app/actions/wedding-actions';

// Built-in themes keep the portal's original section order.
const DEFAULT_SECTION_ORDER: GuestPortalSectionId[] = [
  'our-story',
  'schedule',
  'travel',
  'wedding-party',
  'local-recs',
  'faq',
  'rsvp',
  'photos',
  'registry',
];

interface GuestPortalViewProps {
  event: EventRecord;
  primaryGuest?: GuestRecord | null;
  partyMembers?: GuestRecord[];
  scheduleItems?: ScheduleItemRecord[];
  customQuestions?: CustomRsvpQuestionRecord[];
  registryItems?: RegistryItemRecord[];
  initialPhotos?: PhotoRecord[];
  initialResponses?: any[];
  initialScheduleRsvps?: any[];
  customTheme?: TemplateDesignRecord;
  previewMode?: boolean;
  /** The couple's public short link: no guest identity, no RSVP, uploads or pledges. */
  publicView?: boolean;
}

const COMMON_DIETARY_TAGS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut Allergy',
  'Shellfish Allergy',
  'Halal',
  'Kosher',
];

export default function GuestPortalView({
  event,
  primaryGuest,
  partyMembers = [],
  scheduleItems = [],
  customQuestions = [],
  registryItems: initialRegistryItems = [],
  initialPhotos = [],
  initialResponses = [],
  initialScheduleRsvps = [],
  customTheme,
  previewMode = false,
  publicView = false,
}: GuestPortalViewProps) {
  const baseTheme =
    customTheme ||
    (event?.theme_id ? BUILTIN_THEMES[event.theme_id] : null) ||
    BUILTIN_THEMES['royal-floral'];

  const tr = portalStrings(event?.language);
  const locale = PORTAL_LANGUAGES[portalLanguageOf(event?.language)].locale;

  const theme: TemplateDesignRecord = {
    ...baseTheme,
    ...(event?.theme_config && typeof event.theme_config === 'object' ? event.theme_config : {}),
  };

  const fallbackGuest: GuestRecord = {
    id: 'preview-guest-id',
    event_id: event?.id || 'preview-event',
    access_token: 'preview_token',
    first_name: 'Elena',
    last_name: 'Vance',
    is_vip: true,
    relationship: 'Honored Guest',
    rsvp_status: 'pending',
    plus_one_allowed: true,
    tags: ['vip'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const activeGuest = primaryGuest || fallbackGuest;
  const allGuests =
    partyMembers && partyMembers.length > 0
      ? partyMembers.filter(Boolean)
      : [activeGuest];

  // Opening screen state
  const [hasOpened, setHasOpened] = useState(previewMode);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    else {
      audio.pause();
      setMusicPlaying(false);
    }
  };

  // 4-Step RSVP Wizard State
  // Step 1: Attendance, Step 2: Sub-Events, Step 3: Dining & Questions, Step 4: Review, Step 5: Confirmed
  const [rsvpStep, setRsvpStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const rsvpCardRef = useRef<HTMLDivElement>(null);
  const rsvpStepMounted = useRef(false);

  // Party RSVP Form State
  const [partyState, setPartyState] = useState<
    Record<
      string,
      {
        rsvp_status: 'attending' | 'declined' | 'pending';
        meal_choice: string;
        dietary_notes: string;
        dietary_tags: string[];
        plus_one_name: string;
        plus_one_meal: string;
      }
    >
  >(() => {
    const initial: Record<string, any> = {};
    allGuests.forEach((g) => {
      if (g && g.id) {
        initial[g.id] = {
          rsvp_status: g.rsvp_status || 'pending',
          meal_choice: g.meal_choice || '',
          dietary_notes: g.dietary_notes || '',
          dietary_tags: g.dietary_tags || [],
          plus_one_name: g.plus_one_name || '',
          plus_one_meal: g.plus_one_meal || '',
        };
      }
    });
    return initial;
  });

  // Schedule sub-event RSVPs per guest: { [guestId]: { [scheduleItemId]: 'attending' | 'declined' } }
  const [subEventRsvps, setSubEventRsvps] = useState<Record<string, Record<string, 'attending' | 'declined'>>>(() => {
    const initial: Record<string, Record<string, 'attending' | 'declined'>> = {};
    allGuests.forEach((g) => {
      initial[g.id] = {};
      scheduleItems.forEach((item) => {
        const found = (initialScheduleRsvps || []).find(
          (r: any) => r.guest_id === g.id && r.schedule_item_id === item.id
        );
        initial[g.id][item.id] = found?.status === 'declined' ? 'declined' : 'attending';
      });
    });
    return initial;
  });

  // Custom question responses state: { [questionId]: value }
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    (initialResponses || []).forEach((r: any) => {
      if (r.question_id) {
        initial[r.question_id] = r.response_value ?? r.response_text ?? '';
      }
    });
    return initial;
  });

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Accordion FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Registry & Contribution modal
  const [registryList, setRegistryList] = useState(initialRegistryItems || []);
  const [activeCashFund, setActiveCashFund] = useState<RegistryItemRecord | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState('100');
  const [pledgeName, setPledgeName] = useState(
    activeGuest.first_name + (activeGuest.last_name ? ` ${activeGuest.last_name}` : '')
  );
  const [pledgeMessage, setPledgeMessage] = useState('');
  const [isPledging, setIsPledging] = useState(false);
  const [pledgeSuccess, setPledgeSuccess] = useState(false);
  const [pledgeError, setPledgeError] = useState('');
  const [copiedZelle, setCopiedZelle] = useState(false);

  // Photo uploads
  const [photos, setPhotos] = useState(initialPhotos || []);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      const difference = +new Date(event.wedding_date) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      }
    };
    calculateCountdown();
    const timer = setInterval(calculateCountdown, 60000);
    return () => clearInterval(timer);
  }, [event.wedding_date]);

  // Bring the RSVP card back into view when moving between steps (long steps on phones)
  useEffect(() => {
    if (!rsvpStepMounted.current) {
      rsvpStepMounted.current = true;
      return;
    }
    if (previewMode) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rsvpCardRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [rsvpStep, previewMode]);

  // Check deadline lockout
  const isPastDeadline = new Date() > new Date(event.rsvp_deadline);
  const isRsvpLocked = !!event.rsvp_locked || (isPastDeadline && !event.allow_late_rsvp);

  // Filter schedule items based on guest VIP status
  const isGuestVip = activeGuest.is_vip || partyMembers.some((p) => p?.is_vip);
  const visibleSchedule = (scheduleItems || []).filter((item) => {
    if (item.is_vip_only && !isGuestVip) return false;
    return true;
  });

  // Attending guests count in wizard
  const attendingGuestsInParty = allGuests.filter((g) => partyState[g.id]?.rsvp_status === 'attending');
  const hasAnyAttending = attendingGuestsInParty.length > 0;
  const allAnswered = allGuests.every((g) => {
    const st = partyState[g.id]?.rsvp_status;
    return st === 'attending' || st === 'declined';
  });

  // Save the wedding (or the guest's personal itinerary) to their calendar app
  const handleAddToCalendar = () => {
    const where = [event.venue_name, event.venue_address].filter(Boolean).join(', ');
    const events =
      visibleSchedule.length > 0
        ? visibleSchedule.map((item) => ({
            uid: item.id,
            title: `${item.title} — ${event.couple_names}`,
            start: item.start_time,
            end: item.end_time,
            location: item.location_name || where,
            description: item.description || undefined,
          }))
        : [{ uid: `${event.id}-wedding`, title: `${event.couple_names}'s Wedding`, start: String(event.wedding_date).slice(0, 10), location: where }];
    downloadIcs('wedding.ics', buildIcs(events));
  };

  // Handle party RSVP status change
  const handleStatusChange = (guestId: string, status: 'attending' | 'declined') => {
    setPartyState((prev) => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        rsvp_status: status,
      },
    }));
  };

  // Toggle Dietary Tag
  const handleToggleDietaryTag = (guestId: string, tag: string) => {
    setPartyState((prev) => {
      const currentTags = prev[guestId]?.dietary_tags || [];
      const updatedTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      return {
        ...prev,
        [guestId]: {
          ...prev[guestId],
          dietary_tags: updatedTags,
        },
      };
    });
  };

  // Handle Sub-Event RSVP toggle
  const handleSubEventStatusChange = (guestId: string, scheduleItemId: string, status: 'attending' | 'declined') => {
    setSubEventRsvps((prev) => ({
      ...prev,
      [guestId]: {
        ...(prev[guestId] || {}),
        [scheduleItemId]: status,
      },
    }));
  };

  // Submit RSVP via Server Action
  const handleFinalRsvpSubmit = async () => {
    if (isRsvpLocked) {
      setErrorMessage(tr.rsvpsClosedError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const guestsPayload = allGuests.map((g) => ({
        id: g.id,
        rsvp_status: partyState[g.id]?.rsvp_status || 'pending',
        meal_choice: partyState[g.id]?.meal_choice || null,
        dietary_notes: partyState[g.id]?.dietary_notes || null,
        dietary_tags: partyState[g.id]?.dietary_tags || [],
        plus_one_name: partyState[g.id]?.plus_one_name || null,
        plus_one_meal: partyState[g.id]?.plus_one_meal || null,
      }));

      const formData = new FormData();
      formData.append('token', activeGuest.access_token);
      formData.append(
        'payload',
        JSON.stringify({
          guests: guestsPayload,
          subEvents: subEventRsvps,
          customAnswers: customAnswers,
        })
      );

      // The landing-page demo has no real guest to save to.
      if (!previewMode) {
        const res = await submitRsvpAction(formData);
        if (res?.error) {
          setErrorMessage(res.error || tr.rsvpSaveError);
          return;
        }
      }

      setRsvpStep(5);
      confetti({
        disableForReducedMotion: true,
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: [theme.accent_color || '#C59B27', '#9E5A44', '#E8C8C0', '#2C2523'],
      });
    } catch (err: any) {
      console.error('RSVP submission error:', err);
      setErrorMessage(tr.rsvpSaveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Photo Upload with Server Action and Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage(tr.photoTooLarge);
      return;
    }

    setIsUploadingPhoto(true);
    setUploadMessage('Uploading photo to stream...');

    try {
      const formData = new FormData();
      formData.append('token', activeGuest.access_token);
      formData.append('file', file);
      formData.append('caption', photoCaption || `Captured by ${activeGuest.first_name}`);

      const res = await uploadPhotoAction(formData);

      if (res?.success && res.photo) {
        setPhotos((prev) => [res.photo as PhotoRecord, ...prev]);
        setUploadMessage(tr.photoAdded);
        setPhotoCaption('');
      } else {
        setUploadMessage((res as any)?.error || tr.photoUploadError);
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      setUploadMessage('Photo upload failed. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Cash Fund Contribution Pledge
  const handleCashFundPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCashFund) return;

    setIsPledging(true);
    setPledgeError('');
    const amountNum = parseFloat(pledgeAmount) || 0;

    try {
      const formData = new FormData();
      formData.append('token', activeGuest.access_token);
      formData.append('registryItemId', activeCashFund.id);
      formData.append('contributorName', pledgeName);
      formData.append('amount', String(amountNum));
      formData.append('message', pledgeMessage);

      const res = await contributeToRegistryAction(formData);
      if (!res?.success) {
        setPledgeError(res?.error || tr.giftError);
        return;
      }

      const newTotal = res.newAmount ?? ((activeCashFund.current_amount || 0) + amountNum);

      setRegistryList((prev) =>
        prev.map((item) =>
          item.id === activeCashFund.id ? { ...item, current_amount: newTotal } : item
        )
      );

      setPledgeSuccess(true);
      setTimeout(() => {
        setPledgeSuccess(false);
        setActiveCashFund(null);
        setPledgeMessage('');
      }, 2200);
    } catch (err) {
      console.error('Cash contribution error:', err);
    } finally {
      setIsPledging(false);
    }
  };

  const partyNames = allGuests.map((g) => g?.first_name || 'Guest').join(' & ');
  const menuOptions = getMenuOptions(event);
  const musicUrl: string | undefined = (event.custom_sections as any)?.music?.url;
  const customSections = (event.custom_sections || {}) as any;
  const faqList = customSections.faq?.items || [];
  const localRecsList = customSections.local_recs?.items || [];
  const weddingPartyList = customSections.wedding_party?.members || [];
  const travelInfo = customSections.travel || {};

  const fontClass =
    theme.font_family === 'modern-sans'
      ? 'font-sans'
      : theme.font_family === 'vintage-editorial'
      ? 'font-editorial'
      : 'font-serif';

  const canvasMaxWidthClass =
    theme.canvas_width === 'narrow'
      ? 'max-w-md'
      : theme.canvas_width === 'wide'
      ? 'max-w-2xl'
      : theme.canvas_width === 'full'
      ? 'max-w-5xl'
      : 'max-w-xl';

  const studioLayout = isStudioDesign(theme);
  const heroStyle = studioLayout ? computeSectionStyle(theme, 'hero') : null;
  const renderOrder = studioLayout ? orderedVisibleSections(theme) : DEFAULT_SECTION_ORDER;

  // Save-the-date mode: the same link shows a short announcement until the couple switches to the full invitation.
  if (event.invitation_mode === 'save_the_date' && hasFeature(event, 'save_the_date')) {
    const where = [event.venue_name, event.venue_address].filter(Boolean).join(', ');
    return (
      <div
        lang={portalLanguageOf(event.language)}
        style={{ backgroundColor: theme.bg_color || '#FAF7F2', color: theme.text_color || '#2C2523' }}
        className={`min-h-screen flex items-center justify-center px-5 py-12 ${fontClass}`}
      >
        <main className="max-w-md w-full text-center space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] font-semibold" style={{ color: theme.accent_color }}>
            {tr.saveTheDate}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight">{event.couple_names}</h1>
          <p className="font-serif text-xl">
            {new Date(event.wedding_date).toLocaleDateString(locale, {
              timeZone: 'UTC',
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          {where && <p className="text-sm uppercase tracking-[0.2em]" style={{ color: theme.accent_color }}>{where}</p>}
          <div className="flex items-center justify-center gap-6 border-y py-4" style={{ borderColor: theme.border_color }}>
            {(['days', 'hours', 'minutes'] as const).map((unit) => (
              <div key={unit}>
                <span className="font-editorial text-3xl font-semibold block leading-none">{timeLeft[unit]}</span>
                <span className="text-xs uppercase tracking-[0.2em] opacity-70">{tr[unit]}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              downloadIcs(
                'save-the-date.ics',
                buildIcs([{ uid: `${event.id}-wedding`, title: `${event.couple_names}'s Wedding`, start: String(event.wedding_date).slice(0, 10), location: where }])
              )
            }
            className="min-h-[44px] rounded-full px-6 text-sm font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: theme.accent_color || '#9E5A44' }}
          >
            {tr.addToCalendar}
          </button>
          <p className="font-editorial italic opacity-75">{tr.formalToFollow}</p>
        </main>
      </div>
    );
  }

  const sectionBlocks: Record<GuestPortalSectionId, React.ReactNode> = {
    'our-story': (
      <>
            {/* 2. OUR STORY & WELCOME */}
            {(event.welcome_message || event.our_story || event.story_image_url) && (
              <section className="text-center space-y-6">
                <div className="space-y-2">
                  <span
                    className="text-xs uppercase tracking-[0.3em] font-semibold block"
                    style={{ color: theme.accent_color }}
                  >
                    <span className="chapter-label" />
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.ourStory}</h2>
                </div>

                {event.welcome_message && (
                  <p className="font-editorial text-lg sm:text-xl italic max-w-md mx-auto leading-relaxed opacity-90">
                    "{event.welcome_message}"
                  </p>
                )}

                {event.story_image_url && (
                  <div
                    className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm border"
                    style={{ borderColor: theme.border_color || '#E8E0D7' }}
                  >
                    <img
                      src={event.story_image_url}
                      alt="Couple Story"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {event.our_story && (
                  <p
                    className="text-sm sm:text-base leading-relaxed max-w-lg mx-auto text-left font-sans opacity-80"
                    style={{ color: theme.text_color }}
                  >
                    {event.our_story}
                  </p>
                )}
              </section>
            )}
      </>
    ),
    'schedule': (
      <>
            {/* 3. SEAMLESS TIMELINE / ITINERARY */}
            {visibleSchedule.length > 0 && (
              <section className="space-y-8">
                <div className="text-center space-y-2">
                  <span
                    className="text-xs uppercase tracking-[0.3em] font-semibold block"
                    style={{ color: theme.accent_color }}
                  >
                    <span className="chapter-label" />
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.theItinerary}</h2>
                  <p className="text-sm font-editorial italic opacity-75">
                    Curated for {partyNames}
                  </p>
                </div>

                {/* Seamless Vertical Timeline */}
                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-transparent before:via-aisle-gold/50 before:to-transparent">
                  {visibleSchedule.map((item, idx) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline Dot Indicator */}
                      <span
                        className="absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 transition-transform duration-300 group-hover:scale-125"
                        style={{
                          backgroundColor: theme.accent_color || '#9E5A44',
                          // @ts-ignore
                          ringColor: theme.bg_color,
                        }}
                      />

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-serif text-base sm:text-lg font-semibold tracking-tight">
                            {item.title}
                          </h3>
                          <span
                            className="text-sm uppercase tracking-widest font-semibold font-sans"
                            style={{ color: theme.accent_color }}
                          >
                            {new Date(item.start_time).toLocaleTimeString(locale, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {item.location_name && (
                          <p className="text-sm opacity-75 flex items-center gap-1 font-sans">
                            <MapPin className="h-3 w-3 inline" /> {item.location_name}
                          </p>
                        )}

                        {item.description && (
                          <p className="text-sm leading-relaxed font-sans opacity-70 pt-1">
                            {item.description}
                          </p>
                        )}

                        {item.dress_code && (
                          <div className="pt-1">
                            <span
                              className="inline-block text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-sans"
                              style={{
                                borderColor: theme.border_color || '#E8E0D7',
                                backgroundColor: theme.surface_color || '#FFFFFF',
                              }}
                            >
                              Attire: {item.dress_code}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
      </>
    ),
    'travel': (
      <>
            {/* 4. THE VENUE & TRAVEL LOGISTICS */}
            <section className="text-center space-y-6">
              <div className="space-y-2">
                <span
                  className="text-xs uppercase tracking-[0.3em] font-semibold block"
                  style={{ color: theme.accent_color }}
                >
                  <span className="chapter-label" />
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.venueAndTravel}</h2>
              </div>

              {event.venue_image_url && (
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm border"
                  style={{ borderColor: theme.border_color || '#E8E0D7' }}
                >
                  <img
                    src={event.venue_image_url}
                    alt={event.venue_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold">{event.venue_name}</h3>
                <p className="text-sm font-sans opacity-75">{event.venue_address}</p>

                {event.venue_address && (
                  <div className="pt-1.5 flex justify-center">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${event.venue_name ? event.venue_name + ', ' : ''}${event.venue_address}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full border transition-all shadow-sm hover:opacity-80 cursor-pointer"
                      style={{
                        borderColor: theme.border_color || '#E8E0D7',
                        backgroundColor: theme.surface_color || '#FFFFFF',
                        color: theme.accent_color || '#9E5A44',
                      }}
                    >
                      <MapPin className="h-3 w-3" />
                      <span>{tr.getDirections}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                )}

                {event.travel_info && (
                  <p
                    className="mt-3 text-sm leading-relaxed font-sans p-4 rounded-2xl text-left border"
                    style={{
                      backgroundColor: theme.surface_color || '#FFFFFF',
                      borderColor: theme.border_color || '#E8E0D7',
                    }}
                  >
                    <strong className="block mb-1 text-sm uppercase tracking-wider font-semibold">
                      {tr.travelGuidance}
                    </strong>
                    {event.travel_info}
                  </p>
                )}

                {/* Travel Cards from Custom Sections */}
                {(travelInfo.hotel_info || travelInfo.shuttle_info) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left font-sans text-sm">
                    {travelInfo.hotel_info && (
                      <div
                        className="p-4 rounded-2xl border space-y-1"
                        style={{
                          backgroundColor: theme.surface_color || '#FFFFFF',
                          borderColor: theme.border_color || '#E8E0D7',
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-aisle-charcoal">
                          <Hotel className="h-4 w-4 text-aisle-terracotta" />
                          <span>{tr.accommodations}</span>
                        </div>
                        <p className="text-xs opacity-75 leading-relaxed">{travelInfo.hotel_info}</p>
                      </div>
                    )}

                    {travelInfo.shuttle_info && (
                      <div
                        className="p-4 rounded-2xl border space-y-1"
                        style={{
                          backgroundColor: theme.surface_color || '#FFFFFF',
                          borderColor: theme.border_color || '#E8E0D7',
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-aisle-charcoal">
                          <Compass className="h-4 w-4 text-aisle-terracotta" />
                          <span>{tr.shuttleTransit}</span>
                        </div>
                        <p className="text-xs opacity-75 leading-relaxed">{travelInfo.shuttle_info}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleAddToCalendar}
                    className="min-h-[44px] inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold font-sans transition-all hover:opacity-80 shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: theme.surface_color || '#FFFFFF',
                      borderColor: theme.border_color || '#E8E0D7',
                      color: theme.text_color,
                    }}
                  >
                    <CalendarPlus className="h-4 w-4" style={{ color: theme.accent_color }} />
                    <span>{visibleSchedule.length > 0 ? tr.addItineraryToCalendar : tr.addToMyCalendar}</span>
                  </button>
                </div>
              </div>
            </section>
      </>
    ),
    'wedding-party': (
      <>
            {/* 5. WEDDING PARTY (CMS SECTION) */}
            {weddingPartyList.length > 0 && (
              <section className="space-y-6 text-center">
                <div className="space-y-2">
                  <span
                    className="text-xs uppercase tracking-[0.3em] font-semibold block"
                    style={{ color: theme.accent_color }}
                  >
                    {tr.theEntourage}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.weddingParty}</h2>
                  <p className="text-sm font-editorial italic opacity-75">
                    Standing alongside {event.couple_names}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left font-sans">
                  {weddingPartyList.map((member: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-2xl border p-4 space-y-2 flex items-start gap-3.5"
                      style={{
                        backgroundColor: theme.surface_color || '#FFFFFF',
                        borderColor: theme.border_color || '#E8E0D7',
                      }}
                    >
                      <div className="h-12 w-12 rounded-full bg-aisle-sand flex items-center justify-center font-serif text-lg font-bold shrink-0 text-aisle-charcoal">
                        {member.name ? member.name.charAt(0) : '✦'}
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-semibold" style={{ color: theme.text_color }}>
                          {member.name}
                        </h4>
                        <span
                          className="text-xs font-bold uppercase tracking-wider block"
                          style={{ color: theme.accent_color }}
                        >
                          {member.role}
                        </span>
                        {member.bio && (
                          <p className="text-xs opacity-75 mt-1 leading-relaxed">
                            {member.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
      </>
    ),
    'local-recs': (
      <>
            {/* 6. LOCAL RECOMMENDATIONS CONCIERGE (CMS SECTION) */}
            {localRecsList.length > 0 && (
              <section className="space-y-6 text-center">
                <div className="space-y-2">
                  <span
                    className="text-xs uppercase tracking-[0.3em] font-semibold block"
                    style={{ color: theme.accent_color }}
                  >
                    {tr.curatedGuide}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.localConcierge}</h2>
                  <p className="text-sm font-editorial italic opacity-75">
                    {tr.favoriteSpots}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left font-sans">
                  {localRecsList.map((rec: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-2xl border p-4 space-y-1.5"
                      style={{
                        backgroundColor: theme.surface_color || '#FFFFFF',
                        borderColor: theme.border_color || '#E8E0D7',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-serif text-base font-semibold" style={{ color: theme.text_color }}>
                          {rec.name}
                        </h4>
                        <span className="text-xs uppercase font-bold tracking-wider rounded-full px-2 py-0.5 bg-aisle-sand text-aisle-charcoal">
                          {rec.type || tr.spot}
                        </span>
                      </div>
                      <p className="text-xs opacity-75 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
      </>
    ),
    'faq': (
      <>
            {/* 7. FREQUENTLY ASKED QUESTIONS (CMS SECTION) */}
            {faqList.length > 0 && (
              <section className="space-y-6 text-center">
                <div className="space-y-2">
                  <span
                    className="text-xs uppercase tracking-[0.3em] font-semibold block"
                    style={{ color: theme.accent_color }}
                  >
                    {tr.questionsAnswers}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.goodToKnow}</h2>
                </div>

                <div className="space-y-3 text-left font-sans max-w-lg mx-auto">
                  {faqList.map((faq: any, idx: number) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border overflow-hidden transition-all"
                        style={{
                          backgroundColor: theme.surface_color || '#FFFFFF',
                          borderColor: theme.border_color || '#E8E0D7',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 min-h-[48px] text-left font-medium text-sm flex items-center justify-between gap-3 hover:bg-aisle-sand/20 cursor-pointer"
                        >
                          <span className="font-semibold text-aisle-charcoal">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-aisle-muted shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-aisle-muted shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-sm opacity-80 leading-relaxed border-t border-aisle-border/40 pt-3">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
      </>
    ),
    'rsvp': publicView ? (
      <section id="rsvp" className="text-center space-y-3 pt-4">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.rsvpTitle}</h2>
        <p className="text-base opacity-80">{tr.usePersonalLink}</p>
      </section>
    ) : (
      <>
            {/* 8. FORMAL STATIONERY RESPONSE CARD (4-STEP TACTILE RSVP WIZARD) */}
            <section id="rsvp" className="space-y-6 pt-4">
              <div className="text-center space-y-2">
                <span
                  className="text-xs uppercase tracking-[0.3em] font-semibold block"
                  style={{ color: theme.accent_color }}
                >
                  <span className="chapter-label" />
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
                  {tr.rsvpTitle}
                </h2>
                <p className="text-sm font-editorial italic opacity-75">
                  {tr.kindlyReplyBy}{' '}
                  {new Date(event.rsvp_deadline).toLocaleDateString(locale, {
                    timeZone: 'UTC', // dates are stored as midnight UTC
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Physical Response Card Frame */}
              <div
                ref={rsvpCardRef}
                className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border-2 shadow-wedding scroll-mt-20"
                style={{
                  backgroundColor: theme.surface_color || '#FFFFFF',
                  borderColor: theme.accent_color || '#C59B27',
                }}
              >
                {isRsvpLocked ? (
                  <div className="py-6 text-center space-y-2 font-sans">
                    <Lock className="h-6 w-6 mx-auto opacity-70" />
                    <h4 className="font-serif text-base font-semibold">{tr.rsvpClosedTitle}</h4>
                    <p className="text-sm opacity-70">
                      {event.rsvp_locked ? tr.rsvpLocked : tr.deadlinePassed} If you need
                      to make an adjustment, please contact the couple directly.
                    </p>
                  </div>
                ) : rsvpStep === 5 ? (
                  /* STEP 5: CONFIRMATION STATE */
                  <div className="py-8 text-center space-y-4 font-sans">
                    <CheckCircle2
                      className="h-12 w-12 mx-auto motion-safe:animate-bounce"
                      style={{ color: theme.accent_color }}
                    />
                    <h4 className="font-serif text-2xl sm:text-3xl font-semibold">
                      {tr.thankYou}, {partyNames}!
                    </h4>
                    <p className="text-sm opacity-80 max-w-sm mx-auto leading-relaxed">
                      {fill(tr.responseConfirmed, { couple: event.couple_names })}
                    </p>

                    <div className="rounded-2xl border p-4 max-w-sm mx-auto text-left text-sm space-y-2 bg-[#FAF7F2]/60" style={{ borderColor: theme.border_color }}>
                      <span className="font-semibold text-xs uppercase tracking-wider block opacity-70">
                        {tr.recordedAttendance}
                      </span>
                      {allGuests.map((g) => {
                        const st = partyState[g.id];
                        return (
                          <div key={g.id} className="flex items-center justify-between text-sm">
                            <span>{g.first_name} {g.last_name || ''}</span>
                            <span className={`font-semibold capitalize ${st?.rsvp_status === 'attending' ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {st?.rsvp_status || tr.pending}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setRsvpStep(1)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-sans tracking-wide underline opacity-75 hover:opacity-100 cursor-pointer"
                      >
                        <span>{tr.editRsvp}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* WIZARD CONTAINER */
                  <div className="space-y-6 font-sans text-sm">
                    {/* Step Progress */}
                    <div className="space-y-3 border-b pb-4" style={{ borderColor: theme.border_color }}>
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span>
                          {rsvpStep === 1 && tr.stepWho}
                          {rsvpStep === 2 && tr.stepEvents}
                          {rsvpStep === 3 && tr.stepDetails}
                          {rsvpStep === 4 && tr.stepReview}
                        </span>
                        <span className="opacity-60">{fill(tr.stepOf, { step: rsvpStep })}</span>
                      </div>
                      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={rsvpStep}>
                        {[1, 2, 3, 4].map((n) => (
                          <span
                            key={n}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{ backgroundColor: n <= rsvpStep ? theme.accent_color : theme.border_color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* STEP 1: HOUSEHOLD PARTY ATTENDANCE */}
                    {rsvpStep === 1 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="font-serif text-lg font-semibold" style={{ color: theme.text_color }}>
                            {tr.willYouCelebrate}
                          </h4>
                          <p className="text-sm opacity-75">
                            {tr.indicateAttendance}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {allGuests.map((guest) => {
                            const gState = partyState[guest.id] || { rsvp_status: 'pending' };
                            return (
                              <div
                                key={guest.id}
                                className="rounded-2xl border p-4 space-y-3"
                                style={{
                                  backgroundColor: `${theme.accent_color}06`,
                                  borderColor: theme.border_color || '#E8E0D7',
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-serif text-base font-semibold" style={{ color: theme.text_color }}>
                                    {guest.first_name} {guest.last_name || ''}
                                  </span>
                                  {guest.is_vip && (
                                    <span
                                      className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                                      style={{
                                        backgroundColor: `${theme.accent_color}20`,
                                        color: theme.accent_color,
                                      }}
                                    >
                                      {tr.vipGuest}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    aria-pressed={gState.rsvp_status === 'attending'}
                                    onClick={() => handleStatusChange(guest.id, 'attending')}
                                    className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                                      gState.rsvp_status === 'attending'
                                        ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1'
                                        : 'border bg-white hover:bg-emerald-50/50 text-aisle-charcoal'
                                    }`}
                                    style={{ borderColor: theme.border_color }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span>{tr.joyfullyAccept}</span>
                                  </button>

                                  <button
                                    type="button"
                                    aria-pressed={gState.rsvp_status === 'declined'}
                                    onClick={() => handleStatusChange(guest.id, 'declined')}
                                    className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                                      gState.rsvp_status === 'declined'
                                        ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-600 ring-offset-1'
                                        : 'border bg-white hover:bg-rose-50/50 text-aisle-charcoal'
                                    }`}
                                    style={{ borderColor: theme.border_color }}
                                  >
                                    <XCircle className="h-4 w-4 shrink-0" />
                                    <span>{tr.regretfullyDecline}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-3">
                          {!allAnswered && (
                            <span className="text-sm opacity-70">{tr.answerForEveryone}</span>
                          )}
                          <button
                            type="button"
                            disabled={!allAnswered}
                            onClick={() => {
                              if (hasAnyAttending) setRsvpStep(2);
                              else setRsvpStep(4); // Skip to review if all declined
                            }}
                            className="min-h-[44px] rounded-full px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            style={{ backgroundColor: theme.text_color }}
                          >
                            <span>{tr.continue}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: SUB-EVENTS ITINERARY SELECTION */}
                    {rsvpStep === 2 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="font-serif text-lg font-semibold" style={{ color: theme.text_color }}>
                            {tr.selectEvents}
                          </h4>
                          <p className="text-sm opacity-75">
                            {tr.confirmEvents}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {attendingGuestsInParty.map((guest) => (
                            <div
                              key={guest.id}
                              className="rounded-2xl border p-4 space-y-3"
                              style={{ borderColor: theme.border_color }}
                            >
                              <span className="font-serif text-base font-semibold block" style={{ color: theme.text_color }}>
                                {guest.first_name}’s Itinerary
                              </span>

                              <div className="space-y-2">
                                {visibleSchedule.map((item) => {
                                  const isAttendingItem =
                                    subEventRsvps[guest.id]?.[item.id] !== 'declined';

                                  return (
                                    <div
                                      key={item.id}
                                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border bg-white text-sm"
                                      style={{ borderColor: theme.border_color }}
                                    >
                                      <div>
                                        <strong className="block font-medium">{item.title}</strong>
                                        <span className="text-xs opacity-70">
                                          {new Date(item.start_time).toLocaleTimeString(locale, {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 sm:flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSubEventStatusChange(guest.id, item.id, 'attending')}
                                          className={`min-h-[44px] px-4 py-3 rounded-lg text-sm font-semibold tracking-wide cursor-pointer ${
                                            isAttendingItem
                                              ? 'bg-emerald-700 text-white'
                                              : 'bg-aisle-sand/50 text-aisle-charcoal'
                                          }`}
                                        >
                                          {tr.attending}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSubEventStatusChange(guest.id, item.id, 'declined')}
                                          className={`min-h-[44px] px-4 py-3 rounded-lg text-sm font-semibold tracking-wide cursor-pointer ${
                                            !isAttendingItem
                                              ? 'bg-rose-700 text-white'
                                              : 'bg-aisle-sand/50 text-aisle-charcoal'
                                          }`}
                                        >
                                          {tr.decline}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 flex justify-between">
                          <button
                            type="button"
                            onClick={() => setRsvpStep(1)}
                            className="rounded-full px-5 py-3.5 text-sm font-semibold uppercase tracking-wider border flex items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer min-h-[44px]"
                            style={{ borderColor: theme.border_color }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>{tr.back}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRsvpStep(3)}
                            className="rounded-full px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-md flex items-center gap-1.5 hover:opacity-95 cursor-pointer min-h-[44px]"
                            style={{ backgroundColor: theme.text_color }}
                          >
                            <span>{tr.continue}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: DINING PREFERENCES & CUSTOM QUESTIONS */}
                    {rsvpStep === 3 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="font-serif text-lg font-semibold" style={{ color: theme.text_color }}>
                            {tr.diningDetails}
                          </h4>
                          <p className="text-sm opacity-75">
                            {tr.specifyDetails}
                          </p>
                        </div>

                        {/* Guests Dining Cards */}
                        <div className="space-y-4">
                          {attendingGuestsInParty.map((guest) => {
                            const gState = partyState[guest.id] || {
                              meal_choice: '',
                              dietary_notes: '',
                              dietary_tags: [],
                              plus_one_name: '',
                              plus_one_meal: '',
                            };

                            return (
                              <div
                                key={guest.id}
                                className="rounded-2xl border p-4 space-y-3"
                                style={{ borderColor: theme.border_color }}
                              >
                                <span className="font-serif text-base font-semibold block" style={{ color: theme.text_color }}>
                                  {guest.first_name}’s Dining Details
                                </span>

                                {/* Entrée Input */}
                                <div>
                                  <label className="block text-xs uppercase tracking-wider font-semibold mb-1 opacity-80">
                                    {tr.entreePreference}
                                  </label>
                                  {menuOptions.length > 0 ? (
                                    <div role="radiogroup" aria-label={`Meal for ${guest.first_name}`} className="space-y-2">
                                      {menuOptions.map((option) => {
                                        const isSelected = gState.meal_choice === option.name;
                                        return (
                                          <button
                                            key={option.name}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() =>
                                              setPartyState((prev) => ({
                                                ...prev,
                                                [guest.id]: { ...prev[guest.id], meal_choice: option.name },
                                              }))
                                            }
                                            className="w-full min-h-[44px] rounded-xl border p-3.5 text-left transition-colors cursor-pointer"
                                            style={{
                                              borderColor: isSelected ? theme.accent_color : theme.border_color,
                                              backgroundColor: isSelected ? `${theme.accent_color}10` : '#FFFFFF',
                                            }}
                                          >
                                            <span className="block text-base font-semibold">{option.name}</span>
                                            {option.description && (
                                              <span className="block text-sm opacity-75 mt-0.5">{option.description}</span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder={tr.entreePlaceholder}
                                      value={gState.meal_choice}
                                      onChange={(e) =>
                                        setPartyState((prev) => ({
                                          ...prev,
                                          [guest.id]: {
                                            ...prev[guest.id],
                                            meal_choice: e.target.value,
                                          },
                                        }))
                                      }
                                      className="w-full rounded-xl border p-3.5 bg-white focus:outline-none text-base"
                                      style={{ borderColor: theme.border_color }}
                                    />
                                  )}
                                </div>

                                {/* Dietary Tag Selector */}
                                <div>
                                  <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5 opacity-80">
                                    {tr.dietaryRestrictions}
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {COMMON_DIETARY_TAGS.map((tag) => {
                                      const isSelected = (gState.dietary_tags || []).includes(tag);
                                      return (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => handleToggleDietaryTag(guest.id, tag)}
                                          className={`min-h-[44px] rounded-full px-4 py-3 text-xs font-semibold transition-colors cursor-pointer ${
                                            isSelected
                                              ? 'bg-aisle-terracotta text-white shadow-xs'
                                              : 'border bg-white text-aisle-charcoal hover:bg-aisle-sand/40'
                                          }`}
                                          style={{ borderColor: isSelected ? 'transparent' : theme.border_color }}
                                        >
                                          {tag}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Dietary Notes Input */}
                                <div>
                                  <label className="block text-xs uppercase tracking-wider font-semibold mb-1 opacity-80">
                                    {tr.allergyNotes}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={tr.allergyPlaceholder}
                                    value={gState.dietary_notes}
                                    onChange={(e) =>
                                      setPartyState((prev) => ({
                                        ...prev,
                                        [guest.id]: {
                                          ...prev[guest.id],
                                          dietary_notes: e.target.value,
                                        },
                                      }))
                                    }
                                    className="w-full rounded-xl border p-3.5 bg-white focus:outline-none text-base"
                                    style={{ borderColor: theme.border_color }}
                                  />
                                </div>

                                {/* Plus-One Form */}
                                {guest.plus_one_allowed && (
                                  <div
                                    className="rounded-2xl border p-3.5 space-y-2 mt-2"
                                    style={{
                                      borderColor: theme.accent_color,
                                      backgroundColor: `${theme.accent_color}08`,
                                    }}
                                  >
                                    <span className="text-xs font-bold uppercase tracking-widest block" style={{ color: theme.accent_color }}>
                                      {tr.plusOneDetails}
                                    </span>
                                    <input
                                      type="text"
                                      placeholder={tr.plusOneName}
                                      value={gState.plus_one_name}
                                      onChange={(e) =>
                                        setPartyState((prev) => ({
                                          ...prev,
                                          [guest.id]: {
                                            ...prev[guest.id],
                                            plus_one_name: e.target.value,
                                          },
                                        }))
                                      }
                                      className="w-full rounded-xl border p-3 bg-white focus:outline-none text-base"
                                      style={{ borderColor: theme.border_color }}
                                    />
                                    {menuOptions.length > 0 ? (
                                      <select
                                        aria-label={tr.plusOneMeal}
                                        value={gState.plus_one_meal}
                                        onChange={(e) =>
                                          setPartyState((prev) => ({
                                            ...prev,
                                            [guest.id]: { ...prev[guest.id], plus_one_meal: e.target.value },
                                          }))
                                        }
                                        className="w-full min-h-[44px] rounded-xl border p-3 bg-white focus:outline-none text-base"
                                        style={{ borderColor: theme.border_color }}
                                      >
                                        <option value="">{tr.plusOneMealChoice}</option>
                                        {menuOptions.map((option) => (
                                          <option key={option.name} value={option.name}>
                                            {option.name}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        placeholder={tr.plusOneMealText}
                                        value={gState.plus_one_meal}
                                        onChange={(e) =>
                                          setPartyState((prev) => ({
                                            ...prev,
                                            [guest.id]: {
                                              ...prev[guest.id],
                                              plus_one_meal: e.target.value,
                                            },
                                          }))
                                        }
                                        className="w-full rounded-xl border p-3 bg-white focus:outline-none text-base"
                                        style={{ borderColor: theme.border_color }}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Custom RSVP Questions */}
                        {customQuestions.length > 0 && (
                          <div className="space-y-4 pt-2">
                            <h4 className="font-serif text-base font-semibold" style={{ color: theme.text_color }}>
                              {tr.extraDetails}
                            </h4>

                            {customQuestions.map((q) => {
                              const val = customAnswers[q.id] || '';

                              return (
                                <div key={q.id} className="space-y-1.5 rounded-2xl border p-4 bg-white/70" style={{ borderColor: theme.border_color }}>
                                  <label className="block text-sm font-semibold">
                                    {q.prompt} {q.is_required && <span className="text-rose-500">*</span>}
                                  </label>

                                  {q.question_type === 'single_choice' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                      {q.options.map((opt, i) => {
                                        const isOptSelected = val === opt;
                                        return (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() =>
                                              setCustomAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                            }
                                            className={`min-h-[44px] rounded-xl p-3 text-sm text-left border transition-all cursor-pointer flex items-center justify-between ${
                                              isOptSelected
                                                ? 'border-aisle-terracotta bg-aisle-sand/60 font-semibold'
                                                : 'border-aisle-border bg-white hover:bg-aisle-sand/20'
                                            }`}
                                          >
                                            <span>{opt}</span>
                                            {isOptSelected && <Check className="h-3.5 w-3.5 text-aisle-terracotta" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : q.question_type === 'multiple_choice' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                      {q.options.map((opt, i) => {
                                        const currentVals: string[] = Array.isArray(val) ? val : [];
                                        const isChecked = currentVals.includes(opt);
                                        return (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                              const nextVals = isChecked
                                                ? currentVals.filter((v) => v !== opt)
                                                : [...currentVals, opt];
                                              setCustomAnswers((prev) => ({ ...prev, [q.id]: nextVals }));
                                            }}
                                            className={`rounded-xl p-2.5 text-sm text-left border transition-all cursor-pointer flex items-center justify-between ${
                                              isChecked
                                                ? 'border-aisle-terracotta bg-aisle-sand/60 font-semibold'
                                                : 'border-aisle-border bg-white hover:bg-aisle-sand/20'
                                            }`}
                                          >
                                            <span>{opt}</span>
                                            {isChecked && <Check className="h-3.5 w-3.5 text-aisle-terracotta" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder={tr.yourResponse}
                                      value={val}
                                      onChange={(e) =>
                                        setCustomAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                      }
                                      className="w-full rounded-xl border p-3.5 bg-white focus:outline-none text-base"
                                      style={{ borderColor: theme.border_color }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-2 flex justify-between">
                          <button
                            type="button"
                            onClick={() => setRsvpStep(2)}
                            className="rounded-full px-5 py-3.5 text-sm font-semibold uppercase tracking-wider border flex items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer min-h-[44px]"
                            style={{ borderColor: theme.border_color }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>{tr.back}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRsvpStep(4)}
                            className="rounded-full px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-md flex items-center gap-1.5 hover:opacity-95 cursor-pointer min-h-[44px]"
                            style={{ backgroundColor: theme.text_color }}
                          >
                            <span>{tr.reviewSummary}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: SUMMARY REVIEW */}
                    {rsvpStep === 4 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h4 className="font-serif text-lg font-semibold" style={{ color: theme.text_color }}>
                            {tr.reviewTitle}
                          </h4>
                          <p className="text-sm opacity-75">
                            {tr.reviewIntro}
                          </p>
                        </div>

                        <div className="rounded-2xl border p-5 space-y-4 bg-[#FAF7F2]/50" style={{ borderColor: theme.border_color }}>
                          {allGuests.map((guest) => {
                            const st = partyState[guest.id] || { rsvp_status: 'pending' };
                            const isAtt = st.rsvp_status === 'attending';

                            return (
                              <div key={guest.id} className="border-b last:border-b-0 pb-3 space-y-1 text-sm">
                                <div className="flex items-center justify-between">
                                  <strong className="text-base font-semibold">{guest.first_name} {guest.last_name || ''}</strong>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                    isAtt ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {st.rsvp_status}
                                  </span>
                                </div>

                                {isAtt && (
                                  <div className="text-xs opacity-80 space-y-0.5 pt-1 pl-2 border-l-2 border-aisle-gold/40">
                                    {st.meal_choice && <p>🍽️ {tr.entree}: {st.meal_choice}</p>}
                                    {st.dietary_tags?.length > 0 && <p>🏷️ Dietary: {st.dietary_tags.join(', ')}</p>}
                                    {st.dietary_notes && <p>⚠️ Allergy Note: {st.dietary_notes}</p>}
                                    {st.plus_one_name && <p>👤 {tr.accompaniedBy}: {st.plus_one_name} ({st.plus_one_meal || tr.standard})</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {customQuestions.length > 0 && (
                            <div className="pt-2 border-t text-sm space-y-1" style={{ borderColor: theme.border_color }}>
                              <span className="text-xs uppercase font-bold tracking-wider opacity-60">
                                {tr.customAnswers}
                              </span>
                              {customQuestions.map((q) => {
                                const ans = customAnswers[q.id];
                                return (
                                  <div key={q.id} className="text-xs opacity-80">
                                    <strong>{q.prompt}:</strong> {Array.isArray(ans) ? ans.join(', ') : ans || '—'}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {errorMessage && (
                          <p className="text-sm text-rose-600 text-center font-semibold">
                            {errorMessage}
                          </p>
                        )}

                        <div className="pt-2 flex justify-between">
                          <button
                            type="button"
                            onClick={() => setRsvpStep(hasAnyAttending ? 3 : 1)}
                            className="rounded-full px-5 py-3.5 text-sm font-semibold uppercase tracking-wider border flex items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer min-h-[44px]"
                            style={{ borderColor: theme.border_color }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>{tr.editSelections}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleFinalRsvpSubmit}
                            className="min-h-[44px] rounded-full px-8 py-3 text-sm font-semibold tracking-wide text-white shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                            style={{ backgroundColor: theme.text_color }}
                          >
                            {isSubmitting ? (
                              <span>{tr.recordingRsvp}</span>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                <span>{tr.confirmAttendance}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
      </>
    ),
    'photos': (
      <>
            {/* 9. PHOTO STREAM & ZERO-LOGIN GUEST UPLOADS */}
            <section className="space-y-6 text-center">
              <div className="space-y-2">
                <span
                  className="text-xs uppercase tracking-[0.3em] font-semibold block"
                  style={{ color: theme.accent_color }}
                >
                  <span className="chapter-label" />
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.sharedMemories}</h2>
                <p className="text-sm font-editorial italic opacity-75">
                  {tr.sharedMemoriesIntro}
                </p>
                {event.album_token && hasFeature(event, 'memories') && (
                  <a
                    href={`/album/${event.album_token}`}
                    className="inline-block pt-1 text-sm font-semibold underline underline-offset-4"
                    style={{ color: theme.accent_color }}
                  >
                    {tr.openAlbum}
                  </a>
                )}
              </div>

              {/* Upload Button (not on the public short link) */}
              {!publicView && (
              <div className="pt-2">
                <input
                  type="file"
                  id="stream-upload"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
                <label
                  htmlFor="stream-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wider font-sans transition-all hover:scale-105 shadow-sm text-white"
                  style={{ backgroundColor: theme.text_color }}
                >
                  <Camera className="h-4 w-4" />
                  <span>{isUploadingPhoto ? tr.uploadingPhoto : tr.addPhoto}</span>
                </label>
                {uploadMessage && (
                  <p className="mt-2 text-sm font-medium font-sans" style={{ color: theme.accent_color }}>
                    {uploadMessage}
                  </p>
                )}
              </div>
              )}

              {/* Staggered Photo Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="group relative aspect-square overflow-hidden rounded-2xl shadow-sm border"
                    style={{ borderColor: theme.border_color }}
                  >
                    <img
                      src={p.image_url}
                      alt={p.caption || 'Wedding Photo'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {p.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 text-xs text-white font-sans text-left">
                        <p className="line-clamp-1">{p.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
      </>
    ),
    'registry': (
      <>
            {/* 10. GIFT REGISTRY & HONEYMOON CASH FUND */}
            {registryList.length > 0 && (
              <section className="space-y-6 text-center">
                <div className="space-y-2">
                  <span
                    className="text-xs uppercase tracking-[0.3em] font-semibold block"
                    style={{ color: theme.accent_color }}
                  >
                    <span className="chapter-label" />
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold">{tr.giftRegistry}</h2>
                  <p className="text-sm font-editorial italic opacity-75 max-w-sm mx-auto">
                    {tr.registryIntro}
                  </p>
                </div>

                <div className="space-y-4 max-w-md mx-auto text-left font-sans">
                  {registryList.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border p-5 space-y-3"
                      style={{
                        backgroundColor: theme.surface_color || '#FFFFFF',
                        borderColor: theme.border_color || '#E8E0D7',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-serif text-base font-semibold" style={{ color: theme.text_color }}>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-sm opacity-75 mt-0.5">{item.description}</p>
                          )}
                        </div>

                        {item.is_cash_fund ? (
                          publicView ? null : <button
                            onClick={() => setActiveCashFund(item)}
                            className="rounded-full px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer shrink-0 min-h-[44px]"
                            style={{ backgroundColor: theme.accent_color }}
                          >
                            {tr.contribute}
                          </button>
                        ) : item.external_url ? (
                          <a
                            href={item.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors inline-flex items-center gap-1 shrink-0"
                            style={{ borderColor: theme.border_color, color: theme.text_color }}
                          >
                            <span>{tr.registry}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        ) : null}
                      </div>

                      {item.is_cash_fund && item.target_amount && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-xs font-semibold opacity-70 uppercase tracking-wider">
                            <span>${item.current_amount || 0} {tr.pledged}</span>
                            <span>{tr.goal}: ${item.target_amount}</span>
                          </div>
                          <div
                            className="h-1.5 w-full rounded-full overflow-hidden"
                            style={{ backgroundColor: `${theme.accent_color}25` }}
                          >
                            <div
                              className="h-full transition-all duration-500 rounded-full"
                              style={{
                                backgroundColor: theme.accent_color,
                                width: `${Math.min(
                                  100,
                                  ((item.current_amount || 0) / item.target_amount) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
      </>
    ),
  };

  return (
    <div
      lang={portalLanguageOf(event.language)}
      style={{
        backgroundColor: theme.bg_color || '#FAF7F2',
        color: theme.text_color || '#2C2523',
        ...(studioLayout ? pageBackgroundStyle(theme) : {}),
      }}
      className={`min-h-screen selection:bg-aisle-terracotta selection:text-white pb-28 ${fontClass} transition-colors duration-500`}
    >
      {/* 1. Tactile Wax-Seal / Envelope Opening Reveal */}
      {!hasOpened && (
        <WaxSealOpening
          coupleNames={event.couple_names}
          openingStyle={theme.opening_style}
          strings={tr}
          guestName={publicView ? undefined : partyNames}
          onOpen={() => {
            setHasOpened(true);
            // Opening is a tap, so browsers allow sound to start here.
            if (musicUrl) {
              audioRef.current?.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
            }
          }}
        />
      )}

      {musicUrl && (
        <>
          <audio ref={audioRef} src={musicUrl} loop preload="none" />
          {hasOpened && (
            <button
              type="button"
              onClick={toggleMusic}
              aria-label={musicPlaying ? tr.pauseMusic : tr.playMusic}
              className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg text-white"
              style={{ backgroundColor: theme.accent_color || '#9E5A44' }}
            >
              {musicPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          )}
        </>
      )}

      {/* Main Flowing Stationery Canvas */}
      {/* counterReset numbers the .chapter-label spans in the order the sections render */}
      <main
        className={`mx-auto ${canvasMaxWidthClass} px-5 sm:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24`}
        style={{ counterReset: 'chapter' }}
      >
        
        {/* 1. EDITORIAL HERO & INVITATION */}
        <header
          className={`text-center space-y-6 ${heroStyle ? containerClassName(heroStyle) : 'pt-4'}`}
          style={heroStyle ? containerInlineStyle(heroStyle) : undefined}
        >
          {/* Floron Motif & Eyebrow */}
          <div className="flex items-center justify-center gap-3">
            <span
              className="h-px w-10 sm:w-16"
              style={{ backgroundColor: theme.accent_color || '#C59B27', opacity: 0.4 }}
            />
            <span
              className="text-sm uppercase tracking-[0.3em] font-semibold"
              style={{ color: theme.accent_color || '#9E5A44' }}
            >
              {theme.floron || '✦'} {theme.eyebrow_text || tr.weddingCelebration} {theme.floron || '✦'}
            </span>
            <span
              className="h-px w-10 sm:w-16"
              style={{ backgroundColor: theme.accent_color || '#C59B27', opacity: 0.4 }}
            />
          </div>

          {/* Poetic Line / Invitation Line */}
          <p
            className="font-editorial text-base sm:text-lg italic tracking-wide"
            style={{ color: theme.muted_color || '#7D746D' }}
          >
            "{theme.poetic_line || 'Two hearts, one horizon'}"
          </p>

          <div className="space-y-2 pt-2">
            <p className="text-sm uppercase tracking-[0.25em] text-aisle-muted">
              {tr.togetherWithFamilies}
            </p>

            <h1
              className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.12]"
              style={{ color: theme.text_color }}
            >
              {event.couple_names}
            </h1>

            <p
              className="text-sm sm:text-base font-editorial italic pt-1 max-w-sm mx-auto leading-relaxed"
              style={{ color: theme.muted_color }}
            >
              {theme.invitation_phrase || 'request the honour of your presence at their marriage'}
            </p>
          </div>

          {/* Date & Location */}
          <div className="space-y-1 pt-2">
            <p className="font-serif text-base sm:text-lg font-medium tracking-wide">
              {new Date(event.wedding_date).toLocaleDateString(locale, {
                timeZone: 'UTC', // dates are stored as midnight UTC
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p
              className="text-sm uppercase tracking-[0.2em] font-medium"
              style={{ color: theme.accent_color }}
            >
              {event.venue_name} · {event.venue_address}
            </p>
          </div>

          {/* Designed Cover Photo (Arched Top or Clean Plate) */}
          {event.cover_image_url && (
            <div className="relative pt-4">
              <div
                className={`relative mx-auto aspect-[4/5] sm:aspect-[16/11] w-full overflow-hidden shadow-wedding ${
                  theme.border_flair === 'arch'
                    ? 'rounded-t-[140px] rounded-b-2xl'
                    : theme.border_flair === 'botanical-crest'
                    ? 'rounded-3xl border-2'
                    : 'rounded-2xl border'
                }`}
                style={{
                  borderColor: theme.border_color || '#E8E0D7',
                }}
              >
                <img
                  src={event.cover_image_url}
                  alt={event.couple_names}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Minimal Inline Countdown */}
          <div
            className="pt-6 border-y py-4 my-6"
            style={{ borderColor: theme.border_color || '#E8E0D7' }}
          >
            <div className="flex items-center justify-center gap-6 sm:gap-10 text-center">
              <div>
                <span className="font-editorial text-2xl sm:text-3xl font-semibold block leading-none">
                  {timeLeft.days}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] opacity-70 mt-1 block">
                  {tr.days}
                </span>
              </div>
              <span className="opacity-30 text-base">·</span>
              <div>
                <span className="font-editorial text-2xl sm:text-3xl font-semibold block leading-none">
                  {timeLeft.hours}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] opacity-70 mt-1 block">
                  {tr.hours}
                </span>
              </div>
              <span className="opacity-30 text-base">·</span>
              <div>
                <span className="font-editorial text-2xl sm:text-3xl font-semibold block leading-none">
                  {timeLeft.minutes}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] opacity-70 mt-1 block">
                  {tr.minutes}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 2. CHAPTER SECTIONS: Studio designs set their own order, visibility and containers */}
        {studioLayout
          ? renderOrder.map((id) => {
              const sectionStyle = computeSectionStyle(theme, id);
              return (
                <div
                  key={id}
                  className={`empty:hidden ${containerClassName(sectionStyle)}`}
                  style={containerInlineStyle(sectionStyle)}
                >
                  {sectionBlocks[id]}
                </div>
              );
            })
          : renderOrder.map((id) => <React.Fragment key={id}>{sectionBlocks[id]}</React.Fragment>)}

        {/* CASH FUND CONTRIBUTION MODAL */}
        {activeCashFund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
            <div
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border"
              style={{
                backgroundColor: theme.surface_color || '#FFFFFF',
                borderColor: theme.border_color || '#E8E0D7',
                color: theme.text_color,
              }}
            >
              <h3 className="font-serif text-xl font-semibold">
                {tr.contributeTo} {activeCashFund.title}
              </h3>
              <p className="text-sm opacity-75">
                {fill(tr.contributionIntro, { couple: event.couple_names })}
              </p>

              {pledgeSuccess ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center text-emerald-900 text-sm space-y-2">
                  <div className="text-xl">🎉</div>
                  <h4 className="font-serif text-base font-semibold">{tr.giftRecorded}</h4>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Thank you {pledgeName}! Your gift and warm message have been recorded for {event.couple_names}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCashFundPledge} className="space-y-4 text-sm">
                  {pledgeError && (
                    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {pledgeError}
                    </p>
                  )}
                  <div>
                    <label className="block uppercase tracking-wider text-xs font-semibold mb-1 opacity-80">
                      {tr.selectAmount}
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {['25', '50', '100', '250'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPledgeAmount(preset)}
                          className={`min-h-[44px] rounded-xl py-3 text-sm font-semibold border transition-all cursor-pointer ${
                            pledgeAmount === preset
                              ? 'bg-aisle-charcoal text-white border-aisle-charcoal'
                              : 'bg-white border-aisle-border text-aisle-charcoal hover:bg-aisle-sand/30'
                          }`}
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={pledgeAmount}
                      onChange={(e) => setPledgeAmount(e.target.value)}
                      required
                      className="w-full rounded-xl border p-3.5 bg-white/90 focus:outline-none text-base"
                      style={{ borderColor: theme.border_color }}
                    />
                  </div>

                  {/* Direct Payment Handles (Option 1) */}
                  {customSections.registry && (
                    <div className="space-y-2 pt-2 border-t border-aisle-border/60">
                      <label className="block uppercase tracking-wider text-xs font-semibold opacity-80">
                        {tr.sendDirectly}
                      </label>

                      <div className="space-y-1.5">
                        {/* Venmo */}
                        {customSections.registry.venmo_handle && (
                          <a
                            href={`https://venmo.com/${customSections.registry.venmo_handle.replace('@', '')}?txn=pay&amount=${pledgeAmount || '0'}&note=${encodeURIComponent(`Wedding Gift for ${event.couple_names}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-900 font-semibold hover:bg-blue-100/60 transition-colors shadow-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">Venmo</span>
                              <span className="text-xs font-normal opacity-80">
                                @{customSections.registry.venmo_handle.replace('@', '')}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                              Open Venmo ↗
                            </span>
                          </a>
                        )}

                        {/* Zelle */}
                        {customSections.registry.zelle_info && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 text-purple-900 font-semibold shadow-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">Zelle</span>
                              <span className="text-xs font-mono font-normal opacity-90">
                                {customSections.registry.zelle_info}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(customSections.registry?.zelle_info || '');
                                setCopiedZelle(true);
                                setTimeout(() => setCopiedZelle(false), 2000);
                              }}
                              className="text-xs font-bold text-purple-800 bg-white px-2.5 py-3 rounded-full border border-purple-200 hover:bg-purple-50 cursor-pointer min-h-[44px]"
                            >
                              {copiedZelle ? 'Copied!' : tr.copy}
                            </button>
                          </div>
                        )}

                        {/* CashApp */}
                        {customSections.registry.cashapp_tag && (
                          <a
                            href={`https://cash.app/$${customSections.registry.cashapp_tag.replace('$', '')}/${pledgeAmount || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-900 font-semibold hover:bg-emerald-100/60 transition-colors shadow-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">Cash App</span>
                              <span className="text-xs font-normal opacity-80">
                                ${customSections.registry.cashapp_tag.replace('$', '')}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                              Open Cash App ↗
                            </span>
                          </a>
                        )}

                        {/* PayPal */}
                        {customSections.registry.paypal_handle && (
                          <a
                            href={
                              customSections.registry.paypal_handle.startsWith('http')
                                ? customSections.registry.paypal_handle
                                : `https://paypal.me/${customSections.registry.paypal_handle.replace('https://paypal.me/', '')}/${pledgeAmount || ''}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 text-sky-900 font-semibold hover:bg-sky-100/60 transition-colors shadow-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">PayPal</span>
                              <span className="text-xs font-normal opacity-80">
                                {customSections.registry.paypal_handle}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                              Open PayPal ↗
                            </span>
                          </a>
                        )}

                        {/* Custom Payout Note */}
                        {customSections.registry.payout_note && (
                          <p className="text-xs opacity-75 italic p-2 rounded-xl bg-black/5 leading-relaxed">
                            "{customSections.registry.payout_note}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block uppercase tracking-wider text-xs font-semibold mb-1 opacity-80">
                      {tr.yourName}
                    </label>
                    <input
                      type="text"
                      value={pledgeName}
                      onChange={(e) => setPledgeName(e.target.value)}
                      required
                      className="w-full rounded-xl border p-3.5 bg-white/90 focus:outline-none text-base"
                      style={{ borderColor: theme.border_color }}
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-xs font-semibold mb-1 opacity-80">
                      {tr.warmWishes}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={tr.warmWishesPlaceholder}
                      value={pledgeMessage}
                      onChange={(e) => setPledgeMessage(e.target.value)}
                      className="w-full rounded-xl border p-3.5 bg-white/90 focus:outline-none text-base"
                      style={{ borderColor: theme.border_color }}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveCashFund(null)}
                      className="flex-1 rounded-full border py-3.5 text-sm font-semibold uppercase tracking-wider opacity-75 hover:opacity-100 cursor-pointer min-h-[44px]"
                      style={{ borderColor: theme.border_color }}
                    >
                      {tr.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isPledging}
                      className="flex-1 rounded-full py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer min-h-[44px]"
                      style={{ backgroundColor: theme.accent_color }}
                    >
                      {isPledging ? tr.recordingGift : tr.recordGift}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
