'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  Gift,
  CheckCircle2,
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
  chapterSettings,
  computeSectionStyle,
  containerClassName,
  containerInlineStyle,
  isStudioDesign,
  orderedVisibleSections,
  pageBackgroundStyle,
} from '@/lib/portal-design';
import WaxSealOpening, { BowSvg, SealSvg, TWINE } from '@/components/WaxSeal';
import { BotanicalCorner, GoldHairlineDivider } from '@/components/MotifDecorations';
import { buildIcs, downloadIcs } from '@/lib/ics';
import EditableText from '@/components/guest/EditableText';
import { getMenuOptions } from '@/lib/menu';
import { fill, PORTAL_LANGUAGES, portalLanguageOf, portalStrings } from '@/lib/portal-i18n';
import { hasFeature } from '@/lib/plans';
import { calendarMonth, contrastRatio, ensureContrast, isDarkBackground, monogram, readableOn, readablePalette } from '@/lib/invite-style';
import { submitRsvpAction, uploadPhotoAction, contributeToRegistryAction } from '@/app/actions/wedding-actions';


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
  /** When set (Editor preview), the couple's own text can be clicked and edited in place. */
  onEditText?: (path: string, value: string) => void;
  /** Preview only: start on the opening screen instead of the opened invitation. */
  showOpening?: boolean;
  /** Preview only: show the floating RSVP pill and music button (hidden by default so they don't cover content). */
  showFloating?: boolean;
}

/** The countdown's two units: days and hours, or hours and minutes on the last day. */
function countdownUnits(t: { days: number; hours: number; minutes: number }) {
  return t.days > 0 ? (['days', 'hours'] as const) : (['hours', 'minutes'] as const);
}

