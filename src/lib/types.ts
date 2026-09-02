export interface EventCustomSections {
  our_story?: {
    enabled?: boolean;
    text?: string;
    image_url?: string;
  };
  registry?: {
    enabled?: boolean;
    url?: string;
    message?: string;
    venmo_handle?: string;
    zelle_info?: string;
    cashapp_tag?: string;
    paypal_handle?: string;
    payout_note?: string;
  };
  travel?: {
    enabled?: boolean;
    hotel_info?: string;
    shuttle_info?: string;
  };
  faq?: {
    enabled?: boolean;
    items?: Array<{ question: string; answer: string }>;
  };
  local_recs?: {
    enabled?: boolean;
    items?: Array<{ name: string; type: string; description: string; image_url?: string }>;
  };
  wedding_party?: {
    enabled?: boolean;
    members?: Array<{ name: string; role: string; bio: string; photo_url?: string }>;
  };
  planning?: {
    tasks?: PlanningTaskRecord[];
    updatedAt?: string;
  };
  website?: {
    status?: 'draft' | 'preview' | 'live';
    template?: string;
    design_id?: string;
    palette_id?: string;
    hero_label?: string;
    welcome_message?: string;
    custom_domain?: string;
    cover_image_url?: string;
    story_image_url?: string;
    venue_image_url?: string;
    gallery_image_urls?: string[];
  };
}

