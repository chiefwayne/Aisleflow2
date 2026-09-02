import { EventRecord, GuestRecord } from './types';

export function renderTemplateVariables(
  templateText: string,
  event: EventRecord,
  guest: GuestRecord,
  baseUrl: string,
  trackingToken?: string
): string {
  const guestLink = trackingToken 
    ? `${baseUrl}/t/${trackingToken}`
    : `${baseUrl}/g/${guest.access_token}`;
  
  const qrLink = `${baseUrl}/g/${guest.access_token}`;

  return templateText
    .replace(/{name}/g, guest.first_name + (guest.last_name ? ` ${guest.last_name}` : ''))
    .replace(/{firstName}/g, guest.first_name)
    .replace(/{link}/g, guestLink)
    .replace(/{qrLink}/g, qrLink)
    .replace(/{coupleNames}/g, event.couple_names)
    .replace(/{eventDate}/g, new Date(event.wedding_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
    .replace(/{venueName}/g, event.venue_name)
    .replace(/{venueAddress}/g, event.venue_address)
    .replace(/{rsvpDeadline}/g, new Date(event.rsvp_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
}

export function generateTrackingToken(): string {
  return 'trk_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