/** Countdown labels for a single day, hour or minute. */
const UNIT_SINGULAR = { days: 'day', hours: 'hour', minutes: 'minute' } as const;

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
  onEditText,
  showOpening = false,
  showFloating = false,
}: GuestPortalViewProps) {
  const baseTheme =
    customTheme ||
    (event?.theme_id ? BUILTIN_THEMES[event.theme_id] : null) ||
    BUILTIN_THEMES['royal-floral'];

  const tr = portalStrings(event?.language);
  // Couple-written text: editable in the Editor preview, plain text everywhere else.
  const editable = (path: string, value: string | null | undefined, label: string, multiline = false) =>
    onEditText ? (
      <EditableText value={value || ''} label={label} multiline={multiline} onCommit={(v) => onEditText(path, v)} />
    ) : (
      value
    );
  const locale = PORTAL_LANGUAGES[portalLanguageOf(event?.language)].locale;

  const mergedTheme: TemplateDesignRecord = {
    ...baseTheme,
    ...(event?.theme_config && typeof event.theme_config === 'object' ? event.theme_config : {}),
  };
  // A preset mixed with a couple's own colours can produce unreadable pairs (dark text on a navy card,
  // champagne on cream); repair just those, so every guest can read the invitation whatever was chosen
  const repaired = readablePalette({
    bg: mergedTheme.bg_color || '#FAF7F2',
    text: mergedTheme.text_color || '#2C2523',
    accent: mergedTheme.accent_color || '#9E5A44',
    surface: mergedTheme.surface_color || '#FFFFFF',
  });
  const theme: TemplateDesignRecord = {
    ...mergedTheme,
    text_color: repaired.text,
    surface_color: repaired.surface,
    accent_color: repaired.accent,
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
  const [hasOpened, setHasOpened] = useState(previewMode && !showOpening);
  const [justOpened, setJustOpened] = useState(false);
  // The floating RSVP pill hides while the RSVP card itself is on screen.
  const [rsvpInView, setRsvpInView] = useState(false);
  const [pastCalendar, setPastCalendar] = useState(false);
  useEffect(() => {
    const el = document.getElementById('save-the-date');
    if (!el) return;
    // Read from the scroll position rather than an intersection crossing, so a jump straight past the
    // calendar (an anchor link, a restored scroll) still shows the pill
    const check = () => setPastCalendar(el.getBoundingClientRect().bottom < 0);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [hasOpened]);
  useEffect(() => {
    const el = document.getElementById('rsvp');
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setRsvpInView(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasOpened]);
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
  // Once every guest in the party has replied, the RSVP band thanks them instead of asking again
  const hasReplied = rsvpStep === 5 || (allGuests.length > 0 && allGuests.every((g) => g.rsvp_status && g.rsvp_status !== 'pending'));
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
      // Confetti draws over the whole window, so it stays off in the dashboard's preview pane
      if (!previewMode) confetti({
        disableForReducedMotion: true,
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: [accent, theme.border_color || '#E8E0D7', surface, muted],
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

  // Body text: Garamond for the serif themes (headings set their own display face)
  const fontClass = theme.font_family === 'modern-sans' ? 'font-sans' : 'font-editorial';

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
  // Studio designs carry their own layout; built-in themes follow the couple's chapter order and hidden chapters.
  const chapters = chapterSettings(event?.theme_config as { section_order?: string[]; hidden_sections?: string[] });
  const renderOrder = studioLayout
    ? orderedVisibleSections(theme)
    : orderedVisibleSections({ section_order: chapters.order, hidden_sections: chapters.hidden });

  // Premium layout settings (Builder → Presets / Typography)
  const accent = theme.accent_color || '#9E5A44';
  const pageBg = theme.bg_color || '#FAF7F2';
  // The stationery frame and monogram ring: the preset's gilt when it has one, otherwise the accent
  const frameColor = theme.frame_color || accent;
  const ink = theme.text_color || '#2C2523';
  // The RSVP letter takes the preset's own shape: its rule, its corners and the shape of its buttons
  const rsvpCard = theme.rsvp_card;
  const btnShape = rsvpCard === 'square' ? 'rounded-none' : rsvpCard === 'stitch' ? 'rounded-md' : rsvpCard === 'stamp' ? 'rounded-sm' : 'rounded-full';
  const doubleRule = (c: string) =>
    `inset 0 0 0 1px color-mix(in srgb, ${c} 45%, transparent), inset 0 0 0 6px ${pageBg}, inset 0 0 0 7px color-mix(in srgb, ${c} 30%, transparent)`;
  const rsvpCardStyle: React.CSSProperties =
    rsvpCard === 'square'
      ? { boxShadow: `inset 0 0 0 1px ${ink}`, borderRadius: 0 }
      : rsvpCard === 'stitch'
        ? { boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 35%, transparent)`, outline: `1.5px dashed color-mix(in srgb, ${accent} 70%, transparent)`, outlineOffset: '-9px' }
        : rsvpCard === 'deckle'
          ? { backgroundColor: theme.surface_color || '#FFFFFF', clipPath: DECKLE, borderRadius: 0 }
          : rsvpCard === 'gilt-corners'
            ? {}
            : rsvpCard === 'girih'
            ? { boxShadow: `inset 0 0 0 1px ${frameColor}, inset 0 0 0 6px ${pageBg}, inset 0 0 0 7px color-mix(in srgb, ${frameColor} 65%, transparent)` }
            : { boxShadow: doubleRule(accent) };
  const heroLayout = theme.hero_layout || (event.cover_image_url ? 'photo' : 'stationery');
  const showPhotoHero = heroLayout === 'photo' && !!event.cover_image_url;
  const scriptNames = theme.name_style !== 'serif';
  const nameClass = `couple-names ${scriptNames ? 'font-script font-normal leading-[0.95]' : 'font-serif font-normal tracking-tight leading-[1.08]'}`;
  // Script is kept for the couple's names; section headings are set large in the text face
  const headingClass = scriptNames
    ? 'font-editorial text-3xl sm:text-4xl font-medium leading-tight tracking-[0.01em] [text-wrap:balance]'
    : 'font-serif text-2xl sm:text-3xl font-medium [text-wrap:balance]';
  const nameParts = (event.couple_names || '').split(/\s+(?:&|and)\s+/i);
  const coupleNamesStacked =
    nameParts.length === 2 ? (
      <>
        <span className="block">{nameParts[0]}</span>
        <span className="block font-editorial italic text-[0.42em] leading-tight my-1 opacity-80">&amp;</span>
        <span className="block">{nameParts[1]}</span>
      </>
    ) : (
      event.couple_names
    );
  // "Chapter I, II…" above every section when the couple turns labels on; otherwise a small ornament,
  // kept to a few key moments (the wording, Our Story, the RSVP) so it stays special
  const chapterLabel = (
    <span className="text-xs uppercase tracking-[0.3em] block" style={{ color: 'var(--section-accent, ' + accent + ')' }}>
      <span className="chapter-label" />
    </span>
  );
  const ornament = (
    <span aria-hidden="true" className="flex items-center justify-center gap-3" style={{ color: 'var(--section-accent, ' + accent + ')' }}>
      <span className="h-px w-8 bg-current opacity-40" />
      <span className="text-base leading-none">{theme.floron || '✦'}</span>
      <span className="h-px w-8 bg-current opacity-40" />
    </span>
  );
  const chapterMark = theme.show_chapter_labels ? chapterLabel : null;
  const keyMark = theme.show_chapter_labels ? chapterLabel : ornament;
  // The RSVP sits on a band of the accent colour, with text chosen to stay readable on it
  // Prefer the theme's own page or text colour on the band; fall back to plain white or near-black
  const bandInk = [pageBg, ink].find((c) => contrastRatio(c, accent) >= 4.5) ?? readableOn(accent, [pageBg, ink, '#FFFFFF', '#1A1A1A']);
  const surface = theme.surface_color || '#FFFFFF';
  // Secondary text keeps the couple's hue but is nudged until it reads comfortably on the page; 5:1 leaves
  // room for the tinted calendar band and the RSVP card, which sit a shade off the page colour
  const muted = ensureContrast(theme.muted_color || '#7D746D', pageBg, 5, ink);
  // Outlines of the RSVP choices must be seen (3:1, WCAG non-text contrast) on the page and on cards
  const choiceLine = ensureContrast(ensureContrast(theme.border_color || '#E8E0D7', pageBg, 3, ink), surface, 3, ink);
  const darkTheme = isDarkBackground(pageBg);
  // Every colour on the invitation comes from the theme through these variables, so dark themes work too
  const paletteVars = {
    '--ink': ink,
    '--muted': muted,
    '--accent': accent,
    '--on-accent': bandInk,
    '--on-ink': readableOn(ink, [surface, pageBg, '#FFFFFF', '#1A1A1A']),
    '--surface': surface,
    '--field-bg': surface,
    '--line': theme.border_color || '#E8E0D7',
    '--tint': `color-mix(in srgb, ${accent} 9%, ${surface})`,
    '--error': darkTheme ? '#FCA5A5' : '#B91C1C',
  } as React.CSSProperties;
  // The window behind the invitation takes the theme's page colour, so dark themes never flash cream when a
  // phone overscrolls or the opening plays (important, to outrank the root layout's cream utility on <body>);
  // left alone in the dashboard's preview pane
  const safePageBg = /^#[0-9a-f]{3,8}$/i.test(pageBg) ? pageBg : '#FAF7F2';
  const windowBackdrop = previewMode ? null : (
    <>
      <meta name="theme-color" content={safePageBg} />
      <style>{`html,body{background-color:${safePageBg}!important;color-scheme:${darkTheme ? 'dark' : 'light'}}`}</style>
    </>
  );
  const weddingDateLong = new Date(event.wedding_date).toLocaleDateString(locale, {
    timeZone: 'UTC', // dates are stored as midnight UTC
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const replyByShort = event.rsvp_deadline
    ? new Date(event.rsvp_deadline).toLocaleDateString(locale, { timeZone: 'UTC', month: 'long', day: 'numeric' })
    : '';

  // Save-the-date mode: the same link shows a short announcement until the couple switches to the full invitation.
  if (event.invitation_mode === 'save_the_date' && hasFeature(event, 'save_the_date')) {
    const where = [event.venue_name, event.venue_address].filter(Boolean).join(', ');
    return (
      <div
        lang={portalLanguageOf(event.language)}
        style={{ ...paletteVars, backgroundColor: theme.bg_color || '#FAF7F2', color: theme.text_color || '#2C2523' }}
        className={`invite-root ${theme.font_family === 'vintage-editorial' ? 'theme-vintage' : ''} ${theme.name_style === 'serif' ? 'names-serif' : ''} ${theme.name_font ? `name-face-${theme.name_font}` : ''} min-h-screen flex items-center justify-center px-5 py-12 ${fontClass}`}
      >
        {windowBackdrop}
        <main className="max-w-md w-full text-center space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] font-semibold" style={{ color: theme.accent_color }}>
            {tr.saveTheDate}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight">{event.couple_names}</h1>
          <p className="font-editorial text-2xl">
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
            {countdownUnits(timeLeft).map((unit) => (
              <div key={unit}>
                <span className="font-editorial text-3xl font-semibold block leading-none">{timeLeft[unit]}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">{timeLeft[unit] === 1 ? tr[UNIT_SINGULAR[unit]] : tr[unit]}</span>
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
            className="min-h-[44px] rounded-full px-6 text-base font-semibold tracking-wide text-[color:var(--on-accent)]"
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
            {(event.welcome_message || event.our_story || event.story_image_url || onEditText) && (
              <section className="text-center space-y-6">
                <div className="space-y-2">
                  {keyMark}
                  <h2 className={headingClass}>{tr.ourStory}</h2>
                </div>

                {(event.welcome_message || onEditText) && (
                  <p className="font-editorial text-lg sm:text-xl italic max-w-md mx-auto leading-relaxed opacity-90">
                    "{editable('event.welcome_message', event.welcome_message, 'welcome message', true)}"
                  </p>
                )}

                {event.story_image_url && (
                  <div
                    className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm border"
                    style={{ borderColor: theme.border_color || '#E8E0D7' }}
                  >
                    <img
                      src={event.story_image_url}
                      loading="lazy"
                      decoding="async"
                      alt="Couple Story"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {(event.our_story || onEditText) && (
                  <p
                    className="text-sm sm:text-base leading-relaxed max-w-lg mx-auto text-left opacity-80"
                    style={{ color: theme.text_color }}
                  >
                    {editable('event.our_story', event.our_story, 'your story', true)}
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
                  {chapterMark}
                  <h2 className={headingClass}>{tr.theItinerary}</h2>
                </div>

                {theme.schedule_style === 'menu' ? (
                  // Tuscan: the day set like a menu card, course by course
                  <div className="mx-auto max-w-sm border-y py-8 text-center" style={{ borderColor: `color-mix(in srgb, ${accent} 35%, transparent)` }}>
                    {visibleSchedule.map((item, idx) => (
                      <div key={item.id}>
                        {idx > 0 && (
                          <p aria-hidden="true" className="my-5 text-base leading-none" style={{ color: accent }}>
                            {theme.floron || '✦'}
                          </p>
                        )}
                        <p className="mx-auto max-w-[18ch] font-editorial text-lg vintage-caps [text-wrap:balance]">{item.title}</p>
                        <p className="mt-1 font-editorial text-base italic" style={{ color: accent }}>
                          {new Date(item.start_time).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                          {item.location_name ? ` · ${item.location_name}` : ''}
                        </p>
                        {item.description && <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">{item.description}</p>}
                        {item.dress_code && <p className="mt-1 text-sm italic text-[color:var(--muted)]">{item.dress_code}</p>}
                      </div>
                    ))}
                  </div>
                ) : theme.schedule_style === 'programme' ? (
                  // Royal: an order of service, each part under a fine gilt rule
                  <div className="mx-auto max-w-sm text-center">
                    {visibleSchedule.map((item, idx) => (
                      <div key={item.id} className={idx > 0 ? 'mt-7 pt-7 border-t' : ''} style={{ borderColor: `color-mix(in srgb, ${frameColor} 45%, transparent)` }}>
                        <p className="font-editorial text-sm uppercase tracking-[0.24em]" style={{ color: accent }}>
                          {new Date(item.start_time).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        <p className="mt-1 font-editorial text-2xl">{item.title}</p>
                        {item.location_name && <p className="mt-0.5 font-editorial text-base italic text-[color:var(--muted)]">{item.location_name}</p>}
                        {item.description && <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">{item.description}</p>}
                        {item.dress_code && <p className="mt-1 text-sm italic text-[color:var(--muted)]">{item.dress_code}</p>}
                      </div>
                    ))}
                  </div>
                ) : theme.schedule_style === 'ledger' ? (
                  // Modern: a ledger, hairline rows, the time set in the name face
                  <div className="border-t" style={{ borderColor: ink }}>
                    {visibleSchedule.map((item) => (
                      <div key={item.id} className="grid grid-cols-[6rem_1fr] gap-4 border-b py-4" style={{ borderColor: 'var(--line)' }}>
                        <span className="couple-names text-xl leading-tight">{new Date(item.start_time).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</span>
                        <div className="space-y-0.5">
                          <p className="font-editorial text-lg">{item.title}</p>
                          {item.location_name && <p className="text-sm text-[color:var(--muted)]">{item.location_name}</p>}
                          {item.description && <p className="text-sm leading-relaxed text-[color:var(--muted)]">{item.description}</p>}
                          {item.dress_code && <p className="text-sm italic text-[color:var(--muted)]">{item.dress_code}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : theme.schedule_style === 'timetable' ? (
                  // Riviera: a harbour timetable, departure times down the left
                  <div className="border-y-2" style={{ borderColor: accent }}>
                    {visibleSchedule.map((item) => (
                      <div key={item.id} className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-dashed py-4 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                        <span className="pt-0.5 font-editorial text-lg font-semibold [font-variant-numeric:tabular-nums]" style={{ color: accent }}>
                          {new Date(item.start_time).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}
                        </span>
                        <div className="space-y-0.5">
                          <p className="font-editorial text-lg font-semibold">{item.title}</p>
                          {item.location_name && <p className="text-sm text-[color:var(--muted)]">{item.location_name}</p>}
                          {item.description && <p className="text-sm leading-relaxed text-[color:var(--muted)]">{item.description}</p>}
                          {item.dress_code && <p className="text-sm italic text-[color:var(--muted)]">{item.dress_code}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                // Seamless vertical timeline (the default)
                <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-transparent before:via-[color:var(--line)] before:to-transparent">
                  {visibleSchedule.map((item, idx) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline marker: the preset's own (star, flower, girih, leaf) or a plain dot */}
                      {theme.date_mark ? (
                        <span className="absolute -left-[25px] sm:-left-[33px] top-0.5 h-[18px] w-[18px]" style={{ backgroundColor: pageBg }}>
                          <RailMark variant={theme.date_mark} accent={accent} frameColor={frameColor} />
                        </span>
                      ) : (
                        <span
                          className="absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full transition-transform duration-300 group-hover:scale-125"
                          style={{
                            backgroundColor: accent,
                            boxShadow: `0 0 0 4px ${pageBg}`,
                          }}
                        />
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-editorial text-lg sm:text-xl font-semibold tracking-tight">
                            {item.title}
                          </h3>
                          <span
                            className="text-sm uppercase tracking-widest font-semibold"
                            style={{ color: theme.accent_color }}
                          >
                            {new Date(item.start_time).toLocaleTimeString(locale, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {item.location_name && (
                          <p className="text-sm opacity-75 flex items-center gap-1">
                            {!theme.date_mark && <MapPin className="h-3 w-3 inline" />} {item.location_name}
                          </p>
                        )}

                        {item.description && (
                          <p className="text-sm leading-relaxed opacity-70 pt-1">
                            {item.description}
                          </p>
                        )}

                        {item.dress_code && (
                          <div className="pt-1">
                            <span
                              className="inline-block text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
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
                )}
              </section>
            )}

            {/* Dress code, with the couple's palette as swatches */}
            {(event.dress_code || (customSections.dress_palette || []).length > 0) && (
              <section className="mt-16 text-center space-y-4">
                <p className="font-editorial text-lg italic" style={{ color: muted }}>
                  {tr.dressCode}
                </p>
                {event.dress_code && <p className="font-editorial text-2xl sm:text-3xl italic">{event.dress_code}</p>}
                {(customSections.dress_palette || []).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-center gap-3">
                      {(customSections.dress_palette as string[]).slice(0, 6).map((c, i) => (
                        <span
                          key={i}
                          title={c}
                          className="h-10 w-10 rounded-full"
                          style={{ backgroundColor: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
                        />
                      ))}
                    </div>
                    <p className="text-sm italic text-[color:var(--muted)]">{tr.ourPalette}</p>
                  </div>
                )}
              </section>
            )}
      </>
    ),
    'travel': (
      <>
            {/* 4. THE VENUE & TRAVEL LOGISTICS */}
            <section className="text-center space-y-6">
              <div className="space-y-2">
                {chapterMark}
                <h2 className={headingClass}>{tr.venueAndTravel}</h2>
              </div>

              {event.venue_image_url && (
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm border"
                  style={{ borderColor: theme.border_color || '#E8E0D7' }}
                >
                  <img
                    src={event.venue_image_url}
                      loading="lazy"
                      decoding="async"
                    alt={event.venue_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-editorial text-2xl font-semibold vintage-caps">{event.venue_name}</h3>
                <p className="text-sm opacity-75">{event.venue_address}</p>

                {event.venue_address && (
                  <div className="pt-1.5 flex justify-center">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${event.venue_name ? event.venue_name + ', ' : ''}${event.venue_address}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center text-lg italic underline decoration-1 underline-offset-4 hover:opacity-80 cursor-pointer"
                      style={{ color: accent }}
                    >
                      {tr.getDirections}
                    </a>
                  </div>
                )}

                {(event.travel_info || onEditText) && (
                  <p
                    className="mt-3 text-sm leading-relaxed p-4 rounded-2xl text-left border"
                    style={{
                      backgroundColor: theme.surface_color || '#FFFFFF',
                      borderColor: theme.border_color || '#E8E0D7',
                    }}
                  >
                    <strong className="block mb-1 text-sm uppercase tracking-wider font-semibold">
                      {tr.travelGuidance}
                    </strong>
                    {editable('event.travel_info', event.travel_info, 'travel guidance', true)}
                  </p>
                )}

                {/* Travel Cards from Custom Sections */}
                {(travelInfo.hotel_info || travelInfo.shuttle_info || onEditText) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left text-sm">
                    {(travelInfo.hotel_info || onEditText) && (
                      <div
                        className="p-4 rounded-2xl border space-y-1"
                        style={{
                          backgroundColor: theme.surface_color || '#FFFFFF',
                          borderColor: theme.border_color || '#E8E0D7',
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-[color:var(--ink)]">
                          <Hotel className="h-4 w-4 text-[color:var(--accent)]" />
                          <span>{tr.accommodations}</span>
                        </div>
                        <p className="text-xs opacity-75 leading-relaxed">{editable('sections.travel.hotel_info', travelInfo.hotel_info, 'accommodation details', true)}</p>
                      </div>
                    )}

                    {(travelInfo.shuttle_info || onEditText) && (
                      <div
                        className="p-4 rounded-2xl border space-y-1"
                        style={{
                          backgroundColor: theme.surface_color || '#FFFFFF',
                          borderColor: theme.border_color || '#E8E0D7',
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-[color:var(--ink)]">
                          <Compass className="h-4 w-4 text-[color:var(--accent)]" />
                          <span>{tr.shuttleTransit}</span>
                        </div>
                        <p className="text-xs opacity-75 leading-relaxed">{editable('sections.travel.shuttle_info', travelInfo.shuttle_info, 'shuttle details', true)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleAddToCalendar}
                    className="min-h-[44px] inline-flex items-center text-lg italic underline decoration-1 underline-offset-4 hover:opacity-80 cursor-pointer"
                    style={{ color: accent }}
                  >
                    {visibleSchedule.length > 0 ? tr.addItineraryToCalendar : tr.addToMyCalendar}
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
                  {chapterMark}
                  <h2 className={headingClass}>{tr.weddingParty}</h2>
                  <p className="text-sm font-editorial italic opacity-75">
                    Standing alongside {event.couple_names}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {weddingPartyList.map((member: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-2xl border p-4 space-y-2 flex items-start gap-3.5"
                      style={{
                        backgroundColor: theme.surface_color || '#FFFFFF',
                        borderColor: theme.border_color || '#E8E0D7',
                      }}
                    >
                      <div className="h-12 w-12 rounded-full bg-[color:var(--tint)] flex items-center justify-center font-editorial text-xl font-semibold shrink-0 text-[color:var(--ink)]">
                        {member.name ? member.name.charAt(0) : '✦'}
                      </div>
                      <div>
                        <h3 className="font-editorial text-lg font-semibold" style={{ color: theme.text_color }}>
                          {editable(`sections.wedding_party.members.${i}.name`, member.name, 'name')}
                        </h3>
                        <span
                          className="text-xs font-bold uppercase tracking-wider block"
                          style={{ color: theme.accent_color }}
                        >
                          {editable(`sections.wedding_party.members.${i}.role`, member.role, 'role')}
                        </span>
                        {(member.bio || onEditText) && (
                          <p className="text-xs opacity-75 mt-1 leading-relaxed">
                            {editable(`sections.wedding_party.members.${i}.bio`, member.bio, 'bio', true)}
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
                  {chapterMark}
                  <h2 className={headingClass}>{tr.localConcierge}</h2>
                  <p className="text-sm font-editorial italic opacity-75">
                    {tr.favoriteSpots}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
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
                        <h3 className="font-editorial text-lg font-semibold" style={{ color: theme.text_color }}>
                          {editable(`sections.local_recs.items.${i}.name`, rec.name, 'place name')}
                        </h3>
                        <span className="text-xs uppercase font-bold tracking-wider rounded-full px-2 py-0.5 bg-[color:var(--tint)] text-[color:var(--ink)]">
                          {rec.type || tr.spot}
                        </span>
                      </div>
                      <p className="text-xs opacity-75 leading-relaxed">
                        {editable(`sections.local_recs.items.${i}.description`, rec.description, 'description', true)}
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
                  {chapterMark}
                  <h2 className={headingClass}>{tr.goodToKnow}</h2>
                </div>

                <div className="space-y-3 text-left max-w-lg mx-auto">
                  {faqList.map((faq: any, idx: number) => {
                    const isOpen = openFaqIndex === idx || !!onEditText;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border overflow-hidden transition-all"
                        style={{
                          backgroundColor: theme.surface_color || '#FFFFFF',
                          borderColor: theme.border_color || '#E8E0D7',
                        }}
                      >
                        {onEditText ? (
                          // In the Editor preview the question is edited in place, so it isn't a toggle button.
                          <div className="w-full p-4 min-h-[48px] text-left font-medium text-sm">
                          <span className="font-semibold text-[color:var(--ink)]">{editable(`sections.faq.items.${idx}.question`, faq.question, 'question')}</span>
                        </div>
                        ) : (
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 min-h-[48px] text-left font-medium text-sm flex items-center justify-between gap-3 hover:bg-[color:var(--tint)] cursor-pointer"
                        >
                          <span className="font-semibold text-[color:var(--ink)]">{editable(`sections.faq.items.${idx}.question`, faq.question, 'question')}</span>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-[color:var(--muted)] shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[color:var(--muted)] shrink-0" />
                          )}
                        </button>
                        )}
                        {isOpen && (
                          <div className="px-4 pb-4 text-sm opacity-80 leading-relaxed border-t border-[color:var(--line)] pt-3">
                            {editable(`sections.faq.items.${idx}.answer`, faq.answer, 'answer', true)}
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
        <h2 className={headingClass}>{tr.rsvpTitle}</h2>
        <p className="text-base opacity-80">{tr.usePersonalLink}</p>
      </section>
    ) : (
      <>
            {/* 8. FORMAL STATIONERY RESPONSE CARD (4-STEP TACTILE RSVP WIZARD) */}
            <section id="rsvp" className="space-y-8 pt-4">
              {/* On the colour band this heading is the strip of colour; the letter sits below it on the page */}
              <div className="rsvp-head text-center space-y-2">
                {keyMark}
                <h2 className={headingClass}>
                  {tr.rsvpTitle}
                </h2>
                <p className="text-base font-editorial italic">
                  {hasReplied ? (
                    tr.thanksForReply
                  ) : (
                    <>
                      {tr.kindlyReplyBy}{' '}
                      {new Date(event.rsvp_deadline).toLocaleDateString(locale, {
                        timeZone: 'UTC', // dates are stored as midnight UTC
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </>
                  )}
                </p>
              </div>

              {/* Physical Response Card Frame */}
              <div
                ref={rsvpCardRef}
                className="relative overflow-hidden rounded-[2px] p-7 sm:p-11 scroll-mt-20"
                style={{ color: ink, ...rsvpCardStyle }}
              >
                <RsvpCardMark variant={theme.rsvp_card} accent={accent} frameColor={frameColor} pageBg={pageBg} />
                {isRsvpLocked ? (
                  <div className="py-6 text-center space-y-2 font-editorial text-base">
                    <Lock className="h-6 w-6 mx-auto opacity-70" />
                    <h3 className="font-editorial text-lg font-semibold">{tr.rsvpClosedTitle}</h3>
                    <p className="text-sm opacity-70">
                      {event.rsvp_locked ? tr.rsvpLocked : tr.deadlinePassed} If you need
                      to make an adjustment, please contact the couple directly.
                    </p>
                  </div>
                ) : rsvpStep === 5 ? (
                  /* STEP 5: A short note from the couple, sealed */
                  <div className="py-6 text-center space-y-5">
                    {theme.opening_style === 'envelope' ? (
                      <div className="mx-auto h-12 w-20 invite-rise" aria-hidden="true">
                        <BowSvg accent={theme.envelope_detail === 'twine' ? TWINE : accent} twine={theme.envelope_detail === 'twine'} />
                      </div>
                    ) : (
                      <div className="mx-auto h-16 w-16 invite-rise" aria-hidden="true">
                        <SealSvg initials={monogram(event.couple_names)} accent={accent} />
                      </div>
                    )}
                    <p className="font-editorial text-2xl sm:text-3xl">
                      {tr.dear} {partyNames},
                    </p>
                    <p className="font-editorial text-2xl sm:text-3xl italic leading-snug max-w-sm mx-auto">
                      {allGuests.some((g) => partyState[g.id]?.rsvp_status === 'attending') ? tr.thankNoteAttending : tr.thankNoteDeclined}
                    </p>
                    <p className="italic text-[color:var(--muted)]">
                      {tr.withLove} {event.couple_names}
                    </p>

                    <span aria-hidden="true" className="mx-auto block h-px w-12 bg-[color:var(--line)]" />

                    <ul className="space-y-1 text-base" aria-label={tr.recordedAttendance}>
                      {allGuests.map((g) => {
                        const st = partyState[g.id]?.rsvp_status;
                        return (
                          <li key={g.id}>
                            {g.first_name} {g.last_name || ''}
                            {(st === 'attending' || st === 'declined') && (
                              <span className="italic text-[color:var(--muted)]"> {st === 'attending' ? tr.willAttend : tr.willNotAttend}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      type="button"
                      onClick={() => setRsvpStep(1)}
                      className="min-h-[44px] inline-flex items-center text-base italic underline decoration-1 underline-offset-4 text-[color:var(--muted)] hover:text-[color:var(--ink)] cursor-pointer"
                    >
                      {tr.editRsvp}
                    </button>
                  </div>
                ) : (
                  /* WIZARD CONTAINER */
                  <div className="space-y-6 font-editorial text-base">
                    {rsvpStep === 1 && (
                      <p className="font-editorial text-2xl sm:text-3xl" style={{ color: ink }}>
                        {tr.dear} {partyNames},
                      </p>
                    )}

                    <p className="sr-only" aria-live="polite">{fill(tr.stepOf, { step: rsvpStep })}</p>

                    {/* STEP 1: HOUSEHOLD PARTY ATTENDANCE */}
                    {rsvpStep === 1 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h3 className="font-editorial text-xl font-semibold" style={{ color: theme.text_color }}>
                            {tr.willYouCelebrate}
                          </h3>
                          <p className="italic opacity-75">
                            {tr.indicateAttendance}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {allGuests.map((guest) => {
                            const gState = partyState[guest.id] || { rsvp_status: 'pending' };
                            return (
                              <div
                                key={guest.id}
                                className="space-y-3 border-t pt-5 first:border-t-0 first:pt-0"
                                style={{ borderColor: theme.border_color || '#E8E0D7' }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-editorial text-lg font-semibold" style={{ color: theme.text_color }}>
                                    {guest.first_name} {guest.last_name || ''}
                                  </span>
                                  
                                </div>

                                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    aria-pressed={gState.rsvp_status === 'attending'}
                                    onClick={() => handleStatusChange(guest.id, 'attending')}
                                    className={`min-h-[44px] flex items-center justify-center gap-2 ${btnShape} border py-3 text-base font-semibold tracking-wide transition-all cursor-pointer ${
                                      gState.rsvp_status === 'attending' ? 'text-[color:var(--on-accent)] shadow-sm' : 'hover:opacity-80'
                                    }`}
                                    style={
                                      gState.rsvp_status === 'attending'
                                        ? { backgroundColor: theme.accent_color, borderColor: theme.accent_color }
                                        : { borderColor: choiceLine, color: theme.text_color }
                                    }
                                  >
                                    <span>{tr.joyfullyAccept}</span>
                                  </button>

                                  <button
                                    type="button"
                                    aria-pressed={gState.rsvp_status === 'declined'}
                                    onClick={() => handleStatusChange(guest.id, 'declined')}
                                    className={`min-h-[44px] flex items-center justify-center gap-2 ${btnShape} border py-3 text-base font-semibold tracking-wide transition-all cursor-pointer ${
                                      gState.rsvp_status === 'declined' ? 'text-[color:var(--on-ink)] shadow-sm' : 'hover:opacity-80'
                                    }`}
                                    style={
                                      gState.rsvp_status === 'declined'
                                        ? { backgroundColor: theme.text_color, borderColor: theme.text_color }
                                        : { borderColor: choiceLine, color: theme.text_color }
                                    }
                                  >
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
                              if (hasAnyAttending) setRsvpStep(3);
                              else setRsvpStep(4); // Skip to review if all declined
                            }}
                            className={`min-h-[44px] ${btnShape} border px-6 py-3 text-base font-semibold tracking-wide transition-all flex items-center gap-2 ${
                              allAnswered
                                ? 'text-[color:var(--on-accent)] shadow-md hover:opacity-95 cursor-pointer'
                                : 'text-[color:var(--muted)] border-[color:var(--line)] cursor-not-allowed'
                            }`}
                            style={allAnswered ? { backgroundColor: accent, borderColor: accent } : undefined}
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
                        {/* Which events (folded in from its own step) */}
                        {visibleSchedule.length > 0 && (
                          <div className="space-y-6 border-b pb-6" style={{ borderColor: theme.border_color }}>
                        <div className="space-y-1">
                          <h3 className="font-editorial text-xl font-semibold" style={{ color: theme.text_color }}>
                            {tr.selectEvents}
                          </h3>
                        </div>

                        {/* Everyone is down for all of it; only a guest who'll miss something opens the list */}
                        <p className="italic text-[color:var(--muted)]">
                          {tr.allOfIt} {visibleSchedule.map((item) => item.title).join(' · ')}
                        </p>
                        <details
                          className="group"
                          open={attendingGuestsInParty.some((g) => visibleSchedule.some((item) => subEventRsvps[g.id]?.[item.id] === 'declined'))}
                        >
                          <summary className="min-h-[44px] flex items-center gap-2 cursor-pointer list-none italic text-[color:var(--muted)] hover:text-[color:var(--ink)]">
                            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                            {tr.missPartOfDay}
                          </summary>
                          <div className="space-y-4 pt-3">
                            {attendingGuestsInParty.map((guest) => (
                              <fieldset key={guest.id} className="space-y-1">
                                {attendingGuestsInParty.length > 1 && (
                                  <legend className="font-editorial text-lg font-semibold">{guest.first_name}</legend>
                                )}
                                {visibleSchedule.map((item) => {
                                  const isAttendingItem = subEventRsvps[guest.id]?.[item.id] !== 'declined';
                                  return (
                                    <label key={item.id} className="flex min-h-[44px] items-center gap-3 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isAttendingItem}
                                        onChange={(e) => handleSubEventStatusChange(guest.id, item.id, e.target.checked ? 'attending' : 'declined')}
                                        className="h-5 w-5 shrink-0 cursor-pointer"
                                        style={{ accentColor: accent }}
                                      />
                                      <span>
                                        {item.title}
                                        <span className="italic text-[color:var(--muted)]">
                                          {' '}· {new Date(item.start_time).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                      </span>
                                    </label>
                                  );
                                })}
                              </fieldset>
                            ))}
                          </div>
                        </details>
                          </div>
                        )}

                        <div className="space-y-1">
                          <h3 className="font-editorial text-xl font-semibold" style={{ color: theme.text_color }}>
                            {tr.diningDetails}
                          </h3>
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
                                className="space-y-3 border-t pt-5 first:border-t-0 first:pt-0"
                                style={{ borderColor: theme.border_color }}
                              >
                                <span className="font-editorial text-lg font-semibold block" style={{ color: theme.text_color }}>
                                  {guest.first_name}
                                </span>

                                {/* Entrée: only when the couple has set a menu */}
                                {menuOptions.length > 0 && (
                                <div>
                                  <label className="block text-base italic mb-1 text-[color:var(--muted)]">
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
                                              backgroundColor: isSelected ? `color-mix(in srgb, ${accent} 10%, ${surface})` : surface,
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
                                  ) : null}
                                </div>
                                )}

                                {/* Dietary needs, tucked away until a guest has some */}
                                <details
                                  className="group"
                                  open={(gState.dietary_tags || []).length > 0 || !!gState.dietary_notes}
                                >
                                  <summary className="min-h-[44px] flex items-center gap-2 cursor-pointer list-none italic text-[color:var(--muted)] hover:text-[color:var(--ink)]">
                                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                                    {tr.anyDietaryNeeds}
                                  </summary>
                                  <div className="space-y-4 pt-3">
                                {/* Dietary Tag Selector */}
                                <div>
                                  <label className="block text-base italic mb-1.5 text-[color:var(--muted)]">
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
                                          className={`min-h-[44px] ${btnShape} px-4 py-3 text-xs font-semibold transition-colors cursor-pointer ${
                                            isSelected
                                              ? 'bg-[color:var(--accent)] text-[color:var(--on-accent)] shadow-xs'
                                              : 'border bg-[color:var(--field-bg)] text-[color:var(--ink)] hover:bg-[color:var(--tint)]'
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
                                  <label className="block text-base italic mb-1 text-[color:var(--muted)]">
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
                                    className="w-full rounded-xl border p-3.5 bg-[color:var(--field-bg)] focus:outline-none text-base"
                                    style={{ borderColor: theme.border_color }}
                                  />
                                </div>

                                  </div>
                                </details>

                                {/* Plus-One Form */}
                                {guest.plus_one_allowed && (
                                  <div className="space-y-2 border-t pt-4 mt-2" style={{ borderColor: theme.border_color }}>
                                    <span className="text-base italic block" style={{ color: accent }}>
                                      {tr.plusOneDetails}
                                    </span>
                                    <label className="block space-y-1">
                                      <span className="block text-base italic text-[color:var(--muted)]">{tr.plusOneName}</span>
                                      <input
                                      type="text"
                                      
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
                                      className="w-full rounded-xl border p-3 bg-[color:var(--field-bg)] focus:outline-none text-base"
                                      style={{ borderColor: theme.border_color }}
                                    />
                                    </label>
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
                                        className="w-full min-h-[44px] rounded-xl border p-3 bg-[color:var(--field-bg)] focus:outline-none text-base"
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
                                      <label className="block space-y-1">
                                        <span className="block text-base italic text-[color:var(--muted)]">{tr.plusOneMealText}</span>
                                        <input
                                        type="text"
                                        
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
                                        className="w-full rounded-xl border p-3 bg-[color:var(--field-bg)] focus:outline-none text-base"
                                        style={{ borderColor: theme.border_color }}
                                      />
                                      </label>
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
                            <h3 className="font-editorial text-lg font-semibold" style={{ color: theme.text_color }}>
                              {tr.extraDetails}
                            </h3>

                            {customQuestions.map((q) => {
                              const val = customAnswers[q.id] || '';

                              return (
                                <div key={q.id} className="space-y-1.5 border-t pt-5" style={{ borderColor: theme.border_color }}>
                                  <label className="block text-sm font-semibold">
                                    {q.prompt} {q.is_required && <span className="text-[color:var(--accent)]">*</span>}
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
                                                ? 'border-[color:var(--accent)] bg-[color:var(--tint)] font-semibold'
                                                : 'border-[color:var(--line)] bg-[color:var(--field-bg)] hover:bg-[color:var(--tint)]'
                                            }`}
                                          >
                                            <span>{opt}</span>
                                            {isOptSelected && <Check className="h-3.5 w-3.5 text-[color:var(--accent)]" />}
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
                                                ? 'border-[color:var(--accent)] bg-[color:var(--tint)] font-semibold'
                                                : 'border-[color:var(--line)] bg-[color:var(--field-bg)] hover:bg-[color:var(--tint)]'
                                            }`}
                                          >
                                            <span>{opt}</span>
                                            {isChecked && <Check className="h-3.5 w-3.5 text-[color:var(--accent)]" />}
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
                                      className="w-full rounded-xl border p-3.5 bg-[color:var(--field-bg)] focus:outline-none text-base"
                                      style={{ borderColor: theme.border_color }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-2 flex flex-col-reverse gap-3 min-[420px]:flex-row min-[420px]:justify-between">
                          <button
                            type="button"
                            onClick={() => setRsvpStep(1)}
                            className={`${btnShape} justify-center whitespace-nowrap px-5 py-3.5 text-base font-semibold tracking-wide border flex items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer min-h-[44px]`}
                            style={{ borderColor: theme.border_color }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>{tr.back}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRsvpStep(4)}
                            className={`${btnShape} justify-center whitespace-nowrap px-6 py-3.5 text-base font-semibold tracking-wide text-[color:var(--on-accent)] shadow-md flex items-center gap-1.5 hover:opacity-95 cursor-pointer min-h-[44px]`}
                            style={{ backgroundColor: accent }}
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
                          <h3 className="font-editorial text-xl font-semibold" style={{ color: theme.text_color }}>
                            {tr.reviewTitle}
                          </h3>
                          <p className="text-sm opacity-75">
                            {tr.reviewIntro}
                          </p>
                        </div>

                        <div className="border-y py-5 space-y-4" style={{ borderColor: theme.border_color }}>
                          {allGuests.map((guest) => {
                            const st = partyState[guest.id] || { rsvp_status: 'pending' };
                            const isAtt = st.rsvp_status === 'attending';

                            return (
                              <div key={guest.id} className="border-b last:border-b-0 pb-3 space-y-1 text-sm">
                                <div className="flex items-center justify-between">
                                  <strong className="text-base font-semibold">{guest.first_name} {guest.last_name || ''}</strong>
                                  <span
                                    className="text-base italic"
                                    style={{ color: isAtt ? accent : muted }}
                                  >
                                    {st.rsvp_status === 'attending' ? tr.willAttend : st.rsvp_status === 'declined' ? tr.willNotAttend : tr.pending}
                                  </span>
                                </div>

                                {isAtt && (st.meal_choice || st.dietary_tags?.length > 0 || st.dietary_notes || st.plus_one_name) && (
                                  <div className="text-sm opacity-80 space-y-0.5 pt-1 pl-3 border-l border-[color:var(--line)]">
                                    {st.meal_choice && <p>{tr.entree}: {st.meal_choice}</p>}
                                    {st.dietary_tags?.length > 0 && <p>{tr.dietaryLabel}: {st.dietary_tags.join(', ')}</p>}
                                    {st.dietary_notes && <p>{tr.allergyNote}: {st.dietary_notes}</p>}
                                    {st.plus_one_name && <p>{tr.accompaniedBy}: {st.plus_one_name} ({st.plus_one_meal || tr.standard})</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {customQuestions.length > 0 && (
                            <div className="pt-2 border-t text-sm space-y-1" style={{ borderColor: theme.border_color }}>
                              <span className="text-base italic text-[color:var(--muted)]">
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
                          <p className="text-sm text-[color:var(--error)] text-center font-semibold">
                            {errorMessage}
                          </p>
                        )}

                        <div className="pt-2 flex flex-col-reverse gap-3 min-[420px]:flex-row min-[420px]:justify-between">
                          <button
                            type="button"
                            onClick={() => setRsvpStep(hasAnyAttending ? 3 : 1)}
                            className={`${btnShape} justify-center whitespace-nowrap px-5 py-3.5 text-base font-semibold tracking-wide border flex items-center gap-1.5 opacity-80 hover:opacity-100 cursor-pointer min-h-[44px]`}
                            style={{ borderColor: theme.border_color }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>{tr.editSelections}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleFinalRsvpSubmit}
                            className={`min-h-[44px] ${btnShape} justify-center whitespace-nowrap px-8 py-3 text-sm font-semibold tracking-wide text-[color:var(--on-accent)] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-2`}
                            style={{ backgroundColor: accent }}
                          >
                            {isSubmitting ? (
                              <span>{tr.recordingRsvp}</span>
                            ) : (
                              <>
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
                {chapterMark}
                <h2 className={headingClass}>{tr.sharedMemories}</h2>
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-base font-semibold tracking-wide transition-all hover:scale-105 shadow-sm text-[color:var(--on-accent)]"
                  style={{ backgroundColor: accent }}
                >
                  <span>{isUploadingPhoto ? tr.uploadingPhoto : tr.addPhoto}</span>
                </label>
                {uploadMessage && (
                  <p className="mt-2 text-sm font-medium" style={{ color: theme.accent_color }}>
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
                      loading="lazy"
                      decoding="async"
                      alt={p.caption || 'Wedding Photo'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {p.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 text-xs text-white text-left">
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
                  {chapterMark}
                  <h2 className={headingClass}>{tr.giftRegistry}</h2>
                  <p className="text-sm font-editorial italic opacity-75 max-w-sm mx-auto">
                    {tr.registryIntro}
                  </p>
                </div>

                <div className="space-y-4 max-w-md mx-auto text-left">
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
                          <h3 className="font-editorial text-lg font-semibold" style={{ color: theme.text_color }}>
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm opacity-75 mt-0.5">{item.description}</p>
                          )}
                        </div>

                        {item.is_cash_fund ? (
                          publicView ? null : <button
                            onClick={() => setActiveCashFund(item)}
                            className="rounded-full px-4 py-3.5 text-sm font-semibold text-[color:var(--on-accent)] transition-opacity hover:opacity-90 cursor-pointer shrink-0 min-h-[44px]"
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

  const floatingControls = (
    <>
      {musicUrl && hasOpened && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={musicPlaying ? tr.pauseMusic : tr.playMusic}
          className={`${previewMode ? 'absolute pointer-events-auto' : 'fixed bottom-5'} right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg text-[color:var(--on-accent)]`}
          style={{ backgroundColor: theme.accent_color || '#9E5A44' }}
        >
          {musicPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      )}
      {hasOpened && pastCalendar && !publicView && !isRsvpLocked && rsvpStep !== 5 && !rsvpInView && (
        <a
          href="#rsvp"
          className={`${previewMode ? 'relative pointer-events-auto' : 'fixed bottom-5 left-1/2 -translate-x-1/2'} z-40 inline-flex min-h-[46px] items-center gap-3 whitespace-nowrap rounded-full px-6 shadow-lg transition-opacity hover:opacity-90`}
          style={{ backgroundColor: accent, color: bandInk }}
        >
          <span className="font-editorial text-lg tracking-[0.12em]">RSVP</span>
          {hasReplied ? (
            <span className="font-editorial text-sm italic">{tr.editRsvp}</span>
          ) : (
            replyByShort && (
              <span className="font-editorial text-sm italic">
                {tr.replyBy} {replyByShort}
              </span>
            )
          )}
        </a>
      )}
    </>
  );

  return (
    <div
      lang={portalLanguageOf(event.language)}
      style={{
        ...paletteVars,
        backgroundColor: theme.bg_color || '#FAF7F2',
        color: theme.text_color || '#2C2523',
        ...(studioLayout ? pageBackgroundStyle(theme) : {}),
      }}
      className={`invite-root ${theme.font_family === 'vintage-editorial' ? 'theme-vintage' : ''} ${theme.name_style === 'serif' ? 'names-serif' : ''} ${theme.name_font ? `name-face-${theme.name_font}` : ''} ${theme.rsvp_card === 'square' ? 'corners-square' : ''} min-h-screen selection:bg-[color:var(--accent)] selection:text-[color:var(--on-accent)] pb-28 ${fontClass} transition-colors duration-500 ${theme.paper_texture ? 'paper-grain relative' : ''}`}
    >
      {windowBackdrop}
      {/* 1. Tactile Wax-Seal / Envelope Opening Reveal */}
      {!hasOpened && (
        <WaxSealOpening
          coupleNames={event.couple_names}
          openingStyle={theme.opening_style}
          nameStyle={scriptNames ? 'script' : 'serif'}
          palette={{
            bg: theme.bg_color,
            surface: theme.surface_color || '#FFFFFF',
            text: theme.text_color,
            accent: theme.accent_color,
            border: theme.border_color,
            paper: theme.envelope_paper,
            liner: theme.envelope_liner,
            detail: theme.envelope_detail,
          }}
          strings={tr}
          guestName={publicView ? undefined : partyNames}
          onOpen={() => {
            setHasOpened(true);
            setJustOpened(true);
            // Opening is a tap, so browsers allow sound to start here.
            if (musicUrl && !previewMode) {
              audioRef.current?.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
            }
          }}
        />
      )}

      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}

      {/* Floating music button and RSVP pill. On the live page they float over the window; in the dashboard's
          preview pane (whose transform traps position: fixed) they sit in a sticky bar at the pane's foot instead. */}
      {!previewMode && floatingControls}

      {/* 1. COVER: the couple's photo full-bleed, names over it. The page slides up over it like a curtain. */}
      {showPhotoHero && (
        <section
          // In the dashboard's preview pane the cover fills the pane, not the whole window
          className={`sticky top-0 z-0 w-full overflow-hidden ${previewMode ? 'h-[70vh] lg:h-[calc(100vh-9rem)] min-h-[480px]' : 'h-[100svh] min-h-[560px]'}`}
          aria-label={event.couple_names}
        >
          <img src={event.cover_image_url!} alt={event.couple_names} className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 38%, rgba(0,0,0,0.58) 100%)' }}
          />
          <CoverFrame
            flair={theme.border_flair}
            accent={accent}
            postmark={{
              place: (event.venue_name || '').slice(0, 26),
              day: new Date(event.wedding_date).toLocaleDateString(locale, { timeZone: 'UTC', day: 'numeric', month: 'short' }),
              year: String(new Date(event.wedding_date).getUTCFullYear()),
            }}
          />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-[calc(5.5rem+4svh)] text-center text-white [text-shadow:0_1px_18px_rgba(0,0,0,0.35)]">
            <p className="font-editorial text-xs sm:text-sm uppercase tracking-[0.22em] sm:tracking-[0.32em] opacity-90 [text-wrap:balance]">
              {onEditText ? editable('theme.eyebrow_text', theme.eyebrow_text, 'top line') : theme.eyebrow_text || tr.weddingCelebration}
            </p>
            <h1 className={`${nameClass} mt-3 ${scriptNames ? 'text-7xl sm:text-8xl' : 'text-5xl sm:text-6xl'}`}>{coupleNamesStacked}</h1>
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-white/60" />
              <p className="font-editorial text-sm uppercase tracking-[0.28em] [font-variant-numeric:lining-nums]">
                {new Date(event.wedding_date).toLocaleDateString(locale, { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <span className="h-px w-8 bg-white/60" />
            </div>
            {event.venue_name && <p className="font-editorial text-lg italic mt-2 opacity-90">{event.venue_name}</p>}
          </div>
        </section>
      )}

      {/* The invitation itself (counterReset numbers the .chapter-label spans in the order the sections render) */}
      <main
        className={`relative z-10 ${justOpened ? 'invite-rise' : ''}`}
        style={{ counterReset: 'chapter', backgroundColor: pageBg, ...(studioLayout ? pageBackgroundStyle(theme) : {}) }}
      >
        {/* 2. THE INVITATION WORDING: framed stationery, or a quiet text block under the cover photo */}
        <div className={`mx-auto ${canvasMaxWidthClass} px-5 sm:px-8 pt-14 sm:pt-20 pb-4`}>
          {showPhotoHero ? (
            <header className="text-center space-y-5 max-w-md sm:max-w-xl mx-auto">
              {keyMark}
              <p className="font-editorial text-lg italic" style={{ color: muted }}>
                {tr.togetherWithFamilies}
              </p>
              <p className={`${nameClass} ${scriptNames ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl'}`} style={{ color: ink }}>
                {event.couple_names}
              </p>
              <p className="font-editorial text-lg sm:text-2xl leading-relaxed [text-wrap:balance]">
                {onEditText ? editable('theme.invitation_phrase', theme.invitation_phrase, 'invitation line', true) : theme.invitation_phrase || 'request the honour of your presence at their marriage'}
              </p>
              <div className="pt-2 space-y-1">
                <p className="font-editorial text-xl vintage-caps">{weddingDateLong}</p>
                <p className="font-editorial text-base italic" style={{ color: muted }}>
                  {[event.venue_name, event.venue_address].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="font-editorial text-lg sm:text-xl italic leading-relaxed" style={{ color: muted }}>
                &ldquo;{onEditText ? editable('theme.poetic_line', theme.poetic_line, 'poetic line') : theme.poetic_line || 'Two hearts, one horizon'}&rdquo;
              </p>
            </header>
          ) : (
            <header
              className={heroStyle ? `text-center ${containerClassName(heroStyle)}` : 'relative mx-auto max-w-lg p-1.5'}
              // A preset's own gilt is drawn at full strength; the accent frame stays a soft hairline
              style={heroStyle ? containerInlineStyle(heroStyle) : { border: `1px solid ${theme.frame_color || `color-mix(in srgb, ${frameColor} 55%, transparent)`}` }}
            >
              {!heroStyle && theme.rsvp_card === 'girih' && (
                // An eight-point girih star set on the frame's head rule
                <svg aria-hidden="true" viewBox="-12 -12 24 24" className="absolute left-1/2 top-0 h-10 w-10 -translate-x-1/2 -translate-y-1/2" fill={pageBg} stroke={frameColor} strokeWidth="0.9" strokeLinejoin="round">
                  <path d={GIRIH} />
                  <circle r="2.4" />
                </svg>
              )}
              <div
                className="text-center space-y-6 px-6 py-12 sm:px-10 sm:py-16"
                style={heroStyle ? undefined : { border: `1px solid color-mix(in srgb, ${frameColor} ${theme.frame_color ? 70 : 30}%, transparent)` }}
              >
                {/* Monogram */}
                <div
                  className="mx-auto grid h-16 w-16 place-items-center rounded-full border font-editorial text-lg tracking-[0.12em]"
                  style={{ borderColor: `color-mix(in srgb, ${frameColor} 60%, transparent)`, color: accent, boxShadow: `inset 0 0 0 3px ${pageBg}, inset 0 0 0 4px color-mix(in srgb, ${frameColor} 30%, transparent)` }}
                  aria-hidden="true"
                >
                  {monogram(event.couple_names).split('').join(' & ')}
                </div>
                <p className="font-editorial text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] [text-wrap:balance]" style={{ color: accent }}>
                  {onEditText ? editable('theme.eyebrow_text', theme.eyebrow_text, 'top line') : theme.eyebrow_text || tr.weddingCelebration}
                </p>
                <div className="space-y-3">
                  <h1 className={`${nameClass} ${scriptNames ? 'text-6xl sm:text-7xl' : 'text-4xl sm:text-5xl'}`} style={{ color: ink }}>
                    {coupleNamesStacked}
                  </h1>
                  <p className="font-editorial text-lg italic max-w-sm mx-auto leading-relaxed [text-wrap:balance]" style={{ color: muted }}>
                    {onEditText ? editable('theme.invitation_phrase', theme.invitation_phrase, 'invitation line', true) : theme.invitation_phrase || 'request the honour of your presence at their marriage'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-editorial text-xl vintage-caps">{weddingDateLong}</p>
                  <p className="font-editorial text-base italic" style={{ color: muted }}>
                    {[event.venue_name, event.venue_address].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <p className="font-editorial text-lg italic" style={{ color: muted }}>
                  &ldquo;{onEditText ? editable('theme.poetic_line', theme.poetic_line, 'poetic line') : theme.poetic_line || 'Two hearts, one horizon'}&rdquo;
                </p>
              </div>
            </header>
          )}

          {/* Cover photo under the stationery, when the couple chose the framed layout */}
          {!showPhotoHero && event.cover_image_url && (
            <div
              className={`relative mx-auto mt-12 aspect-[4/5] sm:aspect-[16/11] w-full overflow-hidden shadow-wedding ${
                theme.border_flair === 'arch' ? 'rounded-t-[140px] rounded-b-[2px]' : 'rounded-[2px]'
              }`}
            >
              <img src={event.cover_image_url} alt={event.couple_names} className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        {/* 3. SAVE THE DATE: the month with a hand-drawn heart around the day, and the countdown */}
        {(() => {
          const cal = calendarMonth(event.wedding_date);
          const weekdays = Array.from({ length: 7 }, (_, i) =>
            new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })
          );
          const monthLabel = new Date(Date.UTC(cal.year, cal.month, 1)).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
          return (
            <section
              id="save-the-date"
              aria-label={`${tr.saveTheDate}: ${weddingDateLong}`}
              className="mt-10 px-5 py-16 sm:py-20"
              style={{ backgroundColor: darkTheme ? `color-mix(in srgb, ${accent} 4%, ${surface})` : `color-mix(in srgb, ${accent} 7%, ${pageBg})` }}
            >
              <div className="mx-auto max-w-sm text-center">
                <p className="font-editorial text-xl italic" style={{ color: accent }}>
                  {tr.saveTheDate}
                </p>
                <h2 className={`${headingClass} mt-2 capitalize`}>{monthLabel}</h2>
                <div aria-hidden="true" className="mt-8 grid grid-cols-7 gap-y-2 border-y py-5 font-editorial" style={{ borderColor: `color-mix(in srgb, ${accent} 25%, transparent)` }}>
                  {weekdays.map((w) => (
                    <span key={w} className="pb-2 text-xs uppercase tracking-[0.15em] text-[color:var(--muted)]">
                      {w.replace('.', '')}
                    </span>
                  ))}
                  {cal.weeks.flat().map((d, i) => (
                    <span key={i} className={`relative grid h-9 place-items-center text-lg ${d === cal.day ? 'font-semibold' : 'opacity-80'}`}>
                      {d}
                      {d === cal.day && <DateMark variant={theme.date_mark} accent={accent} ink={ink} frameColor={frameColor} />}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-start justify-center">
                  {countdownUnits(timeLeft).map((unit, i) => (
                    <div key={unit} className={`px-5 sm:px-7 ${i > 0 ? 'border-l' : ''}`} style={{ borderColor: `color-mix(in srgb, ${accent} 25%, transparent)` }}>
                      <span
                        className={`block leading-none ${
                          theme.name_font && theme.name_style === 'serif' ? 'couple-names text-4xl not-italic' : 'font-editorial text-3xl italic'
                        }`}
                      >
                        {timeLeft[unit]}
                      </span>
                      <span className="mt-1 block text-base italic lowercase text-[color:var(--muted)]">
                        {timeLeft[unit] === 1 ? tr[UNIT_SINGULAR[unit]] : tr[unit]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* 4. CHAPTERS: Studio designs set their own order, visibility and containers */}
        {studioLayout ? (
          <div className={`mx-auto ${canvasMaxWidthClass} px-5 sm:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24`}>
            {renderOrder.map((id) => {
              const sectionStyle = computeSectionStyle(theme, id);
              return (
                <div key={id} className={`empty:hidden ${containerClassName(sectionStyle)}`} style={containerInlineStyle(sectionStyle)}>
                  {sectionBlocks[id]}
                </div>
              );
            })}
          </div>
        ) : (
          renderOrder.map((id) =>
            id === 'rsvp' && !publicView ? (
              <div
                key={id}
                className="rsvp-band my-8 isolate px-5 sm:px-8 pb-12 sm:pb-16"
                style={
                  ((theme.rsvp_band ?? (darkTheme ? 'deep' : 'accent')) === 'deep'
                    ? // Night themes: a deeper shade of the page between accent hairlines, not a flat block of gold
                      {
                        '--band-bg': `color-mix(in srgb, ${pageBg} 72%, #000)`,
                        '--band-ink': ink,
                        '--band-line': `color-mix(in srgb, ${accent} 45%, transparent)`,
                      }
                    : { '--band-bg': accent, '--band-ink': bandInk, '--band-line': 'transparent', ['--section-accent' as string]: bandInk }) as React.CSSProperties
                }
              >
                <div className={`mx-auto ${canvasMaxWidthClass}`}>{sectionBlocks[id]}</div>
              </div>
            ) : (
              <div key={id} className={`mx-auto ${canvasMaxWidthClass} px-5 sm:px-8 py-10 sm:py-14 empty:hidden`}>
                {sectionBlocks[id]}
              </div>
            )
          )
        )}

        {/* CASH FUND CONTRIBUTION MODAL */}
        {activeCashFund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border"
              style={{
                backgroundColor: theme.surface_color || '#FFFFFF',
                borderColor: theme.border_color || '#E8E0D7',
                color: theme.text_color,
              }}
            >
              <h3 className="font-editorial text-2xl font-semibold">
                {tr.contributeTo} {activeCashFund.title}
              </h3>
              <p className="text-sm opacity-75">
                {fill(tr.contributionIntro, { couple: event.couple_names })}
              </p>

              {pledgeSuccess ? (
                <div className="rounded-2xl bg-[color:var(--tint)] border border-[color:var(--line)] p-5 text-center text-sm space-y-2">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-[color:var(--accent)]" aria-hidden="true" />
                  <h3 className="font-editorial text-lg font-semibold">{tr.giftRecorded}</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Thank you {pledgeName}! Your gift and warm message have been recorded for {event.couple_names}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCashFundPledge} className="space-y-4 text-sm">
                  {pledgeError && (
                    <p role="alert" className="rounded-xl border border-[color:var(--error)] px-4 py-3 text-sm text-[color:var(--error)]">
                      {pledgeError}
                    </p>
                  )}
                  <div>
                    <label className="block text-base italic mb-1 text-[color:var(--muted)]">
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
                              ? 'bg-[color:var(--ink)] text-[color:var(--on-ink)] border-[color:var(--ink)]'
                              : 'bg-[color:var(--field-bg)] border-[color:var(--line)] text-[color:var(--ink)] hover:bg-[color:var(--tint)]'
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
                      className="w-full rounded-xl border p-3.5 bg-[color:var(--field-bg)] focus:outline-none text-base"
                      style={{ borderColor: theme.border_color }}
                    />
                  </div>

                  {/* Direct Payment Handles (Option 1) */}
                  {customSections.registry && (
                    <div className="space-y-2 pt-2 border-t border-[color:var(--line)]">
                      <label className="block text-base italic text-[color:var(--muted)]">
                        {tr.sendDirectly}
                      </label>

                      <div className="space-y-1.5">
                        {/* Venmo */}
                        {customSections.registry.venmo_handle && (
                          <a
                            href={`https://venmo.com/${customSections.registry.venmo_handle.replace('@', '')}?txn=pay&amount=${pledgeAmount || '0'}&note=${encodeURIComponent(`Wedding Gift for ${event.couple_names}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl border border-[color:var(--line)] bg-[color:var(--tint)] text-[color:var(--ink)] font-semibold hover:border-[color:var(--accent)] transition-colors shadow-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">Venmo</span>
                              <span className="text-xs font-normal opacity-80">
                                @{customSections.registry.venmo_handle.replace('@', '')}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[color:var(--accent)] bg-[color:var(--field-bg)] px-2 py-0.5 rounded-full border border-[color:var(--line)]">
                              Open Venmo ↗
                            </span>
                          </a>
                        )}

                        {/* Zelle */}
                        {customSections.registry.zelle_info && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border border-[color:var(--line)] bg-[color:var(--tint)] text-[color:var(--ink)] font-semibold hover:border-[color:var(--accent)] shadow-xs">
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
                              className="text-xs font-bold text-[color:var(--accent)] bg-[color:var(--field-bg)] px-2.5 py-3 rounded-full border border-[color:var(--line)] cursor-pointer min-h-[44px]"
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
                            className="flex items-center justify-between p-2.5 rounded-xl border border-[color:var(--line)] bg-[color:var(--tint)] text-[color:var(--ink)] font-semibold hover:border-[color:var(--accent)] transition-colors shadow-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">Cash App</span>
                              <span className="text-xs font-normal opacity-80">
                                ${customSections.registry.cashapp_tag.replace('$', '')}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[color:var(--accent)] bg-[color:var(--field-bg)] px-2 py-0.5 rounded-full border border-[color:var(--line)]">
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
                            className="flex items-center justify-between p-2.5 rounded-xl border border-[color:var(--line)] bg-[color:var(--tint)] text-[color:var(--ink)] font-semibold hover:border-[color:var(--accent)] transition-colors shadow-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm">PayPal</span>
                              <span className="text-xs font-normal opacity-80">
                                {customSections.registry.paypal_handle}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[color:var(--accent)] bg-[color:var(--field-bg)] px-2 py-0.5 rounded-full border border-[color:var(--line)]">
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
                    <label className="block text-base italic mb-1 text-[color:var(--muted)]">
                      {tr.yourName}
                    </label>
                    <input
                      type="text"
                      value={pledgeName}
                      onChange={(e) => setPledgeName(e.target.value)}
                      required
                      className="w-full rounded-xl border p-3.5 bg-[color:var(--field-bg)] focus:outline-none text-base"
                      style={{ borderColor: theme.border_color }}
                    />
                  </div>

                  <div>
                    <label className="block text-base italic mb-1 text-[color:var(--muted)]">
                      {tr.warmWishes}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={tr.warmWishesPlaceholder}
                      value={pledgeMessage}
                      onChange={(e) => setPledgeMessage(e.target.value)}
                      className="w-full rounded-xl border p-3.5 bg-[color:var(--field-bg)] focus:outline-none text-base"
                      style={{ borderColor: theme.border_color }}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveCashFund(null)}
                      className="flex-1 rounded-full border py-3.5 text-base font-semibold tracking-wide opacity-75 hover:opacity-100 cursor-pointer min-h-[44px]"
                      style={{ borderColor: theme.border_color }}
                    >
                      {tr.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isPledging}
                      className="flex-1 rounded-full py-3.5 text-base font-semibold tracking-wide text-[color:var(--on-accent)] shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer min-h-[44px]"
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

      {previewMode && showFloating && (
        <div className="pointer-events-none sticky bottom-0 z-40 -mt-20 flex h-20 items-center justify-center">{floatingControls}</div>
      )}
    </div>
  );
}

/** One hand-drawn signature detail over the photo cover, chosen by the preset's border_flair. */
export function CoverFrame({ flair, accent, postmark }: { flair?: string; accent: string; postmark?: { place: string; day: string; year: string } }) {
  const line = 'rgba(255,255,255,0.6)';
  // Light accents (champagne, marigold) read on a photo; deep ones fall back to white
  const tone = contrastRatio(accent, '#000000') > 7 ? accent : line;
  switch (flair) {
    case 'botanical-crest': {
      // An upright laurel wreath: two leafy branches rising from a crossed stem and curving in towards each other
      const branch = (t: number) => {
        // Cubic bezier for the left branch, (46,78) → (36,6); the right branch mirrors it
        const [p0, p1, p2, p3] = [[46, 78], [14, 70], [6, 30], [36, 6]];
        const u = 1 - t;
        const at = (i: 0 | 1) => u ** 3 * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t ** 3 * p3[i];
        const d = (i: 0 | 1) => 3 * u * u * (p1[i] - p0[i]) + 6 * u * t * (p2[i] - p1[i]) + 3 * t * t * (p3[i] - p2[i]);
        // Rounded so server and browser render identical numbers
        const r = (n: number) => Math.round(n * 100) / 100;
        return { x: r(at(0)), y: r(at(1)), angle: r((Math.atan2(d(1), d(0)) * 180) / Math.PI) };
      };
      const leaves = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86].map(branch);
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 84"
          className="pointer-events-none absolute left-1/2 top-[7svh] h-20 w-24 -translate-x-1/2 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.35))]"
          fill="none"
          stroke={line}
          strokeWidth="1"
          strokeLinecap="round"
        >
          <path d="M46 78 C 14 70, 6 30, 36 6" />
          <path d="M54 78 C 86 70, 94 30, 64 6" />
          <path d="M42 82 L 58 74 M58 82 L 42 74" />
          {leaves.map(({ x, y, angle }, i) => (
            <g key={i}>
              <ellipse cx={x - 4} cy={y} rx="5" ry="2.2" transform={`rotate(${angle + 40} ${x - 4} ${y})`} />
              <ellipse cx={x + 3} cy={y + 1} rx="5" ry="2.2" transform={`rotate(${angle - 40} ${x + 3} ${y + 1})`} />
              <ellipse cx={100 - x + 4} cy={y} rx="5" ry="2.2" transform={`rotate(${180 - angle - 40} ${100 - x + 4} ${y})`} />
              <ellipse cx={100 - x - 3} cy={y + 1} rx="5" ry="2.2" transform={`rotate(${180 - angle + 40} ${100 - x - 3} ${y + 1})`} />
            </g>
          ))}
        </svg>
      );
    }
    // Frames stop 5.5rem above the cover's foot, clear of the floating RSVP button
    case 'double-line':
      return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-4 bottom-[5.5rem] border p-1.5" style={{ borderColor: line }}>
          <div className="h-full w-full border" style={{ borderColor: 'rgba(255,255,255,0.35)' }} />
        </div>
      );
    case 'hairline-gold': {
      // A true gold hairline with a single wave at its head; champagne gold reads on any photo
      const gold = '#D9C08A';
      return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-5 bottom-[5.5rem] border" style={{ borderColor: gold }}>
          <svg viewBox="0 0 80 12" className="absolute left-1/2 top-3 h-4 w-24 -translate-x-1/2" fill="none" stroke={gold} strokeWidth="1.3" strokeLinecap="round">
            <path d="M2 6 C 10 0, 18 0, 26 6 S 42 12, 50 6 S 66 0, 78 6" />
          </svg>
        </div>
      );
    }
    case 'arch':
      // An arched window with a grapevine sprig at its crown
      return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-8 bottom-[5.5rem] rounded-t-full border" style={{ borderColor: line }}>
          <svg viewBox="0 0 90 40" className="absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 -translate-y-1/2" fill="none" stroke={line} strokeWidth="1.2" strokeLinecap="round">
            <path d="M8 20 C 25 10, 45 10, 82 20" />
            <ellipse cx="22" cy="12" rx="6" ry="3" transform="rotate(-25 22 12)" />
            <ellipse cx="66" cy="12" rx="6" ry="3" transform="rotate(25 66 12)" />
            {[[42, 18], [48, 18], [45, 23], [39, 23], [51, 23], [45, 28]].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" />
            ))}
          </svg>
        </div>
      );
    case 'arabesque':
      // A double rule with a marigold toran swagged across its head
      return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-4 bottom-[5.5rem] border p-1.5" style={{ borderColor: tone }}>
          <div className="h-full w-full border" style={{ borderColor: tone, opacity: 0.6 }} />
          {/* A marigold garland (toran) swagged across the top: ruffled flower heads with leaves between them.
              It keeps its proportions (never stretched), capped in width so a wide screen gets a centred swag. */}
          <svg
            viewBox="0 0 300 38"
            className="absolute left-1/2 top-12 h-auto w-[calc(100%-1.5rem)] max-w-[36rem] -translate-x-1/2"
            fill={tone}
            stroke="none"
          >
            {Array.from({ length: 13 }, (_, i) => {
              const r = (n: number) => Math.round(n * 100) / 100;
              const x = 10 + i * 23.3;
              const y = r(8 + Math.sin((i / 12) * Math.PI) * 20);
              const leafX = r(x + 11.6);
              const leafY = r(8 + Math.sin(((i + 0.5) / 12) * Math.PI) * 20);
              return (
                <g key={i}>
                  {/* Ruffled head: a ring of petals round a deeper centre */}
                  {Array.from({ length: 8 }, (_, k) => (
                    <circle key={k} cx={r(x + Math.cos((k / 8) * 2 * Math.PI) * 4.2)} cy={r(y + Math.sin((k / 8) * 2 * Math.PI) * 4.2)} r="2.6" />
                  ))}
                  {/* An inner ring of petals, a shade deeper, so each head reads as a ruffled marigold */}
                  {Array.from({ length: 6 }, (_, k) => (
                    <circle key={`in${k}`} cx={r(x + Math.cos((k / 6) * 2 * Math.PI + 0.5) * 2.2)} cy={r(y + Math.sin((k / 6) * 2 * Math.PI + 0.5) * 2.2)} r="2" fill="#000" opacity="0.12" />
                  ))}
                  <circle cx={r(x)} cy={y} r="1.5" fill="#000" opacity="0.25" />
                  {i < 12 && (
                    <g opacity="0.7">
                      <ellipse cx={leafX - 2.4} cy={leafY} rx="3.4" ry="1.4" transform={`rotate(-30 ${leafX - 2.4} ${leafY})`} />
                      <ellipse cx={leafX + 2.4} cy={leafY} rx="3.4" ry="1.4" transform={`rotate(30 ${leafX + 2.4} ${leafY})`} />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      );
    case 'clay':
      // Boho: a single clay hairline, drawn by hand rather than ruled
      return <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-5 bottom-[5.5rem] rounded-[3px_14px_4px_12px] border" style={{ borderColor: '#D9B49A' }} />;
    case 'stars':
      // A single gold hairline: the foil stars belong to the envelope
      return <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-5 bottom-[5.5rem] border" style={{ borderColor: tone }} />;
    case 'airmail': {
      // Riviera: the airmail envelope carried onto the cover, a striped border with a postmark at its corner
      return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-4 bottom-[5.5rem]">
          <div
            className="cover-airmail absolute inset-0"
            style={{ padding: 3, background: `repeating-linear-gradient(-45deg, ${accent} 0 7px, #FFFFFF 7px 12px)` }}
          />
          {/* A postmark carrying the place and the date */}
          <svg viewBox="0 0 96 56" className="absolute right-4 top-5 h-28 w-48 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.45))]" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1">
            <defs>
              <path id="postmark-ring" d="M8 28 A 20 20 0 1 1 48 28 A 20 20 0 1 1 8 28" />
            </defs>
            <circle cx="28" cy="28" r="25" />
            <circle cx="28" cy="28" r="15" strokeWidth="0.6" />
            {/* The place runs the whole way round, as a cancellation stamp does */}
            <text fill="rgba(255,255,255,0.92)" stroke="none" fontSize="6" className="font-editorial uppercase">
              <textPath href="#postmark-ring" startOffset="0" textLength="118" lengthAdjust="spacing">
                {postmark?.place} ·
              </textPath>
            </text>
            <text x="28" y="27" textAnchor="middle" fill="rgba(255,255,255,0.95)" stroke="none" fontSize="7" letterSpacing="0.4" className="font-editorial uppercase">
              {postmark?.day}
            </text>
            <text x="28" y="35" textAnchor="middle" fill="rgba(255,255,255,0.95)" stroke="none" fontSize="6" letterSpacing="0.6" className="font-editorial">
              {postmark?.year}
            </text>
            {[18, 24, 30, 36].map((y) => (
              <path key={y} d={`M56 ${y} C 64 ${y - 3}, 72 ${y + 3}, 80 ${y} S 92 ${y - 3}, 96 ${y}`} />
            ))}
          </svg>
        </div>
      );
    }
    case 'deboss':
      // Blind-debossed rules above and below the names: pressed into the paper, no ink
      return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-6 bottom-[5.5rem]">
          <span className="absolute inset-x-0 top-0 h-px bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.35)]" />
          <span className="absolute inset-x-0 bottom-0 h-px bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.35)]" />
        </div>
      );
    default:
      return null;
  }
}

/** A small marker for the itinerary rail, drawn in the same idiom as the preset's date mark. */
function RailMark({ variant, accent, frameColor }: { variant?: string; accent: string; frameColor: string }) {
  switch (variant) {
    case 'star':
      return (
        <svg viewBox="-12 -12 24 24" className="h-full w-full" fill={accent}>
          <path d="M0 -11 Q 1.4 -1.4, 11 0 Q 1.4 1.4, 0 11 Q -1.4 1.4, -11 0 Q -1.4 -1.4, 0 -11 Z" />
        </svg>
      );
    case 'beads':
      // A marigold head: a ring of petals round a centre
      return (
        <svg viewBox="-12 -12 24 24" className="h-full w-full" fill={accent}>
          {Array.from({ length: 8 }, (_, k) => (
            <circle key={k} cx={Math.round(Math.cos((k / 8) * 2 * Math.PI) * 600) / 100} cy={Math.round(Math.sin((k / 8) * 2 * Math.PI) * 600) / 100} r="3.6" />
          ))}
          <circle r="4" />
          <circle r="2" fill="#000" opacity="0.22" />
        </svg>
      );
    case 'girih':
      return (
        <svg viewBox="-12 -12 24 24" className="h-full w-full" fill="none" stroke={frameColor} strokeWidth="1.6" strokeLinejoin="round">
          <path d={GIRIH} />
        </svg>
      );
    case 'ring':
      // A single leaf
      return (
        <svg viewBox="-12 -12 24 24" className="h-full w-full" fill={accent}>
          <path d="M-9 9 C -9 -2, -2 -9, 9 -9 C 9 2, 2 9, -9 9 Z" />
        </svg>
      );
    default:
      return <span className="block h-full w-full border" style={{ borderColor: accent }} />;
  }
}

/** The mark round the wedding day in the calendar: a hand-drawn heart, or the preset's own. */
function DateMark({ variant, accent, ink, frameColor }: { variant?: string; accent: string; ink: string; frameColor: string }) {
  const box = 'pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2';
  switch (variant) {
    case 'square':
      // Modern: a ruled square, nothing more
      return <span className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 border" style={{ borderColor: ink }} />;
    case 'star':
      return (
        <svg viewBox="-12 -12 24 24" className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-11 -translate-x-1/2 -translate-y-1/2" fill="none" stroke={accent} strokeWidth="0.7" strokeLinejoin="round">
          <path d="M0 -11.5 Q 2.2 -2.2, 11.5 0 Q 2.2 2.2, 0 11.5 Q -2.2 2.2, -11.5 0 Q -2.2 -2.2, 0 -11.5 Z" />
        </svg>
      );
    case 'girih':
      // Two interlaced squares (a khatam): the open centre leaves the date clear
      return (
        <svg viewBox="-12 -12 24 24" className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2" fill="none" stroke={frameColor} strokeWidth="0.5" strokeLinejoin="round">
          <rect x="-7.5" y="-7.5" width="15" height="15" />
          <rect x="-7.5" y="-7.5" width="15" height="15" transform="rotate(45)" />
        </svg>
      );
    case 'beads':
      // Marigold: a ring of beads round the day
      return (
        <svg viewBox="-12 -12 24 24" className={box} fill={accent}>
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={Math.round(Math.cos((i / 14) * 2 * Math.PI) * 1000) / 100} cy={Math.round(Math.sin((i / 14) * 2 * Math.PI) * 1000) / 100} r="0.85" />
          ))}
        </svg>
      );
    case 'ring':
      // Boho: a loose ring drawn once round the day, not quite closed
      return (
        <svg viewBox="0 0 60 54" className={box} fill="none">
          <path d="M33 6 C 50 7, 57 21, 52 34 C 47 46, 30 50, 17 44 C 6 38, 4 23, 11 14 C 17 7, 27 4, 40 8" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 60 54" className={box} fill="none">
          <path d="M31 49 C 14 38, 3 27, 6 15 C 9 4, 23 2, 30 13.5 C 35 3, 49 2, 54 12 C 59 24, 47 37, 29 50.5" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

/** A torn, deckled paper edge for Boho's RSVP letter: small irregular notches along all four sides. */
const DECKLE = (() => {
  const jag = [0, 2, 1, 3, 0, 2, 3, 1, 2, 0, 3, 1, 2, 3, 0, 1, 3, 2, 0, 2];
  const pts: string[] = [];
  jag.forEach((j, i) => pts.push(`${(i / jag.length) * 100}% ${j}px`));
  jag.forEach((j, i) => pts.push(`calc(100% - ${j}px) ${(i / jag.length) * 100}%`));
  jag.forEach((j, i) => pts.push(`${100 - (i / jag.length) * 100}% calc(100% - ${j}px)`));
  jag.forEach((j, i) => pts.push(`${j}px ${100 - (i / jag.length) * 100}%`));
  return `polygon(${pts.join(', ')})`;
})();

/** An eight-point girih star, centred on 0,0 within a 24-unit box. */
const GIRIH = 'M0 -11 L2.07 -4.99 L7.78 -7.78 L4.99 -2.07 L11 0 L4.99 2.07 L7.78 7.78 L2.07 4.99 L0 11 L-2.07 4.99 L-7.78 7.78 L-4.99 2.07 L-11 0 L-4.99 -2.07 L-7.78 -7.78 L-2.07 -4.99 Z';

/** The small mark a preset leaves on its RSVP letter: gilt corners, foil stars, beads, a girih star or a stamp. */
function RsvpCardMark({ variant, accent, frameColor, pageBg }: { variant?: string; accent: string; frameColor: string; pageBg: string }) {
  const corner = 'pointer-events-none absolute h-5 w-5';
  switch (variant) {
    case 'gilt-corners': {
      // Gilt brackets in each corner, like a framed card (the preset's own gilt)
      return (
        <span aria-hidden="true">
          {[
            ['left-3 top-3', 'border-l-[1.5px] border-t-[1.5px]'],
            ['right-3 top-3', 'border-r-[1.5px] border-t-[1.5px]'],
            ['left-3 bottom-3', 'border-l-[1.5px] border-b-[1.5px]'],
            ['right-3 bottom-3', 'border-r-[1.5px] border-b-[1.5px]'],
          ].map(([pos, sides]) => (
            <span key={pos} className={`${corner} ${pos} ${sides}`} style={{ borderColor: frameColor }} />
          ))}
        </span>
      );
    }
    case 'stars':
      return (
        <span aria-hidden="true">
          {['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'].map((pos) => (
            <svg key={pos} viewBox="-5 -5 10 10" className={`pointer-events-none absolute h-3 w-3 ${pos}`} fill={accent}>
              <path d="M0 -5 Q 0 0, 5 0 Q 0 0, 0 5 Q 0 0, -5 0 Q 0 0, 0 -5 Z" />
            </svg>
          ))}
        </span>
      );
    case 'beads':
      // A row of marigold beads along the top and foot of the letter
      return (
        <span aria-hidden="true">
          {['top-3', 'bottom-3'].map((pos) => (
            <span
              key={pos}
              className={`pointer-events-none absolute inset-x-8 h-2 ${pos}`}
              style={{ background: `radial-gradient(circle, ${accent} 2.6px, transparent 3.1px) center / 11px 8px space no-repeat` }}
            />
          ))}
        </span>
      );
    case 'girih':
      // An eight-point girih star set on the head rule, in gilt
      return (
        <svg aria-hidden="true" viewBox="-12 -12 24 24" className="pointer-events-none absolute left-1/2 top-1 h-9 w-9 -translate-x-1/2" fill={pageBg} stroke={frameColor} strokeWidth="0.9" strokeLinejoin="round">
          <path d={GIRIH} />
          <circle r="2.4" />
        </svg>
      );
    case 'stamp':
      // A postage stamp in the corner: perforated edge, a single wave
      return (
        <span aria-hidden="true" className="pointer-events-none absolute right-4 top-4 grid h-11 w-9 rotate-[4deg] place-items-center border-2 border-dotted p-0.5" style={{ borderColor: accent }}>
          <svg viewBox="0 0 20 24" className="h-full w-full" fill="none" stroke={accent} strokeWidth="1.2">
            <rect x="1" y="1" width="18" height="22" strokeWidth="0.6" />
            <path d="M3 15 C 6 12, 9 18, 12 15 S 17 12, 17 15" />
            <circle cx="13" cy="7" r="2.4" />
          </svg>
        </span>
      );
    default:
      return null;
  }
}
