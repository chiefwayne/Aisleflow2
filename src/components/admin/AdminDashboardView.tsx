'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import {
  LayoutDashboard,
  LayoutGrid,
  Settings,
  Users,
  Send,
  Palette,
  Edit3,
  Calendar,
  HelpCircle,
  Gift,
  Camera,
  CheckSquare,
  Sparkles,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Phone,
  Mail,
  ShieldAlert,
  ArrowRight,
  Printer,
  ChevronRight,
  Clock,
  UserCheck,
  UserMinus,
  MessageSquare,
  Hotel,
  Compass,
  AlertCircle,
  Type,
  Layers,
  Sliders,
  ChevronUp,
  Eye,
  MessageCircle,
  EyeOff,
  UserPlus,
  Edit2,
  X
} from 'lucide-react';
import {
  EventRecord,
  GuestRecord,
  ScheduleItemRecord,
  CustomRsvpQuestionRecord,
  CustomRsvpResponseRecord,
  RegistryItemRecord,
  RegistryContributionRecord,
  PhotoRecord,
  PlanningTaskRecord,
  CommunicationTemplateRecord,
  CommunicationCampaignRecord,
  CommunicationMessageRecord,
  TemplateDesignRecord,
  GuestbookEntryRecord,
  EventCustomSections
} from '@/lib/types';
import { BUILTIN_THEMES } from '@/lib/theme-presets';
import { generateQrDataUrl } from '@/lib/qrcode';
import PortalPreviewPane from '@/components/admin/PortalPreviewPane';
import GuestPortalView from '@/components/guest/GuestPortalView';
import { ImagePickerUploader } from '@/components/common/ImagePickerUploader';
import PublishReadinessPanel from '@/components/admin/PublishReadinessPanel';
import PlanCard from '@/components/admin/PlanCard';
import SeatingPlanner from '@/components/admin/SeatingPlanner';
import DesignServiceCard from '@/components/admin/DesignServiceCard';
import {
  deleteGuestbookEntryAction,
  getOrCreateAlbumTokenAction,
  listGuestbookAction,
  setMemoryVisibilityAction,
} from '@/app/actions/album-actions';
import { featureError, hasFeature } from '@/lib/plans';
import { isStudioDesign } from '@/lib/portal-design';
import { getMenuOptions, MenuOption } from '@/lib/menu';
import { whatsappShareUrl } from '@/lib/share';
import { setAtPath } from '@/lib/set-at-path';
import { PORTAL_LANGUAGES } from '@/lib/portal-i18n';
import { generateTrackingToken, renderTemplateVariables } from '@/lib/communications';
import {
  addGuestAction,
  updateGuestAction,
  deleteGuestAction,
  rotateGuestAccessTokenAction,
  managePartyAction,
  importGuestsCsvAction,
  sendCommunicationAction,
  dispatchExistingCampaignAction,
  deleteCampaignAction,
  broadcastSmsAction,
  deletePhotoAction,
  manageRegistryItemAction,
  manageScheduleItemAction,
  manageCustomQuestionAction,
  managePlanningTaskAction,
  updateEventSetupAction,
  updateEventCustomSectionsAction,
  updateEventThemeAction,
  updateEventDesignAction,
  updateCommunicationTemplateAction,
  deleteCommunicationTemplateAction,
  listEventRowsAction,
  setGuestRsvpStatusAction,
  setGuestPlusOneAction,
  setEventMusicAction,
  setInvitationModeAction,
  setCustomSlugAction,
} from '@/app/actions/wedding-actions';

interface AdminDashboardViewProps {
  initialEvent: EventRecord;
  initialGuests: GuestRecord[];
  initialSchedule: ScheduleItemRecord[];
  initialQuestions: CustomRsvpQuestionRecord[];
  initialResponses: CustomRsvpResponseRecord[];
  initialRegistry: RegistryItemRecord[];
  initialContributions: RegistryContributionRecord[];
  initialPhotos: PhotoRecord[];
  initialTasks: PlanningTaskRecord[];
  initialTemplates: CommunicationTemplateRecord[];
  initialCampaigns: CommunicationCampaignRecord[];
  studioDesigns?: TemplateDesignRecord[];
}