export interface EventRecord {
  id: string;
  slug: string;
  admin_token: string;
  couple_names: string;
  partner_one_name?: string | null;
  partner_two_name?: string | null;
  admin_email: string;
  wedding_date: string;
  rsvp_deadline: string;
  allow_late_rsvp: boolean;
  venue_name: string;
  venue_address: string;
  venue_lat?: number | null;
  venue_lng?: number | null;
  welcome_message?: string | null;
  our_story?: string | null;
  cover_image_url?: string | null;
  story_image_url?: string | null;
  venue_image_url?: string | null;
  gallery_image_urls?: string[];
  dress_code?: string | null;
  travel_info?: string | null;
  custom_domain?: string | null;
  theme_id: string;
  theme_config?: Record<string, any>;
  custom_sections?: EventCustomSections | Record<string, any> | null;
  is_live: boolean;
  is_ready_for_testing: boolean;
  setup_completed?: boolean;
  setup_completed_at?: string | null;
  reminder_last_sent_at?: string | null;
  reminder_last_count?: number;
  launch_notes?: string | null;
  publish_notes?: string | null;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestRecord {
  id: string;
  event_id: string;
  party_id?: string | null;
  party_name?: string | null;
  access_token: string;
  first_name: string;
  last_name?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  is_vip: boolean;
  relationship?: string | null;
  mailing_address?: string | null;
  connection_to_couple?: string | null;
  tags?: string[];
  rsvp_status: 'pending' | 'attending' | 'declined';
  meal_choice?: string | null;
  dietary_notes?: string | null;
  dietary_tags?: string[];
  plus_one_allowed: boolean;
  plus_one_name?: string | null;
  plus_one_meal?: string | null;
  plus_one_dietary?: string | null;
  invite_sent_at?: string | null;
  invite_last_sent_at?: string | null;
  save_the_date_sent_at?: string | null;
  reminder_sent_at?: string | null;
  last_sent_at?: string | null;
  last_clicked_at?: string | null;
  last_opened_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleItemRecord {
  id: string;
  event_id: string;
  title: string;
  location_name?: string | null;
  start_time: string;
  end_time?: string | null;
  description?: string | null;
  dress_code?: string | null;
  is_vip_only: boolean;
  visibility_tags?: string[];
  requires_rsvp: boolean;
  display_order: number;
  created_at: string;
}

export interface GuestScheduleRsvpRecord {
  id: string;
  schedule_item_id: string;
  guest_id: string;
  status: 'attending' | 'declined' | 'pending';
  updated_at?: string;
  created_at: string;
}

export interface CustomRsvpQuestionRecord {
  id: string;
  event_id: string;
  prompt: string;
  question_text?: string;
  question_type: 'text' | 'single_choice' | 'multiple_choice';
  options: string[];
  is_required: boolean;
  display_order: number;
  created_at: string;
}

export interface CustomRsvpResponseRecord {
  id: string;
  question_id: string;
  guest_id: string;
  response_value: any;
  response_text?: string;
  created_at: string;
}

export interface RegistryItemRecord {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  external_url?: string | null;
  url?: string | null;
  is_cash_fund: boolean;
  target_amount?: number | null;
  current_amount: number;
  display_order: number;
  created_at: string;
}

export interface RegistryContributionRecord {
  id: string;
  registry_item_id: string;
  guest_id?: string | null;
  contributor_name: string;
  amount: number;
  message?: string | null;
  created_at: string;
}

export interface PhotoRecord {
  id: string;
  event_id: string;
  guest_id?: string | null;
  image_url: string;
  storage_path?: string | null;
  caption?: string | null;
  guest_name?: string;
  is_approved: boolean;
  created_at: string;
}

export interface PlanningTaskRecord {
  id: string;
  event_id?: string;
  title: string;
  owner?: string | null;
  due_date?: string | null;
  dueDate?: string;
  category: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'high' | 'medium' | 'low';
  display_order?: number;
  created_at?: string;
}

export type LifecycleType = 'invitation' | 'save_the_date' | 'reminder' | 'update';
export type CommunicationChannel = 'sms' | 'email' | 'both';
export type CommunicationAudience = 'all' | 'pending' | 'attending' | 'declined' | 'vip';

export interface CommunicationTemplateRecord {
  id: string;
  event_id: string;
  template_key?: string;
  name: string;
  lifecycle_type: LifecycleType;
  channel: CommunicationChannel;
  subject?: string | null;
  email_body?: string | null;
  sms_body?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CommunicationCampaignRecord {
  id: string;
  event_id: string;
  template_id?: string | null;
  name: string;
  lifecycle_type: LifecycleType;
  target_audience: CommunicationAudience;
  audience?: CommunicationAudience;
  channel: CommunicationChannel;
  subject?: string | null;
  body?: string | null;
  sms_body?: string | null;
  scheduled_for?: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'failed';
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  qr_scanned_count: number;
  failed_count: number;
  sent_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CommunicationMessageRecord {
  id: string;
  campaign_id?: string | null;
  event_id: string;
  guest_id: string;
  template_id?: string | null;
  lifecycle_type?: LifecycleType;
  channel: 'sms' | 'email';
  recipient_address: string;
  rendered_subject?: string | null;
  rendered_body?: string | null;
  tracking_token: string;
  tracking_url?: string | null;
  qr_code_svg?: string | null;
  provider_message_id?: string | null;
  provider_status?: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'dry_run';
  provider_error?: string | null;
  status: 'queued' | 'sent' | 'dry_run' | 'failed' | 'opened' | 'clicked' | 'qr_scanned';
  sent_at?: string | null;
  delivered_at?: string | null;
  opened_at?: string | null;
  clicked_at?: string | null;
  qr_scanned_at?: string | null;
  created_at: string;
}

export interface CommunicationEventRecord {
  id: string;
  message_id?: string | null;
  event_id: string;
  guest_id?: string | null;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TemplateMediaAssetRecord {
  id: string;
  title: string;
  category: 'hero' | 'background' | 'story' | 'venue' | 'gallery' | 'texture' | 'other';
  image_url: string;
  storage_path?: string | null;
  content_type?: string | null;
  file_size?: number | null;
  created_at: string;
}

export type GuestPortalSectionId =
  | 'rsvp'
  | 'schedule'
  | 'our-story'
  | 'travel'
  | 'registry'
  | 'faq'
  | 'local-recs'
  | 'wedding-party'
  | 'photos';

export type GuestPortalSectionStyleTarget =
  | 'navigation'
  | 'welcome'
  | 'hero'
  | 'countdown'
  | 'story'
  | 'local'
  | GuestPortalSectionId;

export type GuestPortalCanvasWidth = 'narrow' | 'medium' | 'wide' | 'full';
export type GuestPortalBackgroundMode = 'none' | 'soft-fill' | 'full-bleed' | 'pattern';
export type GuestPortalContainerLayout = 'card' | 'borderless' | 'full-width' | 'inset';
export type GuestPortalContainerPadding = 'compact' | 'balanced' | 'spacious';
export type GuestPortalTextFrameStyle = 'none' | 'outline' | 'filled' | 'glass';
export type GuestPortalOpeningStyle = 'wax-seal' | 'envelope' | 'curtain' | 'minimal-fade' | 'venue-reveal' | 'paper-cut' | 'photo-reveal';

export interface GuestPortalSectionStyle {
  useCustomStyle?: boolean;
  containerLayout?: GuestPortalContainerLayout;
  containerPadding?: GuestPortalContainerPadding;
  containerSurface?: string;
  containerBorder?: string;
  containerShadow?: string;
  containerRadius?: number;
  containerBorderWidth?: number;
  backgroundMode?: GuestPortalBackgroundMode;
  backgroundImageUrl?: string;
  contentImageUrl?: string;
  textFrameStyle?: GuestPortalTextFrameStyle;
  textFrameRadius?: number;
  textFrameBorderWidth?: number;
}

export type GuestPortalSectionStyleMap = Partial<
  Record<GuestPortalSectionStyleTarget, GuestPortalSectionStyle>
>;

export interface TemplateDesignRecord {
  id: string;
  slug?: string;
  name: string;
  taxonomy: string;
  description?: string | null;
  best_for?: string | null;
  opening_style: GuestPortalOpeningStyle;
  hero_treatment: 'photo-card' | 'paper-frame' | 'dark-card' | 'minimal-type' | 'botanical-frame' | 'coastal-postcard' | 'editorial-split' | 'postcard';
  motif: 'floral' | 'minimal' | 'gilded' | 'botanical' | 'blush' | 'coastal' | 'vineyard' | 'marigold' | 'black-tie' | 'editorial';
  font_family: 'classic-serif' | 'modern-sans' | 'vintage-editorial';
  canvas_width: GuestPortalCanvasWidth;
  bg_color: string;
  text_color: string;
  accent_color: string;
  muted_color: string;
  surface_color: string;
  border_color: string;
  shadow_color: string;
  page_background_image_url?: string;
  page_background_mode?: GuestPortalBackgroundMode;
  container_surface_color?: string;
  container_border_color?: string;
  container_shadow_color?: string;
  container_radius?: number;
  container_border_width?: number;
  container_layout?: GuestPortalContainerLayout;
  container_padding?: GuestPortalContainerPadding;
  text_frame_style?: GuestPortalTextFrameStyle;
  text_frame_radius?: number;
  text_frame_border_width?: number;
  section_order: string[];
  hidden_sections: string[];
  section_styles?: GuestPortalSectionStyleMap;
  per_section_styles?: Record<string, any>;
  sample_image_url?: string | null;
  eyebrow_text?: string;
  poetic_line?: string;
  invitation_phrase?: string;
  floron?: string;
  border_flair?: 'double-line' | 'hairline-gold' | 'arch' | 'clean' | 'arabesque' | 'botanical-crest';
  is_dark?: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}