export default function AdminDashboardView({
  initialEvent,
  initialGuests,
  initialSchedule,
  initialQuestions,
  initialResponses,
  initialRegistry,
  initialContributions,
  initialPhotos,
  initialTasks,
  initialTemplates,
  initialCampaigns,
  studioDesigns = [],
}: AdminDashboardViewProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'setup' | 'guests' | 'communications' | 'builder' | 'copy' | 'schedule' | 'questions' | 'registry' | 'photos' | 'seating' | 'planning'
  >('dashboard');

  // State
  const [event, setEvent] = useState<EventRecord>(initialEvent);
  const [guests, setGuests] = useState<GuestRecord[]>(initialGuests);
  const [schedule, setSchedule] = useState<ScheduleItemRecord[]>(initialSchedule);
  const [questions, setQuestions] = useState<CustomRsvpQuestionRecord[]>(initialQuestions);
  const [responses, setResponses] = useState<CustomRsvpResponseRecord[]>(initialResponses);
  const [registry, setRegistry] = useState<RegistryItemRecord[]>(initialRegistry);
  const [contributions, setContributions] = useState<RegistryContributionRecord[]>(initialContributions);
  const [photos, setPhotos] = useState<PhotoRecord[]>(initialPhotos);
  const [tasks, setTasks] = useState<PlanningTaskRecord[]>(initialTasks);
  const defaultTemplates: CommunicationTemplateRecord[] = [
    {
      id: 'default-invite',
      event_id: initialEvent.id,
      template_key: 'formal_invitation',
      name: 'Formal Digital Invitation',
      lifecycle_type: 'invitation',
      channel: 'both',
      subject: `Formal Wedding Invitation: ${initialEvent.couple_names}`,
      sms_body: `{coupleNames} invite you to celebrate their wedding on {eventDate} at {venueName}. Open your personalized portal to RSVP: {link}`,
      email_body: `Dear {name},\n\nWe request the honour of your presence at the celebration of our marriage on {eventDate} at {venueName}.\n\nPlease open your personalized portal to RSVP:\n{link}\n\nWith love,\n{coupleNames}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'default-reminder',
      event_id: initialEvent.id,
      template_key: 'friendly_reminder',
      name: 'Friendly RSVP Reminder',
      lifecycle_type: 'reminder',
      channel: 'both',
      subject: `Friendly Reminder: RSVP for ${initialEvent.couple_names}'s Wedding`,
      sms_body: `Hi {name}! Gentle reminder to confirm your RSVP for {coupleNames}'s wedding by {rsvpDeadline}. View your details here: {link}`,
      email_body: `Dear {name},\n\nThis is a gentle reminder to please confirm your attendance for our wedding by {rsvpDeadline}.\n\nYou can view event details and RSVP in seconds at:\n{link}\n\nWarmly,\n{coupleNames}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const [templates, setTemplates] = useState<CommunicationTemplateRecord[]>(
    initialTemplates && initialTemplates.length > 0 ? initialTemplates : defaultTemplates
  );
  const [campaigns, setCampaigns] = useState<CommunicationCampaignRecord[]>(initialCampaigns);

  // Modal & Form States
  const [newGuestModalOpen, setNewGuestModalOpen] = useState(false);
  const [csvImportModalOpen, setCsvImportModalOpen] = useState(false);
  const [newCampaignModalOpen, setNewCampaignModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplateRecord | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    lifecycle_type: 'invitation' as 'invitation' | 'save_the_date' | 'reminder' | 'update',
    channel: 'both' as 'both' | 'sms' | 'email',
    subject: '',
    sms_body: '',
    email_body: '',
  });
  const [newRegistryModalOpen, setNewRegistryModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<ScheduleItemRecord | null>(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CustomRsvpQuestionRecord | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlanningTaskRecord | null>(null);
  const [qrModalGuest, setQrModalGuest] = useState<{ guest: GuestRecord; qrDataUrl: string } | null>(null);
  const [tableCardModal, setTableCardModal] = useState<string | null>(null);

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');

  // Schedule Item Form State
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    location_name: '',
    start_time: '',
    end_time: '',
    description: '',
    dress_code: '',
    is_vip_only: false,
    requires_rsvp: true,
    display_order: 1,
  });

  // Custom RSVP Question Form State
  const [questionForm, setQuestionForm] = useState({
    prompt: '',
    question_type: 'text' as 'text' | 'single_choice' | 'multiple_choice',
    options_str: '',
    is_required: false,
  });

  // Planning Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'General',
    owner: 'Couple',
    due_date: '',
    status: 'todo' as 'todo' | 'doing' | 'done',
    priority: 'medium' as 'high' | 'medium' | 'low',
    display_order: 1,
  });

  // Guest Filtering & Selection
  const [guestSearch, setGuestSearch] = useState('');
  const [guestFilterStatus, setGuestFilterStatus] = useState<string>('all');
  const [newGuestForm, setNewGuestForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_vip: false,
    relationship: '',
    tags: '',
    plus_one_allowed: false,
    party_name: '',
    has_partner: false,
    partner_first_name: '',
    partner_last_name: '',
    partner_email: '',
    partner_phone: '',
  });

  // Setup Form State
  // Dates are stored as timestamps; the date inputs need YYYY-MM-DD.
  const [setupForm, setSetupForm] = useState({
    ...event,
    wedding_date: (event.wedding_date || '').slice(0, 10),
    rsvp_deadline: (event.rsvp_deadline || '').slice(0, 10),
  });

  // Custom Sections CMS State
  const [customSections, setCustomSections] = useState<EventCustomSections>(
    event.custom_sections || {
      faq: { enabled: true, items: [] },
      local_recs: { enabled: true, items: [] },
      wedding_party: { enabled: true, members: [] },
      travel: { enabled: true, hotel_info: '', shuttle_info: '', airport_info: '' },
      registry: { enabled: true, venmo_handle: '', zelle_info: '', cashapp_tag: '', paypal_handle: '', payout_note: '' },
    }
  );

  // New Campaign Form State
  const [newCampaignForm, setNewCampaignForm] = useState({
    name: '',
    lifecycle_type: 'invitation',
    target_audience: 'all',
    channel: hasFeature(initialEvent, 'sms') ? 'sms' : 'email',
    subject: `Formal Wedding Invitation: ${event.couple_names}`,
    email_body: `Dear {{guest_name}},\n\nYou are cordially invited to celebrate the marriage of ${event.couple_names} on {{wedding_date}} at {{venue_name}}.\n\nPlease visit your private portal to RSVP: {{portal_link}}`,
    sms_body: `Hi {{guest_name}}! You're invited to ${event.couple_names}'s wedding. Please view details and RSVP at: {{portal_link}}`,
    scheduled_for: '',
    dispatch_mode: 'send_now' as 'send_now' | 'schedule' | 'draft',
  });

  // New Registry Item Form State
  const [newRegistryForm, setNewRegistryForm] = useState({
    title: '',
    description: '',
    is_cash_fund: true,
    target_amount: 1000,
    external_url: '',
  });

  // Two-Way SMS Simulation State
  const [smsSimulatorPhone, setSmsSimulatorPhone] = useState(guests[0]?.phone || '+14155552671');
  const [smsSimulatorMessage, setSmsSimulatorMessage] = useState('YES');
  const [smsSimulatorLog, setSmsSimulatorLog] = useState<{ sender: string; text: string; time: string }[]>([]);

  // Builder Custom Theme State (merge event.theme_config over base theme)
  const [customTheme, setCustomTheme] = useState<TemplateDesignRecord>(() => {
    const base = BUILTIN_THEMES[event.theme_id] || BUILTIN_THEMES['royal-floral'];
    return {
      ...base,
      ...(event?.theme_config && typeof event.theme_config === 'object' ? event.theme_config : {}),
    };
  });

  const [builderSubTab, setBuilderSubTab] = useState<
    'presets' | 'palette' | 'typography' | 'reveal' | 'imagery' | 'sections'
  >('presets');

  // Copy Link Helper
  // Re-read a list from the server after a change (the browser cannot query the database directly).
  const refreshRows = async (table: 'guests' | 'schedule_items' | 'custom_rsvp_questions' | 'planning_tasks') => {
    const res = await listEventRowsAction(event.id, event.admin_token, table);
    return res.rows as any[] | null;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(''), 2500);
  };

  // Open QR Modal for Guest
  const handleOpenGuestQr = async (g: GuestRecord) => {
    const url = `${window.location.origin}/g/${g.access_token}`;
    const qrData = await generateQrDataUrl(url);
    setQrModalGuest({ guest: g, qrDataUrl: qrData });
  };

  // Open Printable Table Card
  // The table card links to the shared album, never to a guest's or the couple's own link.
  const handleOpenTableCard = async () => {
    if (!hasFeature(event, 'memories')) {
      setStatusMessage(featureError('memories'));
      setTimeout(() => setStatusMessage(''), 4000);
      setActiveTab('dashboard');
      return;
    }
    const albumUrl = await ensureAlbumUrl();
    if (!albumUrl) return;
    setTableCardModal(await generateQrDataUrl(albumUrl));
  };

  const ensureAlbumUrl = async (): Promise<string | null> => {
    const result = await getOrCreateAlbumTokenAction(event.id, event.admin_token);
    if ('error' in result) {
      setStatusMessage(result.error);
      setTimeout(() => setStatusMessage(''), 4000);
      return null;
    }
    if (result.albumToken !== event.album_token) setEvent((prev) => ({ ...prev, album_token: result.albumToken }));
    return `${window.location.origin}/album/${result.albumToken}`;
  };

  const openAlbumPage = async (path: '' | '/slideshow') => {
    const albumUrl = await ensureAlbumUrl();
    if (albumUrl) window.open(`${albumUrl}${path}`, '_blank', 'noopener');
  };

  // Guestbook entries for moderation (loaded when the Photos tab opens)
  const [guestbook, setGuestbook] = useState<GuestbookEntryRecord[]>([]);
  useEffect(() => {
    if (activeTab !== 'photos' || !hasFeature(event, 'memories')) return;
    listGuestbookAction(event.id, event.admin_token).then((r) => setGuestbook(r.entries));
  }, [activeTab, event.id, event.admin_token, event.plan]);

  const handleToggleMemory = async (kind: 'photo' | 'message', id: string, approved: boolean) => {
    if (kind === 'photo') setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, is_approved: approved } : p)));
    else setGuestbook((prev) => prev.map((m) => (m.id === id ? { ...m, is_approved: approved } : m)));
    const result = await setMemoryVisibilityAction({ eventId: event.id, adminToken: event.admin_token, kind, id, approved });
    if (!result.success) {
      if (kind === 'photo') setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, is_approved: !approved } : p)));
      else setGuestbook((prev) => prev.map((m) => (m.id === id ? { ...m, is_approved: !approved } : m)));
      setStatusMessage('Could not update visibility. Please try again.');
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  const handleDeleteGuestbookEntry = async (id: string) => {
    if (!confirm('Delete this message for good?')) return;
    const result = await deleteGuestbookEntryAction(event.id, event.admin_token, id);
    if (result.success) setGuestbook((prev) => prev.filter((m) => m.id !== id));
  };

  // Metric Rollups
  const totalGuests = guests.length;
  const attendingGuests = guests.filter((g) => g.rsvp_status === 'attending').length;
  const declinedGuests = guests.filter((g) => g.rsvp_status === 'declined').length;
  const pendingGuests = guests.filter((g) => g.rsvp_status === 'pending').length;
  const totalRaised = registry.reduce((sum, item) => sum + (Number(item.current_amount) || 0), 0);
  const smsAllowed = hasFeature(event, 'sms');
  const readinessCounts = {
    guests: guests.length,
    schedule: schedule.length,
    questions: questions.length,
    registry: registry.length,
  };

  // Setup Save Handler (Server Action)
  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    setStatusMessage('Saving setup...');
    try {
      const result = await updateEventSetupAction({
        eventId: event.id,
        adminToken: event.admin_token,
        couple_names: setupForm.couple_names,
        admin_email: setupForm.admin_email,
        wedding_date: setupForm.wedding_date,
        rsvp_deadline: setupForm.rsvp_deadline,
        allow_late_rsvp: setupForm.allow_late_rsvp,
        rsvp_locked: !!setupForm.rsvp_locked,
        language: setupForm.language || 'en',
        venue_name: setupForm.venue_name,
        venue_address: setupForm.venue_address,
        launch_notes: setupForm.launch_notes,
      });

      if (result.success && result.event) {
        setEvent(result.event as EventRecord);
        setStatusMessage('✅ Wedding setup saved successfully!');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to save setup'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed to save setup: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Add Guest Handler with "Has Partner / Spouse" dual-guest creation (Server Action)
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const result = await addGuestAction({
        eventId: event.id,
        adminToken: event.admin_token,
        first_name: newGuestForm.first_name,
        last_name: newGuestForm.last_name || '',
        email: newGuestForm.email || '',
        phone: newGuestForm.phone || '',
        is_vip: newGuestForm.is_vip,
        plus_one_allowed: newGuestForm.plus_one_allowed,
        party_name: newGuestForm.party_name || '',
        has_partner: newGuestForm.has_partner,
        partner_name: `${newGuestForm.partner_first_name} ${newGuestForm.partner_last_name}`.trim(),
      });

      if (result.success && result.guest) {
        setGuests((prev) => [...prev, result.guest as GuestRecord]);
        setNewGuestModalOpen(false);
        setNewGuestForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          is_vip: false,
          relationship: '',
          tags: '',
          plus_one_allowed: false,
          party_name: '',
          has_partner: false,
          partner_first_name: '',
          partner_last_name: '',
          partner_email: '',
          partner_phone: '',
        });
        setStatusMessage('✅ Guest(s) added successfully!');
      } else {
        setStatusMessage(`Error: ${result.error || 'Could not add guest'}`);
      }
    } catch (err: any) {
      console.error('Error adding guest:', err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  // Rotate Guest Access Token (Server Action)
  const handleRotateToken = async (guestId: string) => {
    try {
      const result = await rotateGuestAccessTokenAction({
        guestId,
        eventId: event.id,
        adminToken: event.admin_token,
      });
      if (result.success && result.newToken) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? { ...g, access_token: result.newToken } : g))
        );
        setStatusMessage('🔑 Access token rotated! Old invitation link invalidated.');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Failed to rotate token.');
    } finally {
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Party Grouping & Management Modals
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupPartyName, setGroupPartyName] = useState('');
  const [groupTargetPartyId, setGroupTargetPartyId] = useState<'new' | string>('new');
  const [managePartyModalOpen, setManagePartyModalOpen] = useState(false);
  const [activePartyId, setActivePartyId] = useState<string | null>(null);
  const [activePartyName, setActivePartyName] = useState('');
  const [addGuestToPartySelectedId, setAddGuestToPartySelectedId] = useState('');

  // Extract all unique parties
  const existingParties = React.useMemo(() => {
    const partyMap: Record<string, { id: string; name: string; members: GuestRecord[] }> = {};
    guests.forEach((g) => {
      const pid = g.party_id || (g as any).household_id;
      if (pid) {
        if (!partyMap[pid]) {
          partyMap[pid] = {
            id: pid,
            name: g.party_name || `The ${g.last_name || 'Party'} Group`,
            members: [],
          };
        }
        partyMap[pid].members.push(g);
      }
    });
    return Object.values(partyMap);
  }, [guests]);

  // Open Group Modal when 2+ guests selected
  const handleOpenGroupModal = () => {
    if (selectedGuestIds.length < 2) return;
    const firstGuest = guests.find((g) => g.id === selectedGuestIds[0]);
    const defaultName = firstGuest?.last_name
      ? `The ${firstGuest.last_name} Family`
      : `${firstGuest?.first_name || 'Household'} Party`;
    setGroupPartyName(defaultName);
    setGroupTargetPartyId('new');
    setGroupModalOpen(true);
  };

  // Submit Grouping from Modal
  const handleConfirmGrouping = async () => {
    if (selectedGuestIds.length < 2 && groupTargetPartyId === 'new') return;
    setIsProcessingAction(true);
    try {
      const targetParty = groupTargetPartyId === 'new' ? null : existingParties.find((p) => p.id === groupTargetPartyId);
      const partyName = groupTargetPartyId === 'new' ? groupPartyName.trim() || 'Household Party' : targetParty?.name || 'Household Party';
      const partyId = groupTargetPartyId === 'new' ? undefined : groupTargetPartyId;

      const result = await managePartyAction({
        partyAction: 'group',
        eventId: event.id,
        adminToken: event.admin_token,
        guestIds: selectedGuestIds,
        partyName,
        partyId,
      });

      if (result.success) {
        const updatedGuests = await refreshRows('guests');

        if (updatedGuests) setGuests(updatedGuests as GuestRecord[]);
        setSelectedGuestIds([]);
        setGroupModalOpen(false);
        setStatusMessage(`👥 Grouped ${selectedGuestIds.length} guests into "${partyName}".`);
      } else {
        setStatusMessage(`Error grouping party: ${result.error}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  // Open Manage Party Modal for specific party
  const handleOpenManageParty = (partyId: string) => {
    const party = existingParties.find((p) => p.id === partyId);
    if (!party) return;
    setActivePartyId(partyId);
    setActivePartyName(party.name);
    setAddGuestToPartySelectedId('');
    setManagePartyModalOpen(true);
  };

  // Rename Party
  const handleRenameParty = async () => {
    if (!activePartyId || !activePartyName.trim()) return;
    setIsProcessingAction(true);
    try {
      const result = await managePartyAction({
        partyAction: 'rename',
        eventId: event.id,
        adminToken: event.admin_token,
        partyId: activePartyId,
        partyName: activePartyName.trim(),
      });

      if (result.success) {
        setGuests((prev) =>
          prev.map((g) =>
            (g.party_id === activePartyId || (g as any).household_id === activePartyId)
              ? { ...g, party_name: activePartyName.trim() }
              : g
          )
        );
        setStatusMessage(`Party renamed to "${activePartyName.trim()}".`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Add guest to active party
  const handleAddGuestToActiveParty = async (guestIdToAdd: string) => {
    if (!activePartyId || !guestIdToAdd) return;
    setIsProcessingAction(true);
    try {
      const result = await managePartyAction({
        partyAction: 'add_members',
        eventId: event.id,
        adminToken: event.admin_token,
        partyId: activePartyId,
        partyName: activePartyName,
        guestIds: [guestIdToAdd],
      });

      if (result.success) {
        const updatedGuests = await refreshRows('guests');

        if (updatedGuests) setGuests(updatedGuests as GuestRecord[]);
        setAddGuestToPartySelectedId('');
        setStatusMessage('Guest added to party.');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Remove guest from active party
  const handleRemoveGuestFromParty = async (guestId: string) => {
    setIsProcessingAction(true);
    try {
      const result = await managePartyAction({
        partyAction: 'unlink',
        eventId: event.id,
        adminToken: event.admin_token,
        guestIds: [guestId],
      });

      if (result.success) {
        setGuests((prev) =>
          prev.map((g) =>
            g.id === guestId ? { ...g, party_id: null, party_name: null, household_id: null } : g
          )
        );
        setStatusMessage('Guest removed from party.');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Dissolve active party completely
  const handleDissolveParty = async () => {
    if (!activePartyId) return;
    if (!confirm(`Are you sure you want to dissolve "${activePartyName}" and unlink all its members?`)) return;
    setIsProcessingAction(true);
    try {
      const result = await managePartyAction({
        partyAction: 'dissolve',
        eventId: event.id,
        adminToken: event.admin_token,
        partyId: activePartyId,
      });

      if (result.success) {
        setGuests((prev) =>
          prev.map((g) =>
            (g.party_id === activePartyId || (g as any).household_id === activePartyId)
              ? { ...g, party_id: null, party_name: null, household_id: null }
              : g
          )
        );
        setManagePartyModalOpen(false);
        setStatusMessage('Party dissolved.');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Delete a Guest (Server Action)
  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('Are you sure you want to remove this guest?')) return;
    try {
      const result = await deleteGuestAction({
        guestId,
        eventId: event.id,
        adminToken: event.admin_token,
      });
      if (result.success) {
        setGuests((prev) => prev.filter((g) => g.id !== guestId));
        setStatusMessage('Guest removed from registry.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  // Open Edit Template Modal
  const handleOpenEditTemplate = (tpl: CommunicationTemplateRecord) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      name: tpl.name || '',
      lifecycle_type: (tpl.lifecycle_type as any) || 'invitation',
      channel: (tpl.channel as any) || 'both',
      subject: tpl.subject || '',
      sms_body: tpl.sms_body || '',
      email_body: tpl.email_body || '',
    });
    setTemplateModalOpen(true);
  };

  // Open Create Template Modal
  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: 'Custom Announcement Template',
      lifecycle_type: 'update',
      channel: 'both',
      subject: `Update from ${event.couple_names}`,
      sms_body: `Hi {name}! We have an update regarding {coupleNames}'s wedding. View details: {link}`,
      email_body: `Dear {name},\n\nHere is an update regarding our wedding.\n\nView details at: {link}\n\nWith love,\n{coupleNames}`,
    });
    setTemplateModalOpen(true);
  };

  // Save Communication Template Action
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const isDefault = editingTemplate?.id.startsWith('default-');
      const result = await updateCommunicationTemplateAction({
        eventId: event.id,
        adminToken: event.admin_token,
        templateId: isDefault ? 'new' : (editingTemplate?.id || 'new'),
        name: templateForm.name,
        subject: templateForm.subject,
        smsBody: templateForm.sms_body,
        emailBody: templateForm.email_body,
        channel: templateForm.channel,
        lifecycleType: templateForm.lifecycle_type,
      });

      if (result.success && result.template) {
        const savedTpl = result.template as CommunicationTemplateRecord;
        setTemplates((prev) => {
          const exists = prev.some((t) => t.id === editingTemplate?.id || t.id === savedTpl.id);
          if (exists) {
            return prev.map((t) => (t.id === editingTemplate?.id ? savedTpl : t));
          } else {
            return [...prev, savedTpl];
          }
        });
        setTemplateModalOpen(false);
        setStatusMessage('✨ Template updated & saved successfully!');
      } else {
        setStatusMessage(`Error saving template: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  // Quick helper to insert variable chips into form
  const handleInsertVariable = (field: 'sms_body' | 'email_body' | 'subject', variableTag: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]} ${variableTag}` : variableTag,
    }));
  };

  // Pre-fill Broadcast Composer from a template
  const handleUseTemplateInBroadcast = (tpl: CommunicationTemplateRecord) => {
    setNewCampaignForm({
      name: `${tpl.name} Broadcast`,
      lifecycle_type: tpl.lifecycle_type || 'invitation',
      target_audience: tpl.lifecycle_type === 'reminder' ? 'pending' : 'all',
      channel: tpl.channel === 'sms' ? 'sms' : tpl.channel === 'email' ? 'email' : 'sms',
      subject: tpl.subject || `Formal Wedding Invitation: ${event.couple_names}`,
      email_body: tpl.email_body || '',
      sms_body: tpl.sms_body || '',
      scheduled_for: '',
      dispatch_mode: 'send_now',
    });
    setNewCampaignModalOpen(true);
  };

  // CSV Import Handler (Server Action)
  const handleImportCsv = async () => {
    if (!csvRawText.trim()) return;
    setIsProcessingAction(true);
    setStatusMessage('Parsing and importing guests...');

    try {
      const result = await importGuestsCsvAction({
        eventId: event.id,
        adminToken: event.admin_token,
        csvContent: csvRawText.trim(),
      });

      if (result.success) {
        const refreshedGuests = await refreshRows('guests');

        if (refreshedGuests) setGuests(refreshedGuests as GuestRecord[]);
        setCsvImportModalOpen(false);
        setCsvRawText('');
        setStatusMessage(`🎉 Successfully imported ${result.count || 0} guests!`);
      } else {
        setStatusMessage(`CSV Import error: ${result.error || 'Check CSV column headers'}`);
      }
    } catch (err: any) {
      console.error('CSV import error:', err);
      setStatusMessage(`Import failed: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Save Custom CMS Sections & Narrative Copy (Welcome, Story, Dress Code, FAQ, Local Recs, Wedding Party, Travel Logistics)
  const handleSaveCustomSections = async () => {
    setIsProcessingAction(true);
    setStatusMessage('Saving CMS & editorial narrative...');
    try {
      const result = await updateEventCustomSectionsAction({
        eventId: event.id,
        adminToken: event.admin_token,
        custom_sections: customSections,
        welcome_message: event.welcome_message || '',
        our_story: event.our_story || '',
        dress_code: event.dress_code || '',
        travel_info: event.travel_info || '',
      });

      if (result.success && result.event) {
        setEvent(result.event as EventRecord);
        setStatusMessage('✨ Editorial narrative & CMS sections saved successfully!');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to save sections'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed to save: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  const handleTogglePlusOne = async (guest: GuestRecord) => {
    const allowed = !guest.plus_one_allowed;
    setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, plus_one_allowed: allowed } : g)));
    const result = await setGuestPlusOneAction(event.id, event.admin_token, guest.id, allowed);
    if (!result.success) {
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, plus_one_allowed: !allowed } : g)));
      setStatusMessage('Could not update the plus-one. Please try again.');
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  // Upload (file) or remove (null) the song played when guests open the invitation
  const handleSetMusic = async (file: File | null) => {
    setIsProcessingAction(true);
    setStatusMessage(file ? 'Uploading song...' : 'Removing song...');
    try {
      const formData = new FormData();
      formData.append('eventId', event.id);
      formData.append('adminToken', event.admin_token);
      if (file) formData.append('file', file);
      else formData.append('remove', 'true');
      const result = await setEventMusicAction(formData);
      if (result.success && result.event) {
        const saved = (result.event as EventRecord).custom_sections as EventCustomSections;
        setEvent((prev) => ({ ...prev, custom_sections: saved }));
        setCustomSections((prev) => ({ ...prev, music: saved?.music }));
        setStatusMessage(file ? '🎵 Song added. It plays when guests open the invitation.' : 'Song removed.');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to update music'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Failed to update music: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const [customSlugDraft, setCustomSlugDraft] = useState(event.custom_slug || '');
  const handleSaveCustomSlug = async () => {
    setIsProcessingAction(true);
    const result = await setCustomSlugAction(event.id, event.admin_token, customSlugDraft);
    setIsProcessingAction(false);
    if ('error' in result) {
      setStatusMessage(result.error);
    } else {
      setEvent((prev) => ({ ...prev, custom_slug: result.slug }));
      setCustomSlugDraft(result.slug || '');
      setStatusMessage(result.slug ? `Short link saved: /i/${result.slug}` : 'Short link removed.');
    }
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleSetInvitationMode = async (mode: 'save_the_date' | 'invitation') => {
    if ((event.invitation_mode || 'invitation') === mode) return;
    setIsProcessingAction(true);
    const result = await setInvitationModeAction(event.id, event.admin_token, mode);
    setIsProcessingAction(false);
    if ('error' in result) {
      setStatusMessage(result.error);
    } else {
      setEvent((prev) => ({ ...prev, invitation_mode: mode }));
      setStatusMessage(mode === 'save_the_date' ? 'Guests now see your save-the-date.' : 'Guests now see the full invitation.');
    }
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Meal options (stored in custom_sections.menu)
  const [menuDraft, setMenuDraft] = useState<MenuOption[]>(() => getMenuOptions(event));
  const mealCounts = guests
    .filter((g) => g.rsvp_status === 'attending')
    .reduce<Record<string, number>>((counts, g) => {
      for (const meal of [g.meal_choice, g.plus_one_name ? g.plus_one_meal : null]) {
        if (meal) counts[meal] = (counts[meal] || 0) + 1;
      }
      return counts;
    }, {});

  const handleSaveMenu = async () => {
    const options = menuDraft
      .map((o) => ({ name: o.name.trim(), description: o.description?.trim() || '' }))
      .filter((o) => o.name);
    if (new Set(options.map((o) => o.name)).size !== options.length) {
      setStatusMessage('Each meal needs a different name.');
      setTimeout(() => setStatusMessage(''), 3500);
      return;
    }
    setIsProcessingAction(true);
    setStatusMessage('Saving menu...');
    try {
      // Start from the saved sections so unsaved Editor changes aren't saved with the menu.
      const result = await updateEventCustomSectionsAction({
        eventId: event.id,
        adminToken: event.admin_token,
        custom_sections: { ...(event.custom_sections || {}), menu: { options } },
      });
      if (result.success && result.event) {
        // Only take custom_sections back, so unsaved Editor text in `event` is kept.
        setEvent((prev) => ({ ...prev, custom_sections: (result.event as EventRecord).custom_sections }));
        setCustomSections((prev) => ({ ...prev, menu: { options } }));
        setMenuDraft(options);
        setStatusMessage('✨ Menu saved. Guests now choose from these meals.');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to save menu'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed to save menu: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  // Click-to-edit on the Editor preview. Paths: event.<field>, sections.<path>, theme.<phrase>.
  const [editorDirty, setEditorDirty] = useState(false);
  // Only the invitation lines actually edited are saved, so untouched ones keep the theme's own wording.
  const [editedThemeKeys, setEditedThemeKeys] = useState<string[]>([]);
  const handlePreviewTextEdit = (path: string, value: string) => {
    const [scope, ...rest] = path.split('.');
    if (scope === 'event') {
      setEvent((prev) => ({ ...prev, [rest[0]]: value }));
    } else if (scope === 'sections') {
      setCustomSections((prev) => setAtPath(prev, rest, value));
    } else if (scope === 'theme') {
      setEvent((prev) => ({ ...prev, theme_config: { ...(prev.theme_config || {}), [rest[0]]: value } }));
      setCustomTheme((prev) => ({ ...prev, [rest[0]]: value }));
      setEditedThemeKeys((prev) => (prev.includes(rest[0]) ? prev : [...prev, rest[0]]));
    }
    setEditorDirty(true);
  };

  const handleSaveEditor = async () => {
    if (editedThemeKeys.length > 0) {
      const config = (event.theme_config || {}) as Record<string, any>;
      const result = await updateEventDesignAction({
        eventId: event.id,
        adminToken: event.admin_token,
        theme_config: Object.fromEntries(editedThemeKeys.map((key) => [key, config[key] ?? ''])),
      });
      if (!result.success) {
        setStatusMessage(`Error: ${result.error || 'Failed to save the invitation lines'}`);
        setTimeout(() => setStatusMessage(''), 3500);
        return;
      }
      setEditedThemeKeys([]);
    }
    await handleSaveCustomSections();
    setEditorDirty(false);
  };

  // Replace the whole theme. Studio designs are copied into theme_config, so later Studio edits
  // don't change an invitation the couple has already chosen.
  const handleApplyTheme = async (themeId: string, themeConfig: Record<string, any>) => {
    const base = BUILTIN_THEMES[themeId] || BUILTIN_THEMES['royal-floral'];
    setCustomTheme({ ...base, ...themeConfig });
    setIsProcessingAction(true);
    setStatusMessage('Applying design...');
    try {
      const result = await updateEventThemeAction({
        eventId: event.id,
        adminToken: event.admin_token,
        theme_id: themeId,
        theme_config: themeConfig,
      });
      if (result.success && result.event) {
        setEvent(result.event as EventRecord);
        setStatusMessage('✨ Design applied to your guest view!');
      } else {
        setStatusMessage(`Error applying design: ${result.error || 'Failed to save'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed to apply design: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  const handleApplyStudioDesign = (design: TemplateDesignRecord) => {
    const { created_at, updated_at, status, ...snapshot } = design;
    handleApplyTheme(design.slug || design.id, snapshot);
  };

  // Update Design Slot (Theme Preset or Image Slot) and persist immediately to Supabase
  const handleUpdateDesignSlot = async (
    slot: 'theme_id' | 'cover_image_url' | 'story_image_url' | 'venue_image_url',
    val: string
  ) => {
    // 1. Optimistic local state update for live mockup
    setEvent((prev) => ({ ...prev, [slot]: val }));
    if (slot === 'theme_id') {
      const base = BUILTIN_THEMES[val] || BUILTIN_THEMES['royal-floral'];
      setCustomTheme({
        ...base,
        ...(event?.theme_config && typeof event.theme_config === 'object' ? event.theme_config : {}),
      });
    }

    // 2. Persist to Supabase
    setIsProcessingAction(true);
    setStatusMessage('Saving portal design & imagery...');
    try {
      const result = await updateEventDesignAction({
        eventId: event.id,
        adminToken: event.admin_token,
        [slot]: val,
      });

      if (result.success && result.event) {
        setEvent(result.event as EventRecord);
        setStatusMessage('✨ Portal design & imagery saved to live guest view!');
      } else {
        setStatusMessage(`Error saving design: ${result.error || 'Failed to save'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed to save design: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  // Update specific theme config key (color, font, opening style, floron, phrases, etc.)
  const handleUpdateThemeConfig = async (key: string, val: any) => {
    // 1. Optimistically update local React state
    const updatedThemeConfig = {
      ...(event.theme_config && typeof event.theme_config === 'object' ? event.theme_config : {}),
      [key]: val,
    };
    setEvent((prev) => ({
      ...prev,
      theme_config: updatedThemeConfig,
    }));
    setCustomTheme((prev) => ({
      ...prev,
      [key]: val,
    }));

    // 2. Persist to Supabase
    setIsProcessingAction(true);
    setStatusMessage(`Updating ${key.replace(/_/g, ' ')}...`);
    try {
      const result = await updateEventDesignAction({
        eventId: event.id,
        adminToken: event.admin_token,
        theme_config: { [key]: val },
      });

      if (result.success && result.event) {
        setEvent(result.event as EventRecord);
        setStatusMessage('✨ Custom styling synced live to guest view!');
      } else {
        setStatusMessage(`Error saving: ${result.error || 'Failed to save'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed to save: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Explicit manual save for all portal design & imagery slots
  const handleSaveAllDesign = async () => {
    setIsProcessingAction(true);
    setStatusMessage('Saving portal design & imagery...');
    try {
      const result = await updateEventDesignAction({
        eventId: event.id,
        adminToken: event.admin_token,
        theme_id: event.theme_id,
        theme_config: event.theme_config || {},
        cover_image_url: event.cover_image_url || '',
        story_image_url: event.story_image_url || '',
        venue_image_url: event.venue_image_url || '',
      });

      if (result.success && result.event) {
        setEvent(result.event as EventRecord);
        setStatusMessage('✨ Portal design & imagery saved to live guest view!');
      } else {
        setStatusMessage(`Error saving design: ${result.error || 'Failed to save'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Failed to save design: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  // Send/Schedule/Draft Communication Campaign (Server Action)
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    const mode = newCampaignForm.dispatch_mode;
    setStatusMessage(
      mode === 'draft'
        ? 'Saving draft campaign...'
        : mode === 'schedule'
        ? 'Scheduling broadcast campaign...'
        : 'Dispatching campaign broadcast...'
    );

    try {
      const result = await sendCommunicationAction({
        eventId: event.id,
        adminToken: event.admin_token,
        name: newCampaignForm.name,
        lifecycleType: newCampaignForm.lifecycle_type,
        audience: newCampaignForm.target_audience,
        channel: newCampaignForm.channel as any,
        dispatchMode: newCampaignForm.dispatch_mode,
        subject: newCampaignForm.subject,
        emailBody: newCampaignForm.email_body,
        smsBody: newCampaignForm.sms_body,
        scheduledFor: newCampaignForm.scheduled_for || undefined,
      });

      if (result.success) {
        if (result.campaign) {
          setCampaigns((prev) => [
            result.campaign as CommunicationCampaignRecord,
            ...prev.filter((c) => c.id !== result.campaign.id),
          ]);
        }
        setNewCampaignModalOpen(false);
        setNewCampaignForm((prev) => ({
          ...prev,
          name: '',
          scheduled_for: '',
          dispatch_mode: 'send_now',
        }));

        if (result.isDraft) {
          setStatusMessage('📝 Campaign draft saved!');
        } else if (result.scheduled) {
          setStatusMessage('📅 Campaign scheduled!');
        } else {
          setStatusMessage('📨 Campaign dispatched!');
        }
      } else {
        setStatusMessage(`Error: ${result.error || 'Could not save campaign'}`);
      }
    } catch (err: any) {
      console.error('Send campaign error:', err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Dispatch an existing draft or scheduled campaign
  const handleDispatchExistingCampaign = async (campaignId: string) => {
    if (!confirm('Dispatch this broadcast campaign to all recipients now?')) return;
    setIsProcessingAction(true);
    setStatusMessage('Dispatching broadcast...');

    try {
      const result = await dispatchExistingCampaignAction({
        eventId: event.id,
        adminToken: event.admin_token,
        campaignId,
      });

      if (result.success && result.campaign) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? (result.campaign as CommunicationCampaignRecord) : c))
        );
        setStatusMessage(`🚀 Broadcast sent to ${result.sentCount} recipients!`);
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to dispatch'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Delete a campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Delete this broadcast campaign?')) return;
    try {
      const result = await deleteCampaignAction({
        eventId: event.id,
        adminToken: event.admin_token,
        campaignId,
      });
      if (result.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
        setStatusMessage('Campaign deleted.');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to delete'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  // 1-Click Broadcast SMS Reminder (Server Action)
  const handleBroadcastReminder = async () => {
    if (!confirm(`Broadcast SMS reminder to all ${pendingGuests} pending guests now?`)) return;
    setIsProcessingAction(true);
    setStatusMessage('Broadcasting reminder SMS...');

    try {
      const result = await broadcastSmsAction({
        eventId: event.id,
        adminToken: event.admin_token,
        message: `Friendly reminder from ${event.couple_names}: Please let us know if you can celebrate with us by ${new Date(event.rsvp_deadline).toLocaleDateString('en-US', { timeZone: 'UTC' })} at {{portal_link}}`,
      });

      if (result.success) {
        setStatusMessage(`📲 Reminder sent to ${result.sentCount || pendingGuests} guests!`);
      } else {
        setStatusMessage(`Broadcast error: ${result.error}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Delete Photo (Server Action - DB + Storage Bucket)
  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to remove this photo?')) return;
    try {
      const result = await deletePhotoAction({
        photoId,
        eventId: event.id,
        adminToken: event.admin_token,
      });
      if (result.success) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setStatusMessage('Photo removed from stream.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  // Add Registry Item (Server Action)
  const handleCreateRegistryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const result = await manageRegistryItemAction({
        action: 'save',
        eventId: event.id,
        adminToken: event.admin_token,
        title: newRegistryForm.title,
        description: newRegistryForm.description || '',
        is_cash_fund: newRegistryForm.is_cash_fund,
        target_amount: newRegistryForm.is_cash_fund ? Number(newRegistryForm.target_amount) : undefined,
        external_url: !newRegistryForm.is_cash_fund ? newRegistryForm.external_url : undefined,
      });

      if (result.success) {
        const newItem: RegistryItemRecord = {
          id: 'reg_' + Math.random().toString(36).substring(2, 9),
          event_id: event.id,
          title: newRegistryForm.title,
          description: newRegistryForm.description || '',
          is_cash_fund: newRegistryForm.is_cash_fund,
          target_amount: newRegistryForm.is_cash_fund ? Number(newRegistryForm.target_amount) : null,
          current_amount: 0,
          external_url: !newRegistryForm.is_cash_fund ? newRegistryForm.external_url : null,
          display_order: registry.length + 1,
          created_at: new Date().toISOString(),
        };
        setRegistry((prev) => [...prev, newItem]);
        setNewRegistryModalOpen(false);
        setNewRegistryForm({
          title: '',
          description: '',
          is_cash_fund: true,
          target_amount: 1000,
          external_url: '',
        });
        setStatusMessage('🎁 Registry item created!');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  // Delete Registry Item (Server Action)
  const handleDeleteRegistryItem = async (itemId: string) => {
    if (!confirm('Remove this registry item?')) return;
    try {
      const result = await manageRegistryItemAction({
        action: 'delete',
        eventId: event.id,
        adminToken: event.admin_token,
        itemId,
      });
      if (result.success) {
        setRegistry((prev) => prev.filter((r) => r.id !== itemId));
        setStatusMessage('Registry item removed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  // Schedule Event Handlers (Server Action)
  const handleOpenCreateSchedule = () => {
    setEditingScheduleItem(null);
    setScheduleForm({
      title: '',
      location_name: '',
      start_time: `${event.wedding_date}T15:00`,
      end_time: `${event.wedding_date}T18:00`,
      description: '',
      dress_code: '',
      is_vip_only: false,
      requires_rsvp: true,
      display_order: schedule.length + 1,
    });
    setScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (item: ScheduleItemRecord) => {
    setEditingScheduleItem(item);
    setScheduleForm({
      title: item.title,
      location_name: item.location_name || '',
      start_time: item.start_time ? item.start_time.slice(0, 16) : '',
      end_time: item.end_time ? item.end_time.slice(0, 16) : '',
      description: item.description || '',
      dress_code: item.dress_code || '',
      is_vip_only: item.is_vip_only,
      requires_rsvp: item.requires_rsvp,
      display_order: item.display_order || 0,
    });
    setScheduleModalOpen(true);
  };

  const handleSaveScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const result = await manageScheduleItemAction({
        action: 'save',
        eventId: event.id,
        adminToken: event.admin_token,
        itemId: editingScheduleItem?.id,
        title: scheduleForm.title,
        location_name: scheduleForm.location_name,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time || undefined,
        description: scheduleForm.description,
        dress_code: scheduleForm.dress_code,
        is_vip_only: scheduleForm.is_vip_only,
        requires_rsvp: scheduleForm.requires_rsvp,
        display_order: Number(scheduleForm.display_order) || 0,
      });

      if (result.success) {
        if (result.item) {
          if (editingScheduleItem) {
            setSchedule((prev) => prev.map((s) => (s.id === editingScheduleItem.id ? result.item : s)));
          } else {
            setSchedule((prev) => [...prev, result.item]);
          }
        } else {
          const updatedSchedule = await refreshRows('schedule_items');
          if (updatedSchedule) setSchedule(updatedSchedule as ScheduleItemRecord[]);
        }
        setScheduleModalOpen(false);
        setStatusMessage(editingScheduleItem ? '✅ Itinerary event updated!' : '🎉 Itinerary event added!');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to save schedule event'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  const handleDeleteScheduleItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this schedule event?')) return;
    try {
      const result = await manageScheduleItemAction({
        action: 'delete',
        eventId: event.id,
        adminToken: event.admin_token,
        itemId,
      });

      if (result.success) {
        setSchedule((prev) => prev.filter((s) => s.id !== itemId));
        setStatusMessage('Event removed from itinerary.');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to delete event'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  // Custom Question Handlers (Server Action)
  const handleOpenCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      prompt: '',
      question_type: 'text',
      options_str: '',
      is_required: false,
    });
    setQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: CustomRsvpQuestionRecord) => {
    setEditingQuestion(q);
    setQuestionForm({
      prompt: q.prompt,
      question_type: q.question_type,
      options_str: (q.options || []).join(', '),
      is_required: q.is_required,
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const result = await manageCustomQuestionAction({
        action: 'save',
        eventId: event.id,
        adminToken: event.admin_token,
        questionId: editingQuestion?.id,
        prompt: questionForm.prompt,
        question_type: questionForm.question_type,
        options: questionForm.options_str,
        is_required: questionForm.is_required,
      });

      if (result.success) {
        const updatedQuestions = await refreshRows('custom_rsvp_questions');
        if (updatedQuestions) setQuestions(updatedQuestions as CustomRsvpQuestionRecord[]);
        setQuestionModalOpen(false);
        setStatusMessage(editingQuestion ? '✅ Question updated!' : '🎉 Question added!');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to save question'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Remove this custom RSVP question?')) return;
    try {
      const result = await manageCustomQuestionAction({
        action: 'delete',
        eventId: event.id,
        adminToken: event.admin_token,
        questionId,
      });
      if (result.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        setStatusMessage('Question removed.');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to delete question'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  // Planning Task Handlers (Server Action)
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      category: 'General',
      owner: 'Couple',
      due_date: '',
      status: 'todo',
      priority: 'medium',
      display_order: tasks.length + 1,
    });
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: PlanningTaskRecord) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      category: task.category || 'General',
      owner: task.owner || 'Couple',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      display_order: task.display_order || 1,
    });
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const result = await managePlanningTaskAction({
        action: 'save',
        eventId: event.id,
        adminToken: event.admin_token,
        taskId: editingTask?.id,
        title: taskForm.title,
        category: taskForm.category,
        owner: taskForm.owner,
        due_date: taskForm.due_date || undefined,
        status: taskForm.status,
        priority: taskForm.priority,
        display_order: Number(taskForm.display_order) || 1,
      });

      if (result.success) {
        if (result.task) {
          if (editingTask) {
            setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? result.task : t)));
          } else {
            setTasks((prev) => [...prev, result.task]);
          }
        } else {
          const updatedTasks = await refreshRows('planning_tasks');
          if (updatedTasks) setTasks(updatedTasks as PlanningTaskRecord[]);
        }
        setTaskModalOpen(false);
        setStatusMessage(editingTask ? '✅ Task updated!' : '🎉 Task created!');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to save task'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setStatusMessage(''), 3500);
    }
  };

  const handleToggleTaskStatus = async (task: PlanningTaskRecord) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
      const result = await managePlanningTaskAction({
        action: 'toggle_status',
        eventId: event.id,
        adminToken: event.admin_token,
        taskId: task.id,
        status: nextStatus,
      });
      if (!result.success) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Remove this planning task?')) return;
    try {
      const result = await managePlanningTaskAction({
        action: 'delete',
        eventId: event.id,
        adminToken: event.admin_token,
        taskId,
      });
      if (result.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setStatusMessage('Task removed.');
      } else {
        setStatusMessage(`Error: ${result.error || 'Failed to delete task'}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message}`);
    } finally {
      setTimeout(() => setStatusMessage(''), 2500);
    }
  };

  // Export Guests to CSV
  const handleExportCsv = () => {
    const exportData = guests.map((g) => ({
      'First Name': g.first_name,
      'Last Name': g.last_name || '',
      Email: g.email || '',
      Phone: g.phone || '',
      VIP: g.is_vip ? 'YES' : 'NO',
      'Party Name': g.party_name || '',
      'RSVP Status': g.rsvp_status,
      'Meal Choice': g.meal_choice || '',
      'Dietary Notes': g.dietary_notes || '',
      'Plus One Allowed': g.plus_one_allowed ? 'YES' : 'NO',
      'Plus One Name': g.plus_one_name || '',
      'Portal Link': `${window.location.origin}/g/${g.access_token}`,
    }));

    const csv = Papa.unparse(exportData, { escapeFormulae: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AisleFlow_GuestList_${event.slug}.csv`;
    a.click();
  };

  // Caterer list: one row per attending person, plus-ones included
  const handleExportCatererCsv = () => {
    const rows = guests
      .filter((g) => g.rsvp_status === 'attending')
      .flatMap((g) => {
        const guestRow = {
          Name: `${g.first_name} ${g.last_name || ''}`.trim(),
          Party: g.party_name || '',
          Meal: g.meal_choice || '',
          'Dietary Tags': (g.dietary_tags || []).join(', '),
          'Dietary Notes': g.dietary_notes || '',
          'Guest Of': '',
        };
        if (!g.plus_one_name) return [guestRow];
        return [
          guestRow,
          {
            Name: g.plus_one_name,
            Party: g.party_name || '',
            Meal: g.plus_one_meal || '',
            'Dietary Tags': '',
            'Dietary Notes': '',
            'Guest Of': guestRow.Name,
          },
        ];
      });

    const csv = Papa.unparse(rows, { escapeFormulae: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AisleFlow_Caterer_${event.slug}.csv`;
    a.click();
  };

  // Two-Way SMS Inbound Simulator
  const handleSimulateInboundSms = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedGuest = guests.find(
      (g) => g.phone === smsSimulatorPhone || g.phone?.replace(/\D/g, '') === smsSimulatorPhone.replace(/\D/g, '')
    ) || guests[0];

    const bodyUpper = smsSimulatorMessage.trim().toUpperCase();
    let newStatus: 'attending' | 'declined' | 'pending' = 'pending';
    let replyText = '';

    if (bodyUpper.includes('YES') || bodyUpper.includes('ATTENDING') || bodyUpper.includes('CONFIRM')) {
      newStatus = 'attending';
      replyText = `Thank you ${matchedGuest?.first_name}! You are confirmed as ATTENDING for ${event.couple_names}'s wedding. Open your portal for details: ${window.location.origin}/g/${matchedGuest?.access_token}`;
    } else if (bodyUpper.includes('NO') || bodyUpper.includes('DECLINE') || bodyUpper.includes('CANNOT')) {
      newStatus = 'declined';
      replyText = `Thank you for letting us know, ${matchedGuest?.first_name}. We will miss you at ${event.couple_names}'s celebration!`;
    } else {
      replyText = `Hi ${matchedGuest?.first_name}! Reply 'YES' to confirm attending or 'NO' if declining. Or open your private portal: ${window.location.origin}/g/${matchedGuest?.access_token}`;
    }

    if (matchedGuest) {
      await setGuestRsvpStatusAction(event.id, event.admin_token, matchedGuest.id, newStatus);
      setGuests((prev) =>
        prev.map((g) => (g.id === matchedGuest.id ? { ...g, rsvp_status: newStatus } : g))
      );
    }

    setSmsSimulatorLog((prev) => [
      ...prev,
      { sender: 'GUEST', text: smsSimulatorMessage, time: new Date().toLocaleTimeString() },
      { sender: 'AISLEFLOW (Twilio)', text: replyText, time: new Date().toLocaleTimeString() },
    ]);
    setSmsSimulatorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-aisle-ink flex flex-col selection:bg-aisle-terracotta selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-aisle-border bg-white/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-editorial text-2xl font-semibold text-aisle-charcoal">
              Aisle<span className="italic text-aisle-terracotta">Flow</span>
            </Link>
            <span className="rounded-full bg-aisle-sand px-2.5 py-0.5 text-xs font-semibold text-aisle-charcoal">
              Admin Suite
            </span>
            <span className="text-xs text-aisle-muted hidden sm:inline-block">
              · {event.couple_names}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenTableCard}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-aisle-border bg-white px-3.5 py-1.5 text-xs font-medium text-aisle-charcoal hover:bg-aisle-sand shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 text-aisle-terracotta" />
              <span>Print Table QR Cards</span>
            </button>
            <Link
              href={`/g/${guests[0]?.access_token || event.admin_token}?preview=1`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-aisle-terracotta transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Live Guest View</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6">
        {/* Top Tab Bar */}
        <nav
          role="tablist"
          aria-label="Admin sections"
          className="sticky top-[69px] z-20 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-aisle-border bg-white/95 p-1 shadow-sm backdrop-blur-md select-none"
        >
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'setup', label: 'Setup', icon: Settings },
            { id: 'guests', label: 'Guests', icon: Users, badge: totalGuests },
            { id: 'communications', label: 'Comms', icon: Send },
            { id: 'builder', label: 'Builder', icon: Palette },
            { id: 'copy', label: 'Editor', icon: Edit3 },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'questions', label: 'RSVP Qs', icon: HelpCircle },
            { id: 'registry', label: 'Registry', icon: Gift },
            { id: 'photos', label: 'Photos', icon: Camera, badge: photos.length },
            { id: 'seating', label: 'Seating', icon: LayoutGrid },
            { id: 'planning', label: 'Plan', icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aisle-terracotta ${
                  isActive
                    ? 'bg-aisle-charcoal text-white font-semibold shadow-sm'
                    : 'text-aisle-warm hover:bg-aisle-sand/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-aisle-gold-light' : 'text-aisle-muted'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 text-xs font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-aisle-sand text-aisle-charcoal'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          {statusMessage && (
            <div
              className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between transition-all ${
                statusMessage.toLowerCase().includes('error') || statusMessage.toLowerCase().includes('failed')
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              <span>{statusMessage}</span>
              <button
                onClick={() => setStatusMessage('')}
                className="opacity-70 hover:opacity-100 cursor-pointer ml-3"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-aisle-border bg-white p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-aisle-muted">
                    Total Invited
                  </span>
                  <p className="font-editorial text-3xl font-semibold text-aisle-charcoal mt-1">
                    {totalGuests}
                  </p>
                  <span className="text-xs text-aisle-muted">across all parties</span>
                </div>

                <div className="rounded-2xl border border-aisle-border bg-white p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Attending
                  </span>
                  <p className="font-editorial text-3xl font-semibold text-emerald-700 mt-1">
                    {attendingGuests}
                  </p>
                  <span className="text-xs text-emerald-600">
                    {totalGuests ? Math.round((attendingGuests / totalGuests) * 100) : 0}% confirmed
                  </span>
                </div>

                <div className="rounded-2xl border border-aisle-border bg-white p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                    Declined
                  </span>
                  <p className="font-editorial text-3xl font-semibold text-rose-700 mt-1">
                    {declinedGuests}
                  </p>
                  <span className="text-xs text-rose-600">regretfully declined</span>
                </div>

                <div className="rounded-2xl border border-aisle-border bg-white p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-aisle-gold-deep">
                    Gifts & Cash Raised
                  </span>
                  <p className="font-editorial text-3xl font-semibold text-aisle-gold-deep mt-1">
                    ${totalRaised}
                  </p>
                  <span className="text-xs text-aisle-muted">honeymoon contributions</span>
                </div>
              </div>

              {/* Publish readiness */}
              <PublishReadinessPanel
                event={event}
                counts={readinessCounts}
                onNavigate={setActiveTab}
                onEventChange={setEvent}
              />

              <PlanCard event={event} onPlanChange={(plan) => setEvent((prev) => ({ ...prev, plan }))} />

              {/* Sample Guest Links for Instant Testing */}
              <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-lg font-semibold text-aisle-charcoal">
                  Instant Guest Testing Links
                </h3>
                <p className="text-xs text-aisle-muted">
                  Click any test guest below to experience their private tokenized portal:
                </p>

                <div className="space-y-2">
                  {guests.slice(0, 4).map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-xl border border-aisle-border/80 bg-[#FAF7F2] p-3 text-xs"
                    >
                      <div>
                        <strong className="text-aisle-charcoal">{g.first_name} {g.last_name || ''}</strong>
                        {g.is_vip && <span className="ml-2 text-xs text-aisle-gold-deep font-semibold">VIP</span>}
                        {g.party_name && <span className="ml-2 text-xs text-aisle-muted">({g.party_name})</span>}
                        <p className="text-xs text-aisle-muted font-mono">/g/{g.access_token}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/g/${g.access_token}`, g.id)}
                          className="rounded-lg border border-aisle-border bg-white p-1.5 text-aisle-charcoal hover:bg-aisle-sand"
                        >
                          {copiedLink === g.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <Link
                          href={`/g/${g.access_token}?preview=1`}
                          target="_blank"
                          className="rounded-lg bg-aisle-charcoal px-3 py-1.5 text-white font-medium hover:bg-aisle-terracotta text-xs"
                        >
                          Open Portal
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SETUP WIZARD */}
          {activeTab === 'setup' && (
            <div className="space-y-6">
            <PublishReadinessPanel
              event={event}
              counts={readinessCounts}
              onNavigate={setActiveTab}
              onEventChange={setEvent}
            />

            <DesignServiceCard event={event} />

            {/* Custom short link (Premium) */}
            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-3 text-xs">
              <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
                Short link
                <span className="ml-2 rounded-full bg-aisle-gold/20 px-2 py-0.5 text-xs font-bold text-aisle-gold-deep align-middle">Premium</span>
              </h3>
              <p className="text-aisle-muted">
                A readable public link to your published invitation, for social media or printed cards. It has no RSVP; guests reply with their personal link.
              </p>
              {hasFeature(event, 'custom_url') ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveCustomSlug();
                  }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="text-aisle-muted">Your link: /i/</span>
                  <input
                    value={customSlugDraft}
                    onChange={(e) => setCustomSlugDraft(e.target.value)}
                    placeholder="sarah-and-james"
                    aria-label="Short link"
                    maxLength={60}
                    className="flex-1 min-w-[160px] rounded-xl border border-aisle-border px-3 py-2.5 focus:outline-none focus:border-aisle-terracotta"
                  />
                  <button type="submit" disabled={isProcessingAction} className="min-h-[44px] rounded-full bg-aisle-charcoal px-4 font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer">
                    Save link
                  </button>
                  {event.custom_slug && (
                    <a href={`/i/${event.custom_slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-aisle-terracotta underline">
                      Open
                    </a>
                  )}
                </form>
              ) : (
                <p className="text-aisle-muted">{featureError('custom_url')}</p>
              )}
              {event.custom_slug && !event.is_live && (
                <p className="text-amber-700">The link works once your invitation is published.</p>
              )}
            </div>

            {/* Save-the-date mode (Premium) */}
            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-4 text-xs">
              <div>
                <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
                  What guests see
                  <span className="ml-2 rounded-full bg-aisle-gold/20 px-2 py-0.5 text-xs font-bold text-aisle-gold-deep align-middle">Premium</span>
                </h3>
                <p className="text-aisle-muted mt-1">
                  Send a save-the-date first, then switch the same links to the full invitation when you are ready.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="What guests see">
                {([
                  { mode: 'save_the_date', label: 'Save the date', desc: 'Names, date, place and a countdown' },
                  { mode: 'invitation', label: 'Full invitation', desc: 'Everything, including RSVP' },
                ] as const).map((option) => {
                  const selected = (event.invitation_mode || 'invitation') === option.mode;
                  const locked = option.mode === 'save_the_date' && !hasFeature(event, 'save_the_date');
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={locked || isProcessingAction}
                      onClick={() => handleSetInvitationMode(option.mode)}
                      className={`min-h-[44px] rounded-2xl border p-3 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected ? 'border-aisle-terracotta bg-aisle-sand/50' : 'border-aisle-border hover:bg-aisle-sand/20'
                      }`}
                    >
                      <strong className="block text-aisle-charcoal">{option.label}</strong>
                      <span className="text-aisle-muted">{locked ? featureError('save_the_date') : option.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-3xl border border-aisle-border bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Wedding Setup Wizard</h3>
                <p className="text-xs text-aisle-muted mt-0.5">
                  Configure wedding event parameters and RSVP deadline rules
                </p>
              </div>

              <form onSubmit={handleSaveSetup} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-aisle-warm mb-1">Couple Display Names</label>
                    <input
                      type="text"
                      value={setupForm.couple_names}
                      onChange={(e) => setSetupForm({ ...setupForm, couple_names: e.target.value })}
                      required
                      className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-aisle-warm mb-1">Admin Contact Email</label>
                    <input
                      type="email"
                      value={setupForm.admin_email}
                      onChange={(e) => setSetupForm({ ...setupForm, admin_email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-aisle-warm mb-1">Wedding Date</label>
                    <input
                      type="date"
                      value={setupForm.wedding_date}
                      onChange={(e) => setSetupForm({ ...setupForm, wedding_date: e.target.value })}
                      required
                      className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-aisle-warm mb-1">RSVP Deadline</label>
                    <input
                      type="date"
                      value={setupForm.rsvp_deadline}
                      onChange={(e) => setSetupForm({ ...setupForm, rsvp_deadline: e.target.value })}
                      required
                      className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-aisle-warm mb-1">Venue Name</label>
                    <input
                      type="text"
                      value={setupForm.venue_name}
                      onChange={(e) => setSetupForm({ ...setupForm, venue_name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-aisle-warm mb-1">Venue Address</label>
                    <input
                      type="text"
                      value={setupForm.venue_address}
                      onChange={(e) => setSetupForm({ ...setupForm, venue_address: e.target.value })}
                      required
                      className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="allow_late"
                    checked={setupForm.allow_late_rsvp}
                    onChange={(e) => setSetupForm({ ...setupForm, allow_late_rsvp: e.target.checked })}
                    className="h-4 w-4 rounded border-aisle-border text-aisle-terracotta focus:ring-0"
                  />
                  <label htmlFor="allow_late" className="font-medium text-aisle-warm">
                    Allow late RSVP changes after the deadline has passed
                  </label>
                </div>

                <div>
                  <label htmlFor="language" className="block font-medium text-aisle-warm mb-1">Invitation language</label>
                  <select
                    id="language"
                    value={setupForm.language || 'en'}
                    onChange={(e) => setSetupForm({ ...setupForm, language: e.target.value })}
                    className="w-full sm:w-64 rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                  >
                    {Object.entries(PORTAL_LANGUAGES).map(([code, lang]) => (
                      <option key={code} value={code}>{lang.label}</option>
                    ))}
                  </select>
                  <p className="text-aisle-muted mt-1">Buttons, headings and the RSVP steps guests see. Text you write yourself is shown as you wrote it.</p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="rsvp_locked"
                    checked={!!setupForm.rsvp_locked}
                    onChange={(e) => setSetupForm({ ...setupForm, rsvp_locked: e.target.checked })}
                    className="h-4 w-4 rounded border-aisle-border text-aisle-terracotta focus:ring-0"
                  />
                  <label htmlFor="rsvp_locked" className="font-medium text-aisle-warm">
                    Close RSVPs now (guests can still view the invitation but can't reply or change their answer)
                  </label>
                </div>

                <div>
                  <label className="block font-medium text-aisle-warm mb-1">Internal Launch Notes</label>
                  <textarea
                    rows={3}
                    value={setupForm.launch_notes || ''}
                    onChange={(e) => setSetupForm({ ...setupForm, launch_notes: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-aisle-charcoal px-6 py-2.5 font-semibold text-white hover:bg-aisle-terracotta transition-colors uppercase tracking-wider text-xs"
                >
                  Save Setup
                </button>
              </form>
            </div>
            </div>
          )}

          {/* TAB 3: GUEST REGISTRY */}
          {activeTab === 'guests' && (
            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Guest Registry</h3>
                  <p className="text-xs text-aisle-muted mt-0.5">
                    Manage tokenized links, party groupings, VIP tags, and dietary requirements
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNewGuestModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Guest</span>
                  </button>
                  <button
                    onClick={() => setCsvImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-aisle-border bg-white px-3.5 py-2 text-xs font-medium text-aisle-charcoal hover:bg-aisle-sand cursor-pointer transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-aisle-terracotta" />
                    <span>Import CSV</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 rounded-full border border-aisle-border bg-white px-3.5 py-2 text-xs font-medium text-aisle-charcoal hover:bg-aisle-sand cursor-pointer transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Search & Action Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-aisle-muted" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, tag..."
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    className="w-full rounded-xl border border-aisle-border pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <select
                  value={guestFilterStatus}
                  onChange={(e) => setGuestFilterStatus(e.target.value)}
                  className="rounded-xl border border-aisle-border px-3 py-2 text-xs bg-white text-aisle-warm"
                >
                  <option value="all">All RSVP Statuses</option>
                  <option value="attending">Attending</option>
                  <option value="declined">Declined</option>
                  <option value="pending">Pending</option>
                  <option value="vip">VIP Guests</option>
                  <option value="party">Grouped in Party ({existingParties.length} parties)</option>
                  <option value="unassigned">Individual (Ungrouped)</option>
                </select>

                {selectedGuestIds.length >= 2 && (
                  <button
                    onClick={handleOpenGroupModal}
                    className="rounded-xl bg-aisle-gold px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-aisle-gold-deep cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Group into Party ({selectedGuestIds.length})</span>
                  </button>
                )}
              </div>

              {/* Guests Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-aisle-border bg-[#FAF7F2]/60 text-aisle-muted font-medium">
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedGuestIds.length === guests.length && guests.length > 0}
                          onChange={(e) =>
                            setSelectedGuestIds(e.target.checked ? guests.map((g) => g.id) : [])
                          }
                          className="rounded border-aisle-border"
                        />
                      </th>
                      <th className="p-3">Guest Name & Party</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Meal / Dietary</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-aisle-border/60">
                    {guests
                      .filter((g) => {
                        if (guestFilterStatus === 'attending') return g.rsvp_status === 'attending';
                        if (guestFilterStatus === 'declined') return g.rsvp_status === 'declined';
                        if (guestFilterStatus === 'pending') return g.rsvp_status === 'pending';
                        if (guestFilterStatus === 'vip') return g.is_vip;
                        if (guestFilterStatus === 'party') return Boolean(g.party_id || (g as any).household_id);
                        if (guestFilterStatus === 'unassigned') return !g.party_id && !(g as any).household_id;
                        return true;
                      })
                      .filter((g) => {
                        const s = guestSearch.toLowerCase();
                        return (
                          g.first_name.toLowerCase().includes(s) ||
                          (g.last_name && g.last_name.toLowerCase().includes(s)) ||
                          (g.email && g.email.toLowerCase().includes(s)) ||
                          (g.party_name && g.party_name.toLowerCase().includes(s))
                        );
                      })
                      .map((guest) => {
                        const isSelected = selectedGuestIds.includes(guest.id);
                        const partyId = guest.party_id || (guest as any).household_id;
                        const matchingParty = existingParties.find((p) => p.id === partyId);
                        return (
                          <tr key={guest.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  setSelectedGuestIds((prev) =>
                                    e.target.checked
                                      ? [...prev, guest.id]
                                      : prev.filter((id) => id !== guest.id)
                                  );
                                }}
                                className="rounded border-aisle-border"
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-aisle-charcoal">
                                {guest.first_name} {guest.last_name || ''}
                                {guest.is_vip && (
                                  <span className="ml-2 rounded-full bg-aisle-gold/20 px-2 py-0.5 text-xs font-bold text-aisle-gold-deep">
                                    VIP
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePlusOne(guest)}
                                  title={guest.plus_one_allowed ? 'Remove plus-one' : 'Allow a plus-one'}
                                  aria-pressed={!!guest.plus_one_allowed}
                                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold border cursor-pointer ${
                                    guest.plus_one_allowed
                                      ? 'border-aisle-terracotta bg-aisle-terracotta/10 text-aisle-terracotta'
                                      : 'border-dashed border-aisle-border text-aisle-muted hover:text-aisle-charcoal'
                                  }`}
                                >
                                  +1
                                </button>
                              </div>
                              {partyId && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenManageParty(partyId)}
                                    title="Click to manage this household party"
                                    className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 border border-amber-200/80 hover:bg-amber-100/80 transition-colors cursor-pointer group shadow-xs"
                                  >
                                    <Users className="h-2.5 w-2.5 text-amber-700" />
                                    <span>{guest.party_name || matchingParty?.name || 'Household Party'}</span>
                                    <span className="text-xs text-amber-700 font-bold ml-0.5">
                                      ({matchingParty?.members.length || 2})
                                    </span>
                                    <Edit2 className="h-2 w-2 opacity-50 group-hover:opacity-100 ml-0.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGuestFromParty(guest.id)}
                                    title="Unlink from household party"
                                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                                  >
                                    (unlink)
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-aisle-muted">
                              <div>{guest.phone || '—'}</div>
                              <div className="text-xs">{guest.email || ''}</div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  guest.rsvp_status === 'attending'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : guest.rsvp_status === 'declined'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {guest.rsvp_status}
                              </span>
                              <span
                                className="block mt-1 text-xs text-aisle-muted"
                                title={guest.last_viewed_at ? `Last opened ${new Date(guest.last_viewed_at).toLocaleString()}` : undefined}
                              >
                                {guest.view_count ? `Opened ${guest.view_count}×` : 'Not opened'}
                              </span>
                            </td>
                            <td className="p-3 text-aisle-warm">
                              <div>{guest.meal_choice || '—'}</div>
                              {guest.dietary_notes && (
                                <span className="text-xs text-rose-700 block">{guest.dietary_notes}</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenGuestQr(guest)}
                                  title="View QR Code"
                                  className="rounded-lg border border-aisle-border p-1.5 hover:bg-aisle-sand cursor-pointer"
                                >
                                  <QrCode className="h-3.5 w-3.5 text-aisle-charcoal" />
                                </button>
                                <a
                                  href={whatsappShareUrl(guest, event, `${window.location.origin}/g/${guest.access_token}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Send link on WhatsApp"
                                  aria-label={`Send ${guest.first_name}'s link on WhatsApp`}
                                  className="rounded-lg border border-aisle-border p-1.5 hover:bg-emerald-50 text-aisle-charcoal hover:text-emerald-700"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  onClick={() => copyToClipboard(`${window.location.origin}/g/${guest.access_token}`, guest.id)}
                                  title="Copy Guest Link"
                                  className="rounded-lg border border-aisle-border p-1.5 hover:bg-aisle-sand cursor-pointer"
                                >
                                  {copiedLink === guest.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-aisle-charcoal" />}
                                </button>
                                <button
                                  onClick={() => handleRotateToken(guest.id)}
                                  title="Rotate Access Token"
                                  className="rounded-lg border border-aisle-border p-1.5 hover:bg-aisle-sand text-aisle-muted hover:text-amber-700 cursor-pointer"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGuest(guest.id)}
                                  title="Delete Guest"
                                  className="rounded-lg border border-aisle-border p-1.5 hover:bg-rose-50 text-aisle-muted hover:text-rose-700 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COMMUNICATIONS */}
          {activeTab === 'communications' && (
            <div className="space-y-6">
              {!event.is_live && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-xs text-amber-900">
                  <span>Your event is a draft. Publish it before sending messages to guests. You can still save drafts and schedule campaigns.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="min-h-[44px] rounded-full bg-amber-900 px-4 font-semibold text-white hover:bg-amber-800"
                  >
                    Go to Publish
                  </button>
                </div>
              )}
              <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
                      Communications Center & Twilio SMS
                    </h3>
                    <p className="text-xs text-aisle-muted mt-0.5">
                      Send personalized invitations, Save-the-Dates, and reminder campaigns
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBroadcastReminder}
                      disabled={isProcessingAction || !smsAllowed}
                      title={smsAllowed ? undefined : featureError('sms')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5 text-amber-700" />
                      <span>1-Click SMS Reminder ({pendingGuests} Pending)</span>
                    </button>
                    <button
                      onClick={() => setNewCampaignModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Broadcast</span>
                    </button>
                  </div>
                </div>

                {/* Templates Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-aisle-muted">
                      Standard Communication Templates ({templates.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenNewTemplate}
                      className="text-xs font-semibold text-aisle-terracotta hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Custom Template</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="rounded-2xl border border-aisle-border bg-[#FAF7F2]/50 p-4 space-y-3 flex flex-col justify-between hover:border-aisle-charcoal/40 transition-colors shadow-2xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-aisle-charcoal flex items-center gap-1.5">
                              <span>{tpl.name}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-full bg-aisle-sand px-2 py-0.5 text-xs uppercase font-bold text-aisle-muted">
                                {tpl.lifecycle_type}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditTemplate(tpl)}
                                title="Edit this communication template"
                                className="inline-flex items-center gap-1 rounded-lg border border-aisle-border bg-white px-2 py-1 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand hover:text-aisle-terracotta cursor-pointer transition-colors shadow-2xs"
                              >
                                <Edit2 className="h-2.5 w-2.5 text-aisle-terracotta" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-aisle-muted line-clamp-3 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-aisle-border/60 font-mono text-xs">
                            {tpl.sms_body || tpl.email_body}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-aisle-border/40 text-xs text-aisle-muted">
                          <span className="capitalize">{tpl.channel} channel</span>
                          <button
                            type="button"
                            onClick={() => handleUseTemplateInBroadcast(tpl)}
                            className="font-semibold text-aisle-charcoal hover:text-aisle-terracotta hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Use in Broadcast</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Broadcast Campaigns Ledger (Drafts, Scheduled & Dispatched) */}
                <div className="space-y-3 pt-3 border-t border-aisle-border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-semibold text-aisle-charcoal">
                      Broadcast Campaigns & Delivery Ledger
                    </h4>
                    <span className="text-xs text-aisle-muted">
                      {campaigns.length} total campaigns
                    </span>
                  </div>

                  {campaigns.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-aisle-border p-6 text-center text-xs text-aisle-muted">
                      No campaigns created yet. Click "Create Broadcast" to compose your first message or save a draft.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {campaigns.map((camp) => (
                        <div
                          key={camp.id}
                          className="rounded-2xl border border-aisle-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#FAF7F2]/40"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <strong className="text-aisle-charcoal text-sm font-semibold">{camp.name}</strong>
                              <span
                                className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                                  camp.status === 'completed' || camp.status === 'sent'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : camp.status === 'scheduled'
                                    ? 'bg-sky-100 text-sky-800'
                                    : camp.status === 'draft'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {camp.status === 'completed' || camp.status === 'sent'
                                  ? '✓ Sent'
                                  : camp.status === 'scheduled'
                                  ? '📅 Scheduled'
                                  : camp.status === 'draft'
                                  ? '📝 Draft'
                                  : '⏳ Sending'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-aisle-muted">
                              <span>Target: <strong className="text-aisle-charcoal">{camp.target_audience}</strong></span>
                              <span>·</span>
                              <span>Channel: <strong className="text-aisle-charcoal">{camp.channel.toUpperCase()}</strong></span>
                              {camp.scheduled_for && (
                                <>
                                  <span>·</span>
                                  <span>Scheduled for: {new Date(camp.scheduled_for).toLocaleString()}</span>
                                </>
                              )}
                              {camp.sent_at && (
                                <>
                                  <span>·</span>
                                  <span>Sent at: {new Date(camp.sent_at).toLocaleString()}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {(camp.status === 'draft' || camp.status === 'scheduled') && (
                              <button
                                type="button"
                                disabled={isProcessingAction}
                                onClick={() => handleDispatchExistingCampaign(camp.id)}
                                className="inline-flex items-center gap-1 rounded-xl bg-aisle-charcoal px-3 py-1.5 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-xs transition-all"
                              >
                                <span>🚀 Send Now</span>
                              </button>
                            )}
                            {(camp.status === 'completed' || camp.status === 'sent') && (
                              <button
                                type="button"
                                disabled={isProcessingAction}
                                onClick={() => handleDispatchExistingCampaign(camp.id)}
                                className="inline-flex items-center gap-1 rounded-xl border border-aisle-border bg-white px-2.5 py-1.5 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand cursor-pointer transition-all"
                              >
                                <span>Send Again</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="rounded-xl border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Delete Campaign"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Two-Way SMS Interactive Simulator */}
              <div className="rounded-3xl border-2 border-aisle-gold/50 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-aisle-gold-deep" />
                  <h4 className="font-serif text-base font-semibold text-aisle-charcoal">
                    Two-Way SMS Webhook Simulator
                  </h4>
                </div>
                <p className="text-xs text-aisle-muted">
                  Test inbound guest SMS replies (e.g. sending <strong>YES</strong> or <strong>NO</strong>). The webhook matches the guest by phone number and updates their RSVP in real time.
                </p>

                <form onSubmit={handleSimulateInboundSms} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Guest message (e.g. YES, NO)"
                    value={smsSimulatorMessage}
                    onChange={(e) => setSmsSimulatorMessage(e.target.value)}
                    required
                    className="flex-1 rounded-xl border border-aisle-border px-3 py-2 text-xs focus:outline-none focus:border-aisle-terracotta"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer"
                  >
                    Simulate Inbound SMS
                  </button>
                </form>

                {smsSimulatorLog.length > 0 && (
                  <div className="rounded-xl border border-aisle-border bg-[#FAF7F2] p-3 space-y-2 text-xs max-h-48 overflow-y-auto font-mono">
                    {smsSimulatorLog.map((log, i) => (
                      <div key={i} className={`p-1.5 rounded-lg ${log.sender === 'GUEST' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
                        <span className="font-bold">[{log.time}] {log.sender}:</span> {log.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PORTAL BUILDER WITH LIVE PHONE PREVIEW */}
          {activeTab === 'builder' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Controls Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Design & Content Slots</h3>
                      <p className="text-xs text-aisle-muted mt-0.5">
                        Customize visual styling, palettes, fonts, opening reveal, and section layout in real-time.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-0.5 shrink-0">
                      Auto-syncs live
                    </span>
                  </div>

                  {/* Builder Sub-Tabs Navigation */}
                  <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] rounded-2xl border border-aisle-border/70 overflow-x-auto">
                    {[
                      { id: 'presets', label: 'Presets', icon: Sparkles },
                      { id: 'palette', label: 'Colors', icon: Palette },
                      { id: 'typography', label: 'Typography', icon: Type },
                      { id: 'reveal', label: 'Opening', icon: Layers },
                      { id: 'imagery', label: 'Imagery', icon: Camera },
                      { id: 'sections', label: 'Chapters', icon: Sliders },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = builderSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setBuilderSubTab(tab.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            isActive
                              ? 'bg-white text-aisle-charcoal shadow-sm border border-aisle-border/60'
                              : 'text-aisle-muted hover:text-aisle-charcoal hover:bg-white/50'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-aisle-terracotta' : ''}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SUB-TAB 1: PRESETS */}
                  {builderSubTab === 'presets' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-aisle-border bg-aisle-sand/30 p-4 text-xs">
                        <div>
                          <span className="font-semibold text-aisle-charcoal">Design Studio</span>
                          <span className="ml-2 rounded-full bg-aisle-gold/20 px-2 py-0.5 text-xs font-bold text-aisle-gold-deep">Premium</span>
                          <p className="text-aisle-muted mt-0.5">Rearrange sections and style every card, border and background.</p>
                        </div>
                        {hasFeature(event, 'design_studio') ? (
                          <Link
                            href={`/admin/${event.admin_token}/studio`}
                            className="inline-flex min-h-[44px] items-center rounded-full bg-aisle-charcoal px-4 font-semibold text-white hover:bg-aisle-terracotta"
                          >
                            Open Design Studio
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab('dashboard')}
                            className="inline-flex min-h-[44px] items-center rounded-full border border-aisle-border px-4 font-semibold text-aisle-charcoal hover:bg-white cursor-pointer"
                          >
                            See plans
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-aisle-muted mb-2">
                          Select Aesthetic Preset
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.values(BUILTIN_THEMES).map((thm) => (
                            <button
                              key={thm.id}
                              type="button"
                              onClick={() =>
                                isStudioDesign(customTheme)
                                  ? handleApplyTheme(thm.id, {})
                                  : handleUpdateDesignSlot('theme_id', thm.id)
                              }
                              className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                                customTheme.id === thm.id
                                  ? 'border-aisle-terracotta bg-aisle-sand/50 shadow-sm'
                                  : 'border-aisle-border hover:bg-aisle-sand/20'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-serif text-xs font-semibold text-aisle-charcoal block">{thm.name}</span>
                                {customTheme.id === thm.id && (
                                  <span className="h-2 w-2 rounded-full bg-aisle-terracotta" />
                                )}
                              </div>
                              <span className="text-xs text-aisle-muted block mt-0.5">{thm.taxonomy}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {studioDesigns.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-aisle-muted mb-2">
                            Studio Designs
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {studioDesigns.map((design) => (
                              <button
                                key={design.id}
                                type="button"
                                onClick={() => handleApplyStudioDesign(design)}
                                className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                                  customTheme.id === design.id
                                    ? 'border-aisle-terracotta bg-aisle-sand/50 shadow-sm'
                                    : 'border-aisle-border hover:bg-aisle-sand/20'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-serif text-xs font-semibold text-aisle-charcoal block">{design.name}</span>
                                  {customTheme.id === design.id && (
                                    <span className="h-2 w-2 rounded-full bg-aisle-terracotta" />
                                  )}
                                </div>
                                <span className="flex items-center gap-1 mt-1">
                                  <span className="h-3 w-3 rounded-full border border-aisle-border" style={{ backgroundColor: design.bg_color }} />
                                  <span className="h-3 w-3 rounded-full border border-aisle-border" style={{ backgroundColor: design.accent_color }} />
                                  <span className="text-xs text-aisle-muted ml-1">{design.taxonomy}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="rounded-2xl border border-aisle-border bg-[#FAF7F2]/50 p-3.5 text-xs text-aisle-muted space-y-1">
                        <p className="font-semibold text-aisle-charcoal">{customTheme.name} · {customTheme.taxonomy}</p>
                        <p className="leading-relaxed text-xs">{customTheme.description}</p>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: COLOR PALETTE */}
                  {builderSubTab === 'palette' && (
                    <div className="space-y-5 text-xs">
                      {/* Accent Color */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-aisle-charcoal">Primary Accent & Wax Tint</label>
                          <span className="font-mono text-xs text-aisle-muted">{customTheme.accent_color || '#9E5A44'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customTheme.accent_color || '#9E5A44'}
                            onChange={(e) => handleUpdateThemeConfig('accent_color', e.target.value)}
                            className="h-8 w-10 rounded-lg border border-aisle-border cursor-pointer p-0.5 bg-white"
                          />
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {['#9E5A44', '#8C4A32', '#D4AF37', '#2B5329', '#1A1A1A', '#E67E22', '#2E86AB', '#B76E79'].map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => handleUpdateThemeConfig('accent_color', hex)}
                                className="h-6 w-6 rounded-full border border-black/10 shadow-xs cursor-pointer transition-transform hover:scale-110"
                                style={{ backgroundColor: hex }}
                                title={hex}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Background Color */}
                      <div className="space-y-2 pt-3 border-t border-aisle-border/60">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-aisle-charcoal">Stationery Background Canvas</label>
                          <span className="font-mono text-xs text-aisle-muted">{customTheme.bg_color || '#FAF7F2'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customTheme.bg_color || '#FAF7F2'}
                            onChange={(e) => handleUpdateThemeConfig('bg_color', e.target.value)}
                            className="h-8 w-10 rounded-lg border border-aisle-border cursor-pointer p-0.5 bg-white"
                          />
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {['#FAF7F2', '#F4F3F0', '#FBF7F0', '#0F141C', '#FDF6EC', '#F5F2EC', '#FFFFFF'].map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => handleUpdateThemeConfig('bg_color', hex)}
                                className="h-6 w-6 rounded-full border border-black/15 shadow-xs cursor-pointer transition-transform hover:scale-110"
                                style={{ backgroundColor: hex }}
                                title={hex}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Ink / Typography Color */}
                      <div className="space-y-2 pt-3 border-t border-aisle-border/60">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-aisle-charcoal">Typography Ink Color</label>
                          <span className="font-mono text-xs text-aisle-muted">{customTheme.text_color || '#2C2523'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customTheme.text_color || '#2C2523'}
                            onChange={(e) => handleUpdateThemeConfig('text_color', e.target.value)}
                            className="h-8 w-10 rounded-lg border border-aisle-border cursor-pointer p-0.5 bg-white"
                          />
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {['#2C2523', '#1A1A1A', '#342820', '#1C2833', '#F2EFE9', '#4A4A4A'].map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => handleUpdateThemeConfig('text_color', hex)}
                                className="h-6 w-6 rounded-full border border-black/15 shadow-xs cursor-pointer transition-transform hover:scale-110"
                                style={{ backgroundColor: hex }}
                                title={hex}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Surface Card Color */}
                      <div className="space-y-2 pt-3 border-t border-aisle-border/60">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-aisle-charcoal">Card & Module Surface</label>
                          <span className="font-mono text-xs text-aisle-muted">{customTheme.surface_color || '#FFFFFF'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customTheme.surface_color || '#FFFFFF'}
                            onChange={(e) => handleUpdateThemeConfig('surface_color', e.target.value)}
                            className="h-8 w-10 rounded-lg border border-aisle-border cursor-pointer p-0.5 bg-white"
                          />
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {['#FFFFFF', '#FAF6EF', '#161D27', '#F9F9F8', '#F5EFE6'].map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => handleUpdateThemeConfig('surface_color', hex)}
                                className="h-6 w-6 rounded-full border border-black/15 shadow-xs cursor-pointer transition-transform hover:scale-110"
                                style={{ backgroundColor: hex }}
                                title={hex}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Canvas Layout Width */}
                      <div className="pt-3 border-t border-aisle-border/60 space-y-2">
                        <label className="font-semibold text-aisle-charcoal block">Canvas Layout Width</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'narrow', label: 'Narrow', desc: 'Mobile-first compact' },
                            { id: 'medium', label: 'Balanced', desc: 'Stationery card' },
                            { id: 'wide', label: 'Wide', desc: 'Editorial spacious' },
                          ].map((w) => (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => handleUpdateThemeConfig('canvas_width', w.id)}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                (customTheme.canvas_width || 'medium') === w.id
                                  ? 'border-aisle-terracotta bg-aisle-sand/50 shadow-xs'
                                  : 'border-aisle-border hover:bg-aisle-sand/20'
                              }`}
                            >
                              <span className="font-semibold text-xs text-aisle-charcoal block">{w.label}</span>
                              <span className="text-xs text-aisle-muted">{w.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: TYPOGRAPHY & PHRASING */}
                  {builderSubTab === 'typography' && (
                    <div className="space-y-4 text-xs">
                      {/* Font Family Pairing */}
                      <div className="space-y-2">
                        <label className="font-semibold text-aisle-charcoal block">Typography Pairing</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'classic-serif', label: 'Classic Serif', desc: 'Playfair & Cormorant' },
                            { id: 'modern-sans', label: 'Modern Sans', desc: 'Inter & Helvetica' },
                            { id: 'vintage-editorial', label: 'Vintage Editorial', desc: 'Italian Romance' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handleUpdateThemeConfig('font_family', f.id)}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                (customTheme.font_family || 'classic-serif') === f.id
                                  ? 'border-aisle-terracotta bg-aisle-sand/50 shadow-xs'
                                  : 'border-aisle-border hover:bg-aisle-sand/20'
                              }`}
                            >
                              <span className="font-semibold text-xs text-aisle-charcoal block">{f.label}</span>
                              <span className="text-xs text-aisle-muted">{f.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Floron Glyphs */}
                      <div className="space-y-2 pt-3 border-t border-aisle-border/60">
                        <label className="font-semibold text-aisle-charcoal block">Ornamental Floron Symbol</label>
                        <div className="flex flex-wrap gap-2">
                          {['❦', '✦', '✧', '—', '❁', '⚜', '🪞', '🕊'].map((fl) => (
                            <button
                              key={fl}
                              type="button"
                              onClick={() => handleUpdateThemeConfig('floron', fl)}
                              className={`h-9 w-9 rounded-xl border flex items-center justify-center text-sm transition-all cursor-pointer ${
                                (customTheme.floron || '✦') === fl
                                  ? 'border-aisle-terracotta bg-aisle-terracotta text-white shadow-xs'
                                  : 'border-aisle-border bg-white text-aisle-charcoal hover:bg-aisle-sand'
                              }`}
                            >
                              {fl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Eyebrow Text */}
                      <div className="space-y-1 pt-2 border-t border-aisle-border/60">
                        <label className="font-semibold text-aisle-charcoal block">Decorative Eyebrow Headline</label>
                        <input
                          type="text"
                          placeholder="e.g. Among the camellias & old oaks"
                          value={customTheme.eyebrow_text || ''}
                          onChange={(e) => handleUpdateThemeConfig('eyebrow_text', e.target.value)}
                          className="w-full rounded-xl border border-aisle-border p-2.5 bg-white focus:outline-none focus:border-aisle-terracotta"
                        />
                      </div>

                      {/* Poetic Line */}
                      <div className="space-y-1">
                        <label className="font-semibold text-aisle-charcoal block">Poetic Subtitle Line</label>
                        <input
                          type="text"
                          placeholder="e.g. A garden in bloom, a love in flower"
                          value={customTheme.poetic_line || ''}
                          onChange={(e) => handleUpdateThemeConfig('poetic_line', e.target.value)}
                          className="w-full rounded-xl border border-aisle-border p-2.5 bg-white focus:outline-none focus:border-aisle-terracotta"
                        />
                      </div>

                      {/* Formal Invitation Phrase */}
                      <div className="space-y-1">
                        <label className="font-semibold text-aisle-charcoal block">Formal Invitation Phrase</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. request the honour of your presence at the celebration of their marriage"
                          value={customTheme.invitation_phrase || ''}
                          onChange={(e) => handleUpdateThemeConfig('invitation_phrase', e.target.value)}
                          className="w-full rounded-xl border border-aisle-border p-2.5 bg-white focus:outline-none focus:border-aisle-terracotta"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: TACTILE OPENING REVEAL */}
                  {builderSubTab === 'reveal' && (
                    <div className="space-y-3 text-xs">
                      <label className="font-semibold text-aisle-charcoal block">Select Guest Opening Experience</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          {
                            id: 'wax-seal',
                            title: 'Tactile Wax Seal',
                            desc: 'Dimensional wax monogram stamp with pulsing ring and authentic crack animation.',
                            badge: 'Classic Romance',
                          },
                          {
                            id: 'envelope',
                            title: 'Vintage Envelope Unfold',
                            desc: 'Warm paper envelope letterhead that smoothly unfolds upon tapping.',
                            badge: 'Editorial Formal',
                          },
                          {
                            id: 'curtain',
                            title: 'Velvet Midnight Curtain',
                            desc: 'Dramatic midnight navy card reveal with shimmering gold starlight accents.',
                            badge: 'Black-Tie Evening',
                          },
                          {
                            id: 'minimal-fade',
                            title: 'Modern Clean Fade',
                            desc: 'Instant, airy typographic fade with architectural minimalist button.',
                            badge: 'Contemporary',
                          },
                        ].map((rev) => (
                          <button
                            key={rev.id}
                            type="button"
                            onClick={() => handleUpdateThemeConfig('opening_style', rev.id)}
                            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all space-y-1.5 ${
                              (customTheme.opening_style || 'wax-seal') === rev.id
                                ? 'border-aisle-terracotta bg-aisle-sand/50 shadow-sm ring-1 ring-aisle-terracotta'
                                : 'border-aisle-border hover:bg-aisle-sand/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-serif font-semibold text-aisle-charcoal">{rev.title}</span>
                              <span className="text-xs uppercase tracking-wider font-semibold text-aisle-gold-deep bg-white px-2 py-0.5 rounded-full border border-aisle-border/60">
                                {rev.badge}
                              </span>
                            </div>
                            <p className="text-xs text-aisle-muted leading-relaxed">{rev.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Music on open (shown with the opening styles) */}
                  {builderSubTab === 'reveal' && (
                    <div className="space-y-3 rounded-2xl border border-aisle-border p-4 text-xs">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-aisle-charcoal">Music on open</h4>
                        <p className="text-xs text-aisle-muted mt-0.5">
                          Plays when a guest taps to open the invitation. Guests can mute it at any time.
                        </p>
                      </div>
                      {!hasFeature(event, 'music') ? (
                        <p className="text-aisle-muted">
                          {featureError('music')}{' '}
                          <button type="button" onClick={() => setActiveTab('dashboard')} className="font-semibold text-aisle-terracotta underline cursor-pointer">
                            See plans
                          </button>
                        </p>
                      ) : customSections.music?.url ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-aisle-charcoal">{customSections.music.title || 'Your song'}</p>
                          <audio controls src={customSections.music.url} className="w-full" />
                          <button
                            type="button"
                            onClick={() => handleSetMusic(null)}
                            disabled={isProcessingAction}
                            className="rounded-full border border-aisle-border px-4 py-2 font-semibold text-aisle-muted hover:text-red-600 cursor-pointer disabled:opacity-50"
                          >
                            Remove song
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-2 font-semibold text-white hover:bg-aisle-terracotta cursor-pointer">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{isProcessingAction ? 'Uploading…' : 'Upload a song (MP3, M4A, up to 15MB)'}</span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="sr-only"
                            disabled={isProcessingAction}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (file) handleSetMusic(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB 5: IMAGERY & PHOTO SLOTS */}
                  {builderSubTab === 'imagery' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-aisle-charcoal">
                          Website Imagery & Photo Uploads
                        </h4>
                        <p className="text-xs text-aisle-muted mt-0.5">
                          Select files from your computer, curated high-res boutique library, or direct URL.
                        </p>
                      </div>

                      <ImagePickerUploader
                        label="Cover & Hero Photo"
                        value={event.cover_image_url || ''}
                        onChange={(url) => handleUpdateDesignSlot('cover_image_url', url)}
                        eventId={event.id}
                        adminToken={event.admin_token}
                        category="cover"
                        aspectRatio="landscape"
                        helperText="Hero image at the top of your digital wedding invitation and guest portal."
                      />

                      <ImagePickerUploader
                        label="Our Story Couple Photo"
                        value={event.story_image_url || ''}
                        onChange={(url) => handleUpdateDesignSlot('story_image_url', url)}
                        eventId={event.id}
                        adminToken={event.admin_token}
                        category="story"
                        aspectRatio="landscape"
                        helperText="Romantic photo showcasing your journey and couple narrative."
                      />

                      <ImagePickerUploader
                        label="Venue & Setting Photo"
                        value={event.venue_image_url || ''}
                        onChange={(url) => handleUpdateDesignSlot('venue_image_url', url)}
                        eventId={event.id}
                        adminToken={event.admin_token}
                        category="venue"
                        aspectRatio="landscape"
                        helperText="Photo of the ceremony/reception villa, garden, or estate."
                      />
                    </div>
                  )}

                  {/* SUB-TAB 6: CHAPTERS & LAYOUT */}
                  {builderSubTab === 'sections' && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-aisle-charcoal">
                          Portal Chapters & Section Flow
                        </h4>
                        <p className="text-xs text-aisle-muted mt-0.5">
                          Toggle visibility and customize the chapter layout for your guests.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {[
                          { id: 'story', label: 'Chapter I: Our Story & Welcome', desc: 'Narrative & couple narrative photo' },
                          { id: 'schedule', label: 'Chapter II: The Itinerary', desc: 'Timeline schedule & attire notes' },
                          { id: 'venue', label: 'Chapter III: Venue & Setting', desc: 'Location address & one-tap map' },
                          { id: 'travel', label: 'Chapter IV: Accommodations & Logistics', desc: 'Hotel room blocks & shuttles' },
                          { id: 'rsvp', label: 'Chapter V: Zero-Login Interactive RSVP', desc: 'Household RSVP, meals & questions' },
                          { id: 'photos', label: 'Chapter VI: Live Photo Stream', desc: 'Guest camera uploads & gallery' },
                          { id: 'registry', label: 'Chapter VII: Gift Registry & Cash Funds', desc: 'Honeymoon fund & gift items' },
                          { id: 'faq', label: 'Chapter VIII: FAQ Accordion', desc: 'Common questions & answers' },
                          { id: 'local-recs', label: 'Chapter IX: Local Concierge', desc: 'Curated dining, drinks & stays' },
                          { id: 'wedding-party', label: 'Chapter X: The Wedding Party', desc: 'Entourage bios & portraits' },
                        ].map((sec) => (
                          <div
                            key={sec.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-aisle-border bg-[#FAF7F2]/40"
                          >
                            <div>
                              <span className="font-semibold text-aisle-charcoal block">{sec.label}</span>
                              <span className="text-xs text-aisle-muted">{sec.desc}</span>
                            </div>
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Save & Action Bar */}
                  <div className="pt-4 border-t border-aisle-border/70 flex items-center justify-between">
                    <p className="text-xs text-aisle-muted italic">
                      Changes sync live to your guest view.
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveAllDesign}
                      disabled={isProcessingAction}
                      className="rounded-full bg-aisle-charcoal px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-sm transition-all"
                    >
                      {isProcessingAction ? 'Saving Design...' : 'Save All Portal Design'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Column */}
              <div className="lg:col-span-6">
                <PortalPreviewPane>
                  <GuestPortalView
                    event={event}
                    primaryGuest={guests && guests.length > 0 ? guests[0] : null}
                    partyMembers={guests && guests.length > 1 ? guests.slice(0, 2) : []}
                    scheduleItems={schedule || []}
                    customQuestions={questions || []}
                    registryItems={registry || []}
                    initialPhotos={photos || []}
                    customTheme={customTheme}
                    previewMode={true}
                  />
                </PortalPreviewPane>
              </div>
            </div>
          )}

          {/* TAB 6: GUEST COPY & STRUCTURED CMS EDITOR */}
          {activeTab === 'copy' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-8">
              <div>
                <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
                  Guest Copy & Structured CMS Sections
                </h3>
                <p className="text-xs text-aisle-muted mt-0.5">
                  Customize narrative messaging, FAQs, local recommendations, wedding party, and logistics
                </p>
              </div>

              {/* General Narrative Copy */}
              <div className="space-y-4 text-xs border-b border-aisle-border pb-6">
                <h4 className="font-serif text-base font-semibold text-aisle-charcoal">
                  Narrative Text
                </h4>

                <div>
                  <label className="block font-medium text-aisle-warm mb-1">Welcome Greeting Message</label>
                  <textarea
                    rows={2}
                    value={event.welcome_message || ''}
                    onChange={(e) => setEvent({ ...event, welcome_message: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-3 focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-medium text-aisle-warm mb-1">Our Story Narrative</label>
                  <textarea
                    rows={3}
                    value={event.our_story || ''}
                    onChange={(e) => setEvent({ ...event, our_story: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-3 focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-medium text-aisle-warm mb-1">Dress Code Note</label>
                  <input
                    type="text"
                    value={event.dress_code || ''}
                    onChange={(e) => setEvent({ ...event, dress_code: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-3 focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              </div>

              {/* 1. FAQ CMS SECTION */}
              <div className="space-y-4 text-xs border-b border-aisle-border pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-base font-semibold text-aisle-charcoal flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-aisle-terracotta" />
                      <span>Frequently Asked Questions</span>
                    </h4>
                    <p className="text-xs text-aisle-muted">Accordion Q&A for guests</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const items = customSections.faq?.items || [];
                      setCustomSections({
                        ...customSections,
                        faq: {
                          enabled: true,
                          items: [...items, { question: 'What is the parking situation?', answer: 'Valet parking is complimentary at the venue entrance.' }],
                        },
                      });
                    }}
                    className="rounded-full bg-aisle-sand px-3 py-1 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand/70 cursor-pointer"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="space-y-3">
                  {(customSections.faq?.items || []).map((faq: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border border-aisle-border p-4 bg-[#FAF7F2]/40 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Question"
                          value={faq.question}
                          onChange={(e) => {
                            const items = [...(customSections.faq?.items || [])];
                            items[idx].question = e.target.value;
                            setCustomSections({ ...customSections, faq: { ...customSections.faq, items } });
                          }}
                          className="flex-1 rounded-lg border border-aisle-border p-2 font-semibold bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const items = (customSections.faq?.items || []).filter((_: any, i: number) => i !== idx);
                            setCustomSections({ ...customSections, faq: { ...customSections.faq, items } });
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Answer"
                        value={faq.answer}
                        onChange={(e) => {
                          const items = [...(customSections.faq?.items || [])];
                          items[idx].answer = e.target.value;
                          setCustomSections({ ...customSections, faq: { ...customSections.faq, items } });
                        }}
                        className="w-full rounded-lg border border-aisle-border p-2 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. LOCAL CONCIERGE RECOMMENDATIONS */}
              <div className="space-y-4 text-xs border-b border-aisle-border pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-base font-semibold text-aisle-charcoal flex items-center gap-2">
                      <Compass className="h-4 w-4 text-aisle-terracotta" />
                      <span>Local Recommendations Concierge</span>
                    </h4>
                    <p className="text-xs text-aisle-muted">Curated local spots for guests</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const items = customSections.local_recs?.items || [];
                      setCustomSections({
                        ...customSections,
                        local_recs: {
                          enabled: true,
                          items: [...items, { name: 'Artisan Cafe', type: 'Coffee', description: 'Best espresso and breakfast pastries within walking distance.' }],
                        },
                      });
                    }}
                    className="rounded-full bg-aisle-sand px-3 py-1 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand/70 cursor-pointer"
                  >
                    + Add Recommendation
                  </button>
                </div>

                <div className="space-y-3">
                  {(customSections.local_recs?.items || []).map((rec: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border border-aisle-border p-4 bg-[#FAF7F2]/40 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Place Name"
                          value={rec.name}
                          onChange={(e) => {
                            const items = [...(customSections.local_recs?.items || [])];
                            items[idx].name = e.target.value;
                            setCustomSections({ ...customSections, local_recs: { ...customSections.local_recs, items } });
                          }}
                          className="flex-1 rounded-lg border border-aisle-border p-2 font-semibold bg-white"
                        />
                        <select
                          value={rec.type || 'Food'}
                          onChange={(e) => {
                            const items = [...(customSections.local_recs?.items || [])];
                            items[idx].type = e.target.value;
                            setCustomSections({ ...customSections, local_recs: { ...customSections.local_recs, items } });
                          }}
                          className="rounded-lg border border-aisle-border p-2 bg-white text-xs font-semibold"
                        >
                          <option value="Food">Food</option>
                          <option value="Coffee">Coffee</option>
                          <option value="Drink">Drink</option>
                          <option value="Activity">Activity</option>
                          <option value="Stay">Stay</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const items = (customSections.local_recs?.items || []).filter((_: any, i: number) => i !== idx);
                            setCustomSections({ ...customSections, local_recs: { ...customSections.local_recs, items } });
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Description"
                        value={rec.description}
                        onChange={(e) => {
                          const items = [...(customSections.local_recs?.items || [])];
                          items[idx].description = e.target.value;
                          setCustomSections({ ...customSections, local_recs: { ...customSections.local_recs, items } });
                        }}
                        className="w-full rounded-lg border border-aisle-border p-2 bg-white"
                      />
                      <div className="pt-1">
                        <ImagePickerUploader
                          label="Place / Venue Photo (Optional)"
                          value={rec.image_url || ''}
                          onChange={(url) => {
                            const items = [...(customSections.local_recs?.items || [])];
                            items[idx].image_url = url;
                            setCustomSections({ ...customSections, local_recs: { ...customSections.local_recs, items } });
                          }}
                          eventId={event.id}
                          adminToken={event.admin_token}
                          category="venue"
                          aspectRatio="landscape"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. WEDDING PARTY MEMBERS */}
              <div className="space-y-4 text-xs border-b border-aisle-border pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-base font-semibold text-aisle-charcoal flex items-center gap-2">
                      <Users className="h-4 w-4 text-aisle-terracotta" />
                      <span>Wedding Party</span>
                    </h4>
                    <p className="text-xs text-aisle-muted">Honorary party members & entourage</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const members = customSections.wedding_party?.members || [];
                      setCustomSections({
                        ...customSections,
                        wedding_party: {
                          enabled: true,
                          members: [...members, { name: 'Full Name', role: 'Maid of Honor', bio: 'Childhood best friend.', photo_url: '' }],
                        },
                      });
                    }}
                    className="rounded-full bg-aisle-sand px-3 py-1 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand/70 cursor-pointer"
                  >
                    + Add Member
                  </button>
                </div>

                <div className="space-y-3">
                  {(customSections.wedding_party?.members || []).map((member: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border border-aisle-border p-4 bg-[#FAF7F2]/40 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Member Name"
                          value={member.name}
                          onChange={(e) => {
                            const members = [...(customSections.wedding_party?.members || [])];
                            members[idx].name = e.target.value;
                            setCustomSections({ ...customSections, wedding_party: { ...customSections.wedding_party, members } });
                          }}
                          className="flex-1 rounded-lg border border-aisle-border p-2 font-semibold bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Role (e.g. Best Man)"
                          value={member.role}
                          onChange={(e) => {
                            const members = [...(customSections.wedding_party?.members || [])];
                            members[idx].role = e.target.value;
                            setCustomSections({ ...customSections, wedding_party: { ...customSections.wedding_party, members } });
                          }}
                          className="w-40 rounded-lg border border-aisle-border p-2 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const members = (customSections.wedding_party?.members || []).filter((_: any, i: number) => i !== idx);
                            setCustomSections({ ...customSections, wedding_party: { ...customSections.wedding_party, members } });
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Bio or story note"
                        value={member.bio || ''}
                        onChange={(e) => {
                          const members = [...(customSections.wedding_party?.members || [])];
                          members[idx].bio = e.target.value;
                          setCustomSections({ ...customSections, wedding_party: { ...customSections.wedding_party, members } });
                        }}
                        className="w-full rounded-lg border border-aisle-border p-2 bg-white"
                      />
                      <div className="pt-1">
                        <ImagePickerUploader
                          label="Member Portrait Photo"
                          value={member.photo_url || ''}
                          onChange={(url) => {
                            const members = [...(customSections.wedding_party?.members || [])];
                            members[idx].photo_url = url;
                            setCustomSections({ ...customSections, wedding_party: { ...customSections.wedding_party, members } });
                          }}
                          eventId={event.id}
                          adminToken={event.admin_token}
                          category="avatar"
                          aspectRatio="avatar"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. TRAVEL & LOGISTICS */}
              <div className="space-y-4 text-xs pb-2">
                <h4 className="font-serif text-base font-semibold text-aisle-charcoal flex items-center gap-2">
                  <Hotel className="h-4 w-4 text-aisle-terracotta" />
                  <span>Travel, Accommodations & Shuttle Guidance</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-aisle-warm mb-1">Hotel Room Block Details</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. The Grand Hotel · Group code 'LOVE2026' for $189/night rate."
                      value={customSections.travel?.hotel_info || ''}
                      onChange={(e) =>
                        setCustomSections({
                          ...customSections,
                          travel: { ...customSections.travel, hotel_info: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-aisle-border p-3 bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-aisle-warm mb-1">Shuttle & Transit Schedule</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Complimentary shuttles depart The Grand Hotel lobby at 3:15 PM & 3:45 PM."
                      value={customSections.travel?.shuttle_info || ''}
                      onChange={(e) =>
                        setCustomSections({
                          ...customSections,
                          travel: { ...customSections.travel, shuttle_info: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-aisle-border p-3 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button for All CMS Sections */}
              <div className="pt-4 border-t border-aisle-border flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveEditor}
                  disabled={isProcessingAction}
                  className="rounded-full bg-aisle-charcoal px-8 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isProcessingAction ? 'Saving Editorial CMS...' : 'Save All CMS Sections'}
                </button>
              </div>
            </div>

            {/* Live Preview Column: shows unsaved copy and CMS edits */}
            <div className="lg:col-span-6">
              <PortalPreviewPane
                label="Live preview · click your text to edit"
                actions={
                  <span className="inline-flex items-center gap-2">
                    {editorDirty && <span className="text-xs font-semibold text-amber-700">Unsaved edits</span>}
                    <button
                      type="button"
                      onClick={handleSaveEditor}
                      disabled={isProcessingAction}
                      className="min-h-[44px] min-w-[140px] rounded-full bg-aisle-charcoal px-6 text-sm font-semibold text-white shadow-sm hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessingAction ? 'Saving…' : 'Save changes'}
                    </button>
                  </span>
                }
              >
                <GuestPortalView
                  event={{ ...event, custom_sections: customSections }}
                  onEditText={handlePreviewTextEdit}
                  primaryGuest={guests && guests.length > 0 ? guests[0] : null}
                  partyMembers={guests && guests.length > 1 ? guests.slice(0, 2) : []}
                  scheduleItems={schedule || []}
                  customQuestions={questions || []}
                  registryItems={registry || []}
                  initialPhotos={photos || []}
                  customTheme={customTheme}
                  previewMode={true}
                />
              </PortalPreviewPane>
            </div>
            </div>
          )}

          {/* TAB 7: SCHEDULE MANAGER */}
          {activeTab === 'schedule' && (
            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Schedule & VIP Timelines</h3>
                  <p className="text-xs text-aisle-muted mt-0.5">
                    Manage itinerary events, times, locations, dress codes, and VIP-only visibility rules
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateSchedule}
                  className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Itinerary Event</span>
                </button>
              </div>

              <div className="space-y-4">
                {schedule.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-aisle-border p-8 text-center text-xs text-aisle-muted">
                    No timeline events yet. Click "Add Itinerary Event" to create your first event!
                  </div>
                ) : (
                  schedule.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-aisle-border bg-[#FAF7F2]/40 p-4 space-y-2.5 text-xs hover:border-aisle-terracotta/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="font-serif text-sm font-semibold text-aisle-charcoal">{item.title}</strong>
                            {item.is_vip_only && (
                              <span className="rounded-full bg-aisle-gold/20 px-2 py-0.5 text-xs font-bold text-aisle-gold-deep">
                                VIP Only
                              </span>
                            )}
                            {item.requires_rsvp && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                RSVP Required
                              </span>
                            )}
                          </div>
                          {item.location_name && (
                            <div className="text-xs text-aisle-muted mt-0.5">
                              📍 {item.location_name}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSchedule(item)}
                            className="rounded-lg border border-aisle-border bg-white px-2.5 py-1 text-xs font-medium text-aisle-charcoal hover:bg-aisle-sand cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteScheduleItem(item.id)}
                            className="rounded-lg border border-rose-200 bg-white p-1 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.description && <p className="text-aisle-muted leading-relaxed">{item.description}</p>}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-aisle-warm pt-1 border-t border-aisle-border/40">
                        <span>
                          🕒 {new Date(item.start_time).toLocaleDateString()} at {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {item.end_time ? ` – ${new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </span>
                        {item.dress_code && (
                          <span>👗 Attire: {item.dress_code}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: RSVP QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
            {/* Meal options: guests choose from these on the RSVP */}
            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Meal Options</h3>
                  <p className="text-xs text-aisle-muted mt-0.5">
                    Guests pick from this menu for themselves and their plus-one. Leave it empty to let guests type their meal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuDraft([...menuDraft, { name: '', description: '' }])}
                  className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Meal</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {menuDraft.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-aisle-border p-6 text-center text-xs text-aisle-muted">
                    No menu yet. Add each main course your caterer offers, for example "Filet mignon" or "Wild mushroom risotto (vegetarian)".
                  </div>
                ) : (
                  menuDraft.map((option, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 rounded-xl border border-aisle-border p-3 bg-[#FAF7F2]/40">
                      <input
                        type="text"
                        aria-label={`Meal ${index + 1} name`}
                        placeholder="Meal name"
                        value={option.name}
                        onChange={(e) =>
                          setMenuDraft(menuDraft.map((o, i) => (i === index ? { ...o, name: e.target.value } : o)))
                        }
                        className="sm:w-1/3 rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                      />
                      <input
                        type="text"
                        aria-label={`Meal ${index + 1} description`}
                        placeholder="Description (optional)"
                        value={option.description || ''}
                        onChange={(e) =>
                          setMenuDraft(menuDraft.map((o, i) => (i === index ? { ...o, description: e.target.value } : o)))
                        }
                        className="flex-1 rounded-xl border border-aisle-border px-3 py-2.5 text-xs focus:outline-none focus:border-aisle-terracotta"
                      />
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-aisle-muted whitespace-nowrap">
                          {mealCounts[option.name.trim()] || 0} chosen
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${option.name || 'meal'}`}
                          onClick={() => setMenuDraft(menuDraft.filter((_, i) => i !== index))}
                          className="rounded-lg border border-aisle-border bg-white p-2 text-aisle-muted hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-aisle-border/70 pt-4">
                <p className="text-xs text-aisle-muted">
                  Counts include plus-ones of guests who are attending.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCatererCsv}
                  className="inline-flex items-center gap-1.5 rounded-full border border-aisle-border px-4 py-2.5 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Caterer list (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveMenu}
                  disabled={isProcessingAction}
                  className="rounded-full bg-aisle-charcoal px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer"
                >
                  Save Menu
                </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Custom RSVP Questions</h3>
                  <p className="text-xs text-aisle-muted mt-0.5">
                    Collect song requests, dietary specifics, shuttle pickups, or custom preferences from guests
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateQuestion}
                  className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {questions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-aisle-border p-8 text-center text-xs text-aisle-muted">
                    No custom RSVP questions yet. Click "Add Question" to ask guests helpful questions!
                  </div>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="rounded-xl border border-aisle-border p-4 bg-[#FAF7F2]/40 space-y-2 hover:border-aisle-terracotta/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-aisle-charcoal text-sm">{q.prompt}</strong>
                            <span className="rounded-full bg-aisle-sand px-2 py-0.5 text-xs font-bold text-aisle-warm uppercase">
                              {q.question_type}
                            </span>
                            {q.is_required && (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q)}
                            className="rounded-lg border border-aisle-border bg-white px-2.5 py-1 text-xs font-medium text-aisle-charcoal hover:bg-aisle-sand cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="rounded-lg border border-rose-200 bg-white p-1 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <p className="text-xs text-aisle-muted">
                          <span className="font-semibold text-aisle-charcoal">Choices:</span> {q.options.join(' · ')}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            </div>
          )}

          {/* TAB 9: REGISTRY & CONTRIBUTIONS LEDGER */}
          {activeTab === 'registry' && (
            <div className="space-y-6">
              {/* Direct Payout Methods (Venmo, Zelle, CashApp, PayPal) */}
              <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-aisle-border/60 pb-4">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
                      Direct Cash Payout Methods (0% Fee)
                    </h3>
                    <p className="text-xs text-aisle-muted mt-0.5">
                      Configure your direct payment handles so guests can send honeymoon & cash fund gifts directly to you with zero transaction fees.
                    </p>
                  </div>
                  <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    Direct Payouts Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Venmo */}
                  <div className="space-y-1.5 p-3.5 rounded-2xl border border-aisle-border bg-[#FAF7F2]/40">
                    <label className="font-semibold text-aisle-charcoal flex items-center justify-between">
                      <span>Venmo Username</span>
                      <span className="text-xs text-blue-600 font-normal">One-tap app deep link</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-aisle-muted font-mono font-bold">@</span>
                      <input
                        type="text"
                        placeholder="Sophia-Alexandre"
                        value={customSections.registry?.venmo_handle || ''}
                        onChange={(e) =>
                          setCustomSections({
                            ...customSections,
                            registry: {
                              ...customSections.registry,
                              venmo_handle: e.target.value.replace('@', ''),
                            },
                          })
                        }
                        className="w-full rounded-xl border border-aisle-border pl-7 pr-3 py-2 bg-white focus:outline-none focus:border-aisle-terracotta"
                      />
                    </div>
                  </div>

                  {/* Zelle */}
                  <div className="space-y-1.5 p-3.5 rounded-2xl border border-aisle-border bg-[#FAF7F2]/40">
                    <label className="font-semibold text-aisle-charcoal flex items-center justify-between">
                      <span>Zelle Email or Phone</span>
                      <span className="text-xs text-purple-700 font-normal">Instant bank transfer</span>
                    </label>
                    <input
                      type="text"
                      placeholder="sophia.como26@example.com or +14155550199"
                      value={customSections.registry?.zelle_info || ''}
                      onChange={(e) =>
                        setCustomSections({
                          ...customSections,
                          registry: {
                            ...customSections.registry,
                            zelle_info: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-aisle-border px-3 py-2 bg-white focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>

                  {/* CashApp */}
                  <div className="space-y-1.5 p-3.5 rounded-2xl border border-aisle-border bg-[#FAF7F2]/40">
                    <label className="font-semibold text-aisle-charcoal flex items-center justify-between">
                      <span>CashApp $cashtag</span>
                      <span className="text-xs text-emerald-700 font-normal">Cash App pay</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-aisle-muted font-mono font-bold">$</span>
                      <input
                        type="text"
                        placeholder="SophiaComo"
                        value={customSections.registry?.cashapp_tag || ''}
                        onChange={(e) =>
                          setCustomSections({
                            ...customSections,
                            registry: {
                              ...customSections.registry,
                              cashapp_tag: e.target.value.replace('$', ''),
                            },
                          })
                        }
                        className="w-full rounded-xl border border-aisle-border pl-7 pr-3 py-2 bg-white focus:outline-none focus:border-aisle-terracotta"
                      />
                    </div>
                  </div>

                  {/* PayPal */}
                  <div className="space-y-1.5 p-3.5 rounded-2xl border border-aisle-border bg-[#FAF7F2]/40">
                    <label className="font-semibold text-aisle-charcoal flex items-center justify-between">
                      <span>PayPal.me Username / Link</span>
                      <span className="text-xs text-blue-800 font-normal">PayPal direct</span>
                    </label>
                    <input
                      type="text"
                      placeholder="sophiaalexandre or https://paypal.me/..."
                      value={customSections.registry?.paypal_handle || ''}
                      onChange={(e) =>
                        setCustomSections({
                          ...customSections,
                          registry: {
                            ...customSections.registry,
                            paypal_handle: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-aisle-border px-3 py-2 bg-white focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>
                </div>

                {/* Custom Payout Note */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-aisle-charcoal block">
                    Custom Gift / Check Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. If sending via Venmo or Zelle, please include your name in the payment memo so we can properly thank you! Physical cards are also warmly welcome at the reception."
                    value={customSections.registry?.payout_note || ''}
                    onChange={(e) =>
                      setCustomSections({
                        ...customSections,
                        registry: {
                          ...customSections.registry,
                          payout_note: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-white focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-aisle-border/60">
                  <p className="text-xs text-aisle-muted italic">
                    These payment options will be presented to guests when contributing to any cash fund.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveCustomSections}
                    disabled={isProcessingAction}
                    className="rounded-full bg-aisle-charcoal px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-sm transition-all"
                  >
                    {isProcessingAction ? 'Saving...' : 'Save Payout Handles'}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Gift Registry & Cash Funds</h3>
                    <p className="text-xs text-aisle-muted mt-0.5">
                      Configure cash gift funds and view live guest contributions
                    </p>
                  </div>
                  <button
                    onClick={() => setNewRegistryModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Fund / Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {registry.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-aisle-border p-4 bg-[#FAF7F2]/40 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-sm font-serif text-aisle-charcoal">{item.title}</strong>
                          {item.is_cash_fund ? (
                            <span className="ml-2 text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                              Cash Fund
                            </span>
                          ) : (
                            <span className="ml-2 text-xs text-aisle-muted bg-aisle-sand px-2 py-0.5 rounded-full font-semibold">
                              External Link
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 font-bold">${item.current_amount || 0} / ${item.target_amount || '—'}</span>
                          <button
                            onClick={() => handleDeleteRegistryItem(item.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-aisle-muted">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Contributions Ledger Table */}
              <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-4">
                <h4 className="font-serif text-lg font-semibold text-aisle-charcoal">
                  Live Guest Contributions Ledger ({contributions.length})
                </h4>

                {contributions.length === 0 ? (
                  <p className="text-xs text-aisle-muted">No contributions received yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-aisle-border bg-[#FAF7F2]/60 text-aisle-muted font-medium">
                          <th className="p-3">Guest Contributor</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Message</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-aisle-border/60">
                        {contributions.map((c) => (
                          <tr key={c.id} className="hover:bg-[#FAF7F2]/40">
                            <td className="p-3 font-semibold text-aisle-charcoal">{c.contributor_name}</td>
                            <td className="p-3 font-bold text-emerald-700">${c.amount}</td>
                            <td className="p-3 text-aisle-muted italic">{c.message || '—'}</td>
                            <td className="p-3 text-aisle-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: PHOTO STREAM MODERATION */}
          {activeTab === 'photos' && (
            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Memories</h3>
                  <p className="text-xs text-aisle-muted mt-0.5">
                    Photos and messages from your guests. Hide anything you don't want shown; hidden items stay here.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hasFeature(event, 'memories') ? (
                    <>
                      <button onClick={() => openAlbumPage('')} className="rounded-full border border-aisle-border px-4 py-1.5 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand cursor-pointer">
                        Open album
                      </button>
                      <button onClick={() => openAlbumPage('/slideshow')} className="rounded-full border border-aisle-border px-4 py-1.5 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand cursor-pointer">
                        Live slideshow
                      </button>
                      <button onClick={handleOpenTableCard} className="rounded-full bg-aisle-charcoal px-4 py-1.5 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer">
                        Print album QR card
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setActiveTab('dashboard')} className="rounded-full border border-aisle-border px-4 py-1.5 text-xs font-semibold text-aisle-charcoal hover:bg-aisle-sand cursor-pointer">
                      Memories album is Premium · See plans
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="relative aspect-square rounded-2xl overflow-hidden border border-aisle-border bg-aisle-sand group">
                    <img src={p.image_url} alt="Photo" className={`h-full w-full object-cover ${p.is_approved === false ? 'opacity-30' : ''}`} />
                    <button
                      onClick={() => handleToggleMemory('photo', p.id, p.is_approved === false)}
                      className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-aisle-charcoal shadow cursor-pointer"
                    >
                      {p.is_approved === false ? 'Hidden · Show' : 'Hide'}
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(p.id, p.image_url)}
                      title="Delete Photo"
                      className="absolute top-2 right-2 rounded-full bg-rose-700 text-white p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {p.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-xs text-white">
                        {p.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {hasFeature(event, 'memories') && (
                <div className="space-y-3 border-t border-aisle-border pt-5">
                  <h4 className="font-serif text-lg font-semibold text-aisle-charcoal">Guestbook ({guestbook.length})</h4>
                  {guestbook.length === 0 ? (
                    <p className="text-xs text-aisle-muted">Messages and voice notes from the album will appear here.</p>
                  ) : (
                    guestbook.map((m) => (
                      <div key={m.id} className={`rounded-2xl border border-aisle-border p-4 space-y-2 text-xs ${m.is_approved ? 'bg-white' : 'bg-aisle-sand/40 opacity-60'}`}>
                        {m.message && <p className="text-sm text-aisle-charcoal">“{m.message}”</p>}
                        {m.voice_url && <audio controls src={m.voice_url} preload="none" className="w-full" />}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-aisle-muted">— {m.author_name} · {new Date(m.created_at).toLocaleString()}</span>
                          <span className="flex gap-1.5">
                            <button onClick={() => handleToggleMemory('message', m.id, !m.is_approved)} className="rounded-full border border-aisle-border px-3 py-1 font-semibold cursor-pointer">
                              {m.is_approved ? 'Hide' : 'Show'}
                            </button>
                            <button onClick={() => handleDeleteGuestbookEntry(m.id)} aria-label="Delete message" className="rounded-full border border-aisle-border p-1.5 text-aisle-muted hover:text-rose-700 cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* SEATING CHART (Premium) */}
          {activeTab === 'seating' &&
            (hasFeature(event, 'seating') ? (
              <SeatingPlanner event={event} guests={guests} onGuestsChange={setGuests} />
            ) : (
              <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-3 text-xs">
                <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Seating chart</h3>
                <p className="text-aisle-muted">
                  {featureError('seating')} Arrange guests at tables, then print a table plan and place cards.
                </p>
                <button type="button" onClick={() => setActiveTab('dashboard')} className="rounded-full bg-aisle-charcoal px-4 py-2 font-semibold text-white hover:bg-aisle-terracotta cursor-pointer">
                  See plans
                </button>
              </div>
            ))}

          {/* TAB 11: PLANNING TASKS */}
          {activeTab === 'planning' && (
            <div className="rounded-3xl border border-aisle-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">Planning Task Workspace</h3>
                  <p className="text-xs text-aisle-muted mt-0.5">
                    Track vendor bookings, tastings, invitations, attire fittings, and wedding milestones
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateTask}
                  className="inline-flex items-center gap-1.5 rounded-full bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Progress Bar */}
              {tasks.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-aisle-border space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-aisle-charcoal">
                    <span>Overall Progress</span>
                    <span>
                      {tasks.filter((t) => t.status === 'done').length} of {tasks.length} completed (
                      {Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-aisle-sand overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                      style={{
                        width: `${(tasks.filter((t) => t.status === 'done').length / tasks.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Task Cards */}
              <div className="space-y-2.5 text-xs">
                {tasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-aisle-border p-8 text-center text-xs text-aisle-muted">
                    No planning tasks yet. Click "Add Task" to track your first wedding task!
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                        task.status === 'done'
                          ? 'border-emerald-200 bg-emerald-50/40 opacity-75'
                          : 'border-aisle-border bg-[#FAF7F2]/50 hover:border-aisle-terracotta/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.status === 'done'}
                          onChange={() => handleToggleTaskStatus(task)}
                          className="h-4 w-4 rounded border-aisle-border text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                        <div>
                          <span
                            className={`font-semibold text-sm ${
                              task.status === 'done' ? 'line-through text-aisle-muted' : 'text-aisle-charcoal'
                            }`}
                          >
                            {task.title}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-aisle-muted">
                            <span className="rounded-md bg-white border border-aisle-border/60 px-1.5 py-0.5 font-medium">
                              {task.category || 'General'}
                            </span>
                            {task.owner && (
                              <span>👤 {task.owner}</span>
                            )}
                            {task.due_date && (
                              <span>📅 Due {new Date(task.due_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'low'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {task.priority || 'medium'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                            task.status === 'done'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'doing'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditTask(task)}
                          className="rounded-lg border border-aisle-border bg-white px-2 py-1 text-xs font-medium text-aisle-charcoal hover:bg-aisle-sand cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="rounded-lg border border-rose-200 bg-white p-1 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {csvImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
              Import Guests via CSV
            </h3>
            <p className="text-xs text-aisle-muted leading-relaxed">
              Paste CSV contents below. Supported headers: <code>first_name, last_name, email, phone, party, is_vip, tags</code>. Guests sharing a party name will be automatically grouped together!
            </p>

            <textarea
              rows={8}
              placeholder={`first_name,last_name,email,phone,party,is_vip\nElena,Vance,elena@example.com,+14155552671,Vance Household,true\nMarcus,Vance,marcus@example.com,+14155552672,Vance Household,true`}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              className="w-full font-mono text-xs rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCsvImportModalOpen(false)}
                className="flex-1 rounded-full border border-aisle-border py-2.5 text-xs font-semibold text-aisle-muted hover:bg-aisle-sand cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction || !csvRawText.trim()}
                onClick={handleImportCsv}
                className="flex-1 rounded-full bg-aisle-charcoal py-2.5 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer"
              >
                {isProcessingAction ? 'Importing...' : 'Parse & Import Guests'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Guest Modal (with Has Partner Dual-Guest Creation) */}
      {newGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 text-xs font-sans">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto border border-aisle-border/40">
            <div className="border-b border-aisle-border/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-aisle-terracotta block mb-1">
                Guest Registry
              </span>
              <h3 className="font-serif text-2xl font-semibold text-aisle-charcoal">
                Add New Guest
              </h3>
            </div>

            <form onSubmit={handleAddGuest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-aisle-charcoal mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newGuestForm.first_name}
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, first_name: e.target.value })}
                    className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-aisle-charcoal mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newGuestForm.last_name}
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, last_name: e.target.value })}
                    className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-aisle-charcoal mb-1">Email</label>
                  <input
                    type="email"
                    value={newGuestForm.email}
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, email: e.target.value })}
                    className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-aisle-charcoal mb-1">Phone (SMS)</label>
                  <input
                    type="tel"
                    placeholder="+14155552671"
                    value={newGuestForm.phone}
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value })}
                    className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-aisle-charcoal mb-1">Party / Household Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vance Household"
                  value={newGuestForm.party_name}
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, party_name: e.target.value })}
                  className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGuestForm.is_vip}
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, is_vip: e.target.checked })}
                    className="rounded border-aisle-border accent-aisle-terracotta h-4 w-4"
                  />
                  <span className="font-medium text-aisle-charcoal">VIP Guest</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGuestForm.plus_one_allowed}
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, plus_one_allowed: e.target.checked })}
                    className="rounded border-aisle-border accent-aisle-terracotta h-4 w-4"
                  />
                  <span className="font-medium text-aisle-charcoal">Plus-One Allowed</span>
                </label>
              </div>

              {/* Has Partner / Spouse dual creation */}
              <div className="rounded-2xl border border-aisle-border p-4 bg-[#FAF7F2] space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-aisle-charcoal">
                  <input
                    type="checkbox"
                    checked={newGuestForm.has_partner}
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, has_partner: e.target.checked })}
                    className="rounded border-aisle-border accent-aisle-terracotta h-4 w-4"
                  />
                  <span>Also create linked Partner / Spouse</span>
                </label>

                {newGuestForm.has_partner && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Partner First Name *"
                        required={newGuestForm.has_partner}
                        value={newGuestForm.partner_first_name}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, partner_first_name: e.target.value })}
                        className="rounded-xl border border-aisle-border p-2.5 bg-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Partner Last Name"
                        value={newGuestForm.partner_last_name}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, partner_last_name: e.target.value })}
                        className="rounded-xl border border-aisle-border p-2.5 bg-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="email"
                        placeholder="Partner Email"
                        value={newGuestForm.partner_email}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, partner_email: e.target.value })}
                        className="rounded-xl border border-aisle-border p-2.5 bg-white text-sm"
                      />
                      <input
                        type="tel"
                        placeholder="Partner Phone"
                        value={newGuestForm.partner_phone}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, partner_phone: e.target.value })}
                        className="rounded-xl border border-aisle-border p-2.5 bg-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewGuestModalOpen(false)}
                  className="flex-1 rounded-full border border-aisle-border py-3 text-xs font-semibold text-aisle-muted hover:bg-aisle-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 rounded-full bg-aisle-charcoal py-3 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isProcessingAction ? 'Adding...' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Broadcast Campaign Modal */}
      {newCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 text-xs font-sans">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto border border-aisle-border/40">
            {/* Header */}
            <div className="border-b border-aisle-border/60 pb-4">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-aisle-terracotta block mb-1">
                Communications Dispatcher
              </span>
              <h3 className="font-serif text-2xl font-semibold text-aisle-charcoal">
                Create Broadcast Campaign
              </h3>
              <p className="text-xs text-aisle-muted mt-1 leading-relaxed">
                Compose invitations, Save-the-Dates, or reminders. Send immediately, schedule for later, or save as a draft.
              </p>
            </div>

            <form onSubmit={handleSendCampaign} className="space-y-5">
              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-semibold text-aisle-charcoal mb-1.5">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-Day RSVP Reminder & Travel Notes"
                  value={newCampaignForm.name}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, name: e.target.value })}
                  className="w-full text-sm rounded-2xl border border-aisle-border p-3.5 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta focus:ring-2 focus:ring-aisle-terracotta/15 transition-all"
                />
              </div>

              {/* Target Audience & Delivery Channel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-aisle-charcoal mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={newCampaignForm.target_audience}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, target_audience: e.target.value })}
                    className="w-full text-sm rounded-2xl border border-aisle-border p-3.5 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta cursor-pointer transition-all"
                  >
                    <option value="all">All Guests ({totalGuests} total)</option>
                    <option value="pending">Pending RSVP Only ({pendingGuests} pending)</option>
                    <option value="attending">Attending Guests Only ({attendingGuests} attending)</option>
                    <option value="declined">Declined Guests Only ({declinedGuests} declined)</option>
                    <option value="vip">VIP Guests Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-aisle-charcoal mb-1.5">
                    Delivery Channel
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#FAF7F2] border border-aisle-border">
                    <button
                      type="button"
                      onClick={() => setNewCampaignForm({ ...newCampaignForm, channel: 'sms' })}
                      disabled={!smsAllowed}
                      title={smsAllowed ? undefined : featureError('sms')}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                        newCampaignForm.channel === 'sms'
                          ? 'bg-white text-aisle-charcoal shadow-sm'
                          : 'text-aisle-muted hover:text-aisle-charcoal'
                      }`}
                    >
                      📱 SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampaignForm({ ...newCampaignForm, channel: 'email' })}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        newCampaignForm.channel === 'email'
                          ? 'bg-white text-aisle-charcoal shadow-sm'
                          : 'text-aisle-muted hover:text-aisle-charcoal'
                      }`}
                    >
                      ✉️ Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampaignForm({ ...newCampaignForm, channel: 'both' })}
                      disabled={!smsAllowed}
                      title={smsAllowed ? undefined : featureError('sms')}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                        newCampaignForm.channel === 'both'
                          ? 'bg-white text-aisle-charcoal shadow-sm'
                          : 'text-aisle-muted hover:text-aisle-charcoal'
                      }`}
                    >
                      ✨ Both
                    </button>
                  </div>
                  {!smsAllowed && (
                    <p className="mt-1.5 text-xs text-aisle-muted">
                      Text messages are part of Premium.{' '}
                      <button type="button" onClick={() => { setNewCampaignModalOpen(false); setActiveTab('dashboard'); }} className="font-semibold text-aisle-terracotta underline cursor-pointer">
                        See plans
                      </button>
                    </p>
                  )}
                </div>
              </div>

              {/* SMS Section */}
              {(newCampaignForm.channel === 'sms' || newCampaignForm.channel === 'both') && (
                <div className="rounded-2xl border border-aisle-border bg-[#FAF7F2]/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-aisle-charcoal">
                      SMS Message Template
                    </label>
                    <span className="text-xs text-aisle-muted font-mono">
                      {newCampaignForm.sms_body.length} characters
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={newCampaignForm.sms_body}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, sms_body: e.target.value })}
                    className="w-full text-sm rounded-xl border border-aisle-border p-3.5 bg-white text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta leading-relaxed"
                    placeholder="Hi {{guest_name}}! ..."
                  />

                  {/* Dynamic Token Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-aisle-muted font-medium mr-1">Insert tag:</span>
                    {[
                      { label: '{{guest_name}}', tag: '{{guest_name}}' },
                      { label: '{{portal_link}}', tag: '{{portal_link}}' },
                      { label: '{{wedding_date}}', tag: '{{wedding_date}}' },
                      { label: '{{rsvp_deadline}}', tag: '{{rsvp_deadline}}' },
                      { label: '{{venue_name}}', tag: '{{venue_name}}' },
                    ].map((chip) => (
                      <button
                        key={chip.tag}
                        type="button"
                        onClick={() =>
                          setNewCampaignForm({
                            ...newCampaignForm,
                            sms_body: newCampaignForm.sms_body + (newCampaignForm.sms_body.endsWith(' ') ? '' : ' ') + chip.tag,
                          })
                        }
                        className="rounded-full bg-white border border-aisle-border px-2 py-0.5 text-xs font-mono text-aisle-terracotta hover:bg-aisle-sand transition-colors cursor-pointer shadow-2xs"
                      >
                        + {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Section */}
              {(newCampaignForm.channel === 'email' || newCampaignForm.channel === 'both') && (
                <div className="rounded-2xl border border-aisle-border bg-[#FAF7F2]/60 p-4 space-y-3">
                  <label className="text-xs font-semibold text-aisle-charcoal block">
                    Email Subject & Body
                  </label>

                  <div>
                    <input
                      type="text"
                      placeholder="Email Subject Line"
                      value={newCampaignForm.subject}
                      onChange={(e) => setNewCampaignForm({ ...newCampaignForm, subject: e.target.value })}
                      className="w-full text-sm rounded-xl border border-aisle-border p-3 bg-white text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={4}
                      value={newCampaignForm.email_body}
                      onChange={(e) => setNewCampaignForm({ ...newCampaignForm, email_body: e.target.value })}
                      className="w-full text-sm rounded-xl border border-aisle-border p-3.5 bg-white text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta leading-relaxed"
                      placeholder="Dear {{guest_name}}, ..."
                    />
                  </div>
                </div>
              )}

              {/* Delivery & Dispatch Options */}
              <div className="rounded-2xl border border-aisle-border bg-[#FAF7F2]/80 p-4 space-y-3">
                <label className="block text-xs font-semibold text-aisle-charcoal">
                  Delivery Timing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCampaignForm({ ...newCampaignForm, dispatch_mode: 'send_now' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                      newCampaignForm.dispatch_mode === 'send_now'
                        ? 'bg-aisle-charcoal text-white shadow-sm'
                        : 'bg-white border border-aisle-border text-aisle-charcoal hover:bg-aisle-sand'
                    }`}
                  >
                    🚀 Send Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCampaignForm({ ...newCampaignForm, dispatch_mode: 'schedule' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                      newCampaignForm.dispatch_mode === 'schedule'
                        ? 'bg-aisle-charcoal text-white shadow-sm'
                        : 'bg-white border border-aisle-border text-aisle-charcoal hover:bg-aisle-sand'
                    }`}
                  >
                    📅 Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCampaignForm({ ...newCampaignForm, dispatch_mode: 'draft' })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                      newCampaignForm.dispatch_mode === 'draft'
                        ? 'bg-aisle-charcoal text-white shadow-sm'
                        : 'bg-white border border-aisle-border text-aisle-charcoal hover:bg-aisle-sand'
                    }`}
                  >
                    📝 Draft
                  </button>
                </div>

                {newCampaignForm.dispatch_mode === 'schedule' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-aisle-charcoal mb-1">
                      Scheduled Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required={newCampaignForm.dispatch_mode === 'schedule'}
                      value={newCampaignForm.scheduled_for}
                      onChange={(e) => setNewCampaignForm({ ...newCampaignForm, scheduled_for: e.target.value })}
                      className="w-full text-sm rounded-xl border border-aisle-border p-3 bg-white text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                    />
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-3 border-t border-aisle-border/60">
                <button
                  type="button"
                  onClick={() => setNewCampaignModalOpen(false)}
                  className="flex-1 rounded-full border border-aisle-border py-3 px-4 text-xs font-semibold text-aisle-muted hover:bg-aisle-sand hover:text-aisle-charcoal cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 rounded-full bg-aisle-charcoal py-3 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-md transition-all"
                >
                  {isProcessingAction
                    ? 'Processing...'
                    : newCampaignForm.dispatch_mode === 'draft'
                    ? 'Save Draft Campaign'
                    : newCampaignForm.dispatch_mode === 'schedule'
                    ? 'Schedule Broadcast'
                    : 'Send Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Registry Item Modal */}
      {newRegistryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 text-xs font-sans">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5 border border-aisle-border/40">
            <div className="border-b border-aisle-border/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-aisle-terracotta block mb-1">
                Registry & Gifts
              </span>
              <h3 className="font-serif text-2xl font-semibold text-aisle-charcoal">
                Add Registry Item or Fund
              </h3>
            </div>

            <form onSubmit={handleCreateRegistryItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-aisle-charcoal mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Honeymoon Flight Fund"
                  value={newRegistryForm.title}
                  onChange={(e) => setNewRegistryForm({ ...newRegistryForm, title: e.target.value })}
                  className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-aisle-charcoal mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Help us reach our dream destination..."
                  value={newRegistryForm.description}
                  onChange={(e) => setNewRegistryForm({ ...newRegistryForm, description: e.target.value })}
                  className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#FAF7F2] border border-aisle-border">
                <input
                  type="checkbox"
                  id="cash_fund_chk"
                  checked={newRegistryForm.is_cash_fund}
                  onChange={(e) => setNewRegistryForm({ ...newRegistryForm, is_cash_fund: e.target.checked })}
                  className="rounded border-aisle-border accent-aisle-terracotta h-4 w-4 cursor-pointer"
                />
                <label htmlFor="cash_fund_chk" className="font-semibold text-aisle-charcoal cursor-pointer">
                  This is a Cash / Honeymoon Fund
                </label>
              </div>

              {newRegistryForm.is_cash_fund ? (
                <div>
                  <label className="block text-xs font-semibold text-aisle-charcoal mb-1">Target Amount ($)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={newRegistryForm.target_amount}
                    onChange={(e) => setNewRegistryForm({ ...newRegistryForm, target_amount: Number(e.target.value) })}
                    className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-aisle-charcoal mb-1">External Registry URL</label>
                  <input
                    type="url"
                    placeholder="https://www.zola.com/..."
                    value={newRegistryForm.external_url}
                    onChange={(e) => setNewRegistryForm({ ...newRegistryForm, external_url: e.target.value })}
                    className="w-full text-sm rounded-2xl border border-aisle-border p-3 bg-[#FAF7F2] text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewRegistryModalOpen(false)}
                  className="flex-1 rounded-full border border-aisle-border py-3 text-xs font-semibold text-aisle-muted hover:bg-aisle-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 rounded-full bg-aisle-charcoal py-3 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isProcessingAction ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest QR Code Modal */}
      {qrModalGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center space-y-4 shadow-2xl">
            <h4 className="font-serif text-lg font-semibold text-aisle-charcoal">
              {qrModalGuest.guest.first_name}'s Private QR Code
            </h4>
            <p className="text-xs text-aisle-muted">Scan to open personalized guest portal</p>
            <div className="flex justify-center p-2 bg-[#FAF7F2] rounded-2xl border border-aisle-border">
              <img src={qrModalGuest.qrDataUrl} alt="QR Code" className="h-48 w-48" />
            </div>
            <button
              onClick={() => setQrModalGuest(null)}
              className="w-full rounded-full bg-aisle-charcoal py-2.5 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Printable Reception Table Card Modal */}
      {tableCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] border-2 border-aisle-gold/60 p-8 text-center space-y-4 shadow-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-aisle-gold-deep">
              Capture The Love
            </span>
            <h3 className="font-serif text-2xl font-semibold text-aisle-charcoal">
              {event.couple_names}
            </h3>
            <p className="text-xs text-aisle-muted">
              Scan to share your photos and leave us a message. No app or account needed.
            </p>
            <div className="flex justify-center p-4 bg-white rounded-2xl border border-aisle-border shadow-sm mx-auto max-w-[200px]">
              <img src={tableCardModal} alt="Table QR" className="h-40 w-40" />
            </div>
            <p className="text-xs font-editorial italic text-aisle-terracotta">
              "We cherish every candid moment through your eyes."
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setTableCardModal(null)}
                className="flex-1 rounded-full border border-aisle-border py-2 text-xs font-semibold text-aisle-muted cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-full bg-aisle-charcoal py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer"
              >
                Print Cards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Event Create/Edit Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
              {editingScheduleItem ? 'Edit Itinerary Event' : 'Add Itinerary Event'}
            </h3>

            <form onSubmit={handleSaveScheduleItem} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-aisle-charcoal">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welcome Sunset Aperitivo & Gelato"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-aisle-charcoal">Location Name / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Hotel Tremezzo Terrace"
                  value={scheduleForm.location_name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, location_name: e.target.value })}
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-aisle-charcoal">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-aisle-charcoal">End Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-aisle-charcoal">Dress Code / Attire Note</label>
                <input
                  type="text"
                  placeholder="e.g. Resort Chic / Linen & Summer Dresses"
                  value={scheduleForm.dress_code}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, dress_code: e.target.value })}
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-aisle-charcoal">Event Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Join us for Aperol spritzes, Franciacorta, and wood-fired focaccia as the sun dips over the lake."
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 p-3 rounded-2xl bg-[#FAF7F2] border border-aisle-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForm.is_vip_only}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, is_vip_only: e.target.checked })}
                    className="rounded border-aisle-border accent-aisle-terracotta h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-aisle-charcoal block">VIP / Family Only</span>
                    <span className="text-xs text-aisle-muted">Only visible to guests flagged as VIP</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForm.requires_rsvp}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, requires_rsvp: e.target.checked })}
                    className="rounded border-aisle-border accent-aisle-terracotta h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-aisle-charcoal block">Require RSVP</span>
                    <span className="text-xs text-aisle-muted">Include in Guest Portal RSVP Wizard Step 2</span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="flex-1 rounded-full border border-aisle-border py-2.5 text-xs font-semibold text-aisle-muted hover:bg-aisle-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 rounded-full bg-aisle-charcoal py-2.5 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isProcessingAction ? 'Saving...' : editingScheduleItem ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom RSVP Question Create/Edit Modal */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
              {editingQuestion ? 'Edit Custom Question' : 'Add Custom RSVP Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-aisle-charcoal">Question Prompt *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which welcome cocktail can we have poured for you?"
                  value={questionForm.prompt}
                  onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })}
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-aisle-charcoal">Response Type</label>
                <select
                  value={questionForm.question_type}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value as any })}
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                >
                  <option value="text">Short Text Response</option>
                  <option value="single_choice">Single Choice (Radio Buttons)</option>
                  <option value="multiple_choice">Multiple Choice (Checkboxes)</option>
                </select>
              </div>

              {questionForm.question_type !== 'text' && (
                <div>
                  <label className="block font-semibold mb-1 text-aisle-charcoal">Choices (Comma Separated) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Franciacorta Sparkling, Aperol Spritz, White Peach Bellini, Non-Alcoholic Fizz"
                    value={questionForm.options_str}
                    onChange={(e) => setQuestionForm({ ...questionForm, options_str: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              )}

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-aisle-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionForm.is_required}
                    onChange={(e) => setQuestionForm({ ...questionForm, is_required: e.target.checked })}
                    className="rounded border-aisle-border accent-aisle-terracotta h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-aisle-charcoal block">Required Field</span>
                    <span className="text-xs text-aisle-muted">Guests must answer this question before submitting RSVP</span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="flex-1 rounded-full border border-aisle-border py-2.5 text-xs font-semibold text-aisle-muted hover:bg-aisle-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 rounded-full bg-aisle-charcoal py-2.5 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isProcessingAction ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Planning Task Create/Edit Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-aisle-charcoal">
              {editingTask ? 'Edit Planning Task' : 'Add Planning Task'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-aisle-charcoal">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finalize menu tasting & wine pairings"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-aisle-charcoal">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Catering, Venue, Attire, Floral"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-aisle-charcoal">Assignee / Owner</label>
                  <input
                    type="text"
                    placeholder="e.g. Couple, Planner, Maid of Honor"
                    value={taskForm.owner}
                    onChange={(e) => setTaskForm({ ...taskForm, owner: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-aisle-charcoal">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-aisle-charcoal">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                  >
                    <option value="todo">To Do</option>
                    <option value="doing">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-aisle-charcoal">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] focus:outline-none focus:border-aisle-terracotta"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="flex-1 rounded-full border border-aisle-border py-2.5 text-xs font-semibold text-aisle-muted hover:bg-aisle-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 rounded-full bg-aisle-charcoal py-2.5 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isProcessingAction ? 'Saving...' : editingTask ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GROUP INTO PARTY MODAL */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="w-full max-w-md rounded-3xl border border-aisle-border bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-aisle-border/60 pb-3">
              <div>
                <h3 className="font-serif text-lg font-semibold text-aisle-charcoal">
                  Group Guests into Household Party
                </h3>
                <p className="text-xs text-aisle-muted mt-0.5">
                  Party members will share a linked invitation & can RSVP together.
                </p>
              </div>
              <button
                onClick={() => setGroupModalOpen(false)}
                className="text-aisle-muted hover:text-aisle-charcoal cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Guests preview */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-bold tracking-wider text-aisle-muted block">
                Selected Guests ({selectedGuestIds.length})
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-[#FAF7F2] border border-aisle-border/60">
                {selectedGuestIds.map((id) => {
                  const g = guests.find((item) => item.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-aisle-border text-xs font-medium text-aisle-charcoal shadow-2xs"
                    >
                      <span>{g?.first_name} {g?.last_name || ''}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Grouping Mode: Create New vs Add to Existing */}
            <div className="space-y-3">
              <label className="text-xs uppercase font-bold tracking-wider text-aisle-muted block">
                Destination Party
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGroupTargetPartyId('new')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                    groupTargetPartyId === 'new'
                      ? 'bg-aisle-charcoal text-white border-aisle-charcoal shadow-xs'
                      : 'bg-white border-aisle-border text-aisle-charcoal hover:bg-aisle-sand/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Party</span>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={existingParties.length === 0}
                  onClick={() => {
                    if (existingParties.length > 0) setGroupTargetPartyId(existingParties[0].id);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer disabled:opacity-40 ${
                    groupTargetPartyId !== 'new'
                      ? 'bg-aisle-charcoal text-white border-aisle-charcoal shadow-xs'
                      : 'bg-white border-aisle-border text-aisle-charcoal hover:bg-aisle-sand/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>Add to Existing ({existingParties.length})</span>
                  </div>
                </button>
              </div>

              {groupTargetPartyId === 'new' ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-aisle-charcoal block">
                    Household Party Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. The Beaufort-Thorne Family"
                    value={groupPartyName}
                    onChange={(e) => setGroupPartyName(e.target.value)}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-white text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-aisle-charcoal block">
                    Select Existing Party
                  </label>
                  <select
                    value={groupTargetPartyId}
                    onChange={(e) => setGroupTargetPartyId(e.target.value)}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-white text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  >
                    {existingParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.members.length} members)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-aisle-border/60">
              <button
                type="button"
                onClick={() => setGroupModalOpen(false)}
                className="rounded-full border border-aisle-border px-4 py-2 text-xs font-semibold text-aisle-muted hover:text-aisle-charcoal cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGrouping}
                disabled={isProcessingAction || (groupTargetPartyId === 'new' && !groupPartyName.trim())}
                className="rounded-full bg-aisle-charcoal px-5 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-sm transition-all"
              >
                {isProcessingAction ? 'Grouping...' : 'Group Guests'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE PARTY MODAL */}
      {managePartyModalOpen && activePartyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="w-full max-w-lg rounded-3xl border border-aisle-border bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-aisle-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-full bg-amber-100 text-amber-900">
                    <Users className="h-4 w-4" />
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-aisle-charcoal">
                    Manage Household Party
                  </h3>
                </div>
                <p className="text-xs text-aisle-muted mt-0.5">
                  Edit party name, add or remove members, or dissolve the group.
                </p>
              </div>
              <button
                onClick={() => setManagePartyModalOpen(false)}
                className="text-aisle-muted hover:text-aisle-charcoal cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 1. Rename Party */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-aisle-border">
              <label className="text-xs uppercase font-bold tracking-wider text-aisle-muted block">
                Party / Household Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activePartyName}
                  onChange={(e) => setActivePartyName(e.target.value)}
                  className="flex-1 rounded-xl border border-aisle-border px-3 py-2 bg-white text-xs text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta font-medium"
                />
                <button
                  type="button"
                  onClick={handleRenameParty}
                  disabled={isProcessingAction || !activePartyName.trim()}
                  className="rounded-xl bg-aisle-charcoal px-4 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </div>

            {/* 2. Current Members List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase font-bold tracking-wider text-aisle-muted">
                  Current Members (
                  {existingParties.find((p) => p.id === activePartyId)?.members.length || 0}
                  )
                </label>
                <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                  Shared RSVP Link Active
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-aisle-border/40 border border-aisle-border/60 rounded-2xl p-2 bg-white">
                {existingParties
                  .find((p) => p.id === activePartyId)
                  ?.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 hover:bg-[#FAF7F2]/50 rounded-xl transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-aisle-charcoal flex items-center gap-1.5">
                          <span>{member.first_name} {member.last_name || ''}</span>
                          {member.is_vip && (
                            <span className="rounded-full bg-aisle-gold/20 px-1.5 py-0.2 text-xs font-bold text-aisle-gold-deep">
                              VIP
                            </span>
                          )}
                          <span
                            className={`text-xs px-1.5 py-0.2 rounded-full font-medium ${
                              member.rsvp_status === 'attending'
                                ? 'bg-emerald-100 text-emerald-800'
                                : member.rsvp_status === 'declined'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-aisle-sand text-aisle-charcoal'
                            }`}
                          >
                            {member.rsvp_status}
                          </span>
                        </div>
                        <div className="text-xs text-aisle-muted">
                          {member.email || member.phone || 'No direct contact'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveGuestFromParty(member.id)}
                        disabled={isProcessingAction}
                        title="Remove member from party"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 cursor-pointer"
                      >
                        <UserMinus className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* 3. Add Guest to Party */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-aisle-border">
              <label className="text-xs uppercase font-bold tracking-wider text-aisle-muted block">
                Add Another Guest to This Party
              </label>
              <div className="flex gap-2">
                <select
                  value={addGuestToPartySelectedId}
                  onChange={(e) => setAddGuestToPartySelectedId(e.target.value)}
                  className="flex-1 rounded-xl border border-aisle-border px-3 py-2 bg-white text-xs text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                >
                  <option value="">-- Choose guest to add --</option>
                  {guests
                    .filter((g) => g.party_id !== activePartyId && (g as any).household_id !== activePartyId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.first_name} {g.last_name || ''} {g.party_name ? `(currently in ${g.party_name})` : ''}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddGuestToActiveParty(addGuestToPartySelectedId)}
                  disabled={isProcessingAction || !addGuestToPartySelectedId}
                  className="rounded-xl bg-aisle-charcoal px-3.5 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* 4. Danger Zone: Dissolve Party */}
            <div className="flex items-center justify-between pt-3 border-t border-aisle-border/60">
              <button
                type="button"
                onClick={handleDissolveParty}
                disabled={isProcessingAction}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Dissolve Entire Party</span>
              </button>
              <button
                type="button"
                onClick={() => setManagePartyModalOpen(false)}
                className="rounded-full bg-aisle-charcoal px-5 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE COMMUNICATION TEMPLATE MODAL */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs font-sans">
          <div className="w-full max-w-lg rounded-3xl border border-aisle-border bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-aisle-border/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-full bg-aisle-charcoal text-white">
                    <Edit3 className="h-4 w-4" />
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-aisle-charcoal">
                    {editingTemplate ? `Edit "${editingTemplate.name}"` : 'Create Custom Template'}
                  </h3>
                </div>
                <p className="text-xs text-aisle-muted mt-0.5">
                  Customize the SMS copy, email wording, and dynamic smart tags.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="text-aisle-muted hover:text-aisle-charcoal cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Helper: Dynamic Variable Tags */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 space-y-1.5">
              <span className="text-xs uppercase font-bold text-amber-900 tracking-wider block">
                ✨ Dynamic Smart Tags (Click to Insert into SMS)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Couple Names', tag: '{coupleNames}' },
                  { label: 'Guest Name', tag: '{name}' },
                  { label: 'Wedding Date', tag: '{eventDate}' },
                  { label: 'Venue', tag: '{venueName}' },
                  { label: 'RSVP Deadline', tag: '{rsvpDeadline}' },
                  { label: 'Private Link', tag: '{link}' },
                ].map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable('sms_body', v.tag)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-300 text-xs font-mono text-amber-900 hover:bg-amber-100 cursor-pointer shadow-2xs"
                  >
                    <span>+ {v.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-aisle-muted mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] text-xs font-semibold text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-aisle-muted mb-1">
                    Channel Format
                  </label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value as any })}
                    className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] text-xs text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                  >
                    <option value="both">Both SMS & Email</option>
                    <option value="sms">SMS Text Message Only</option>
                    <option value="email">Email Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-aisle-muted mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="e.g. Formal Wedding Invitation: {coupleNames}"
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] text-xs text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs uppercase font-bold tracking-wider text-aisle-muted">
                    SMS Text Body (Twilio)
                  </label>
                  <span className="text-xs font-mono text-aisle-muted">
                    {templateForm.sms_body.length} chars (~{Math.ceil((templateForm.sms_body.length || 1) / 160)} SMS)
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={templateForm.sms_body}
                  onChange={(e) => setTemplateForm({ ...templateForm, sms_body: e.target.value })}
                  placeholder="{coupleNames} invite you to celebrate..."
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] text-xs text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-aisle-muted mb-1">
                  Email Message Body (Optional Markdown/Text)
                </label>
                <textarea
                  rows={4}
                  value={templateForm.email_body}
                  onChange={(e) => setTemplateForm({ ...templateForm, email_body: e.target.value })}
                  placeholder="Dear {name},\n\nWe request the honour of your presence..."
                  className="w-full rounded-xl border border-aisle-border p-2.5 bg-[#FAF7F2] text-xs text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta leading-relaxed font-sans"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-aisle-border/60">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="flex-1 rounded-full border border-aisle-border py-2.5 text-xs font-semibold text-aisle-muted hover:text-aisle-charcoal cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 rounded-full bg-aisle-charcoal py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-aisle-terracotta disabled:opacity-50 cursor-pointer shadow-sm transition-all"
                >
                  {isProcessingAction ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
