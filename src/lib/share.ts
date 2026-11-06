/** A WhatsApp click-to-chat link that sends the guest their personal invitation link. */
export function whatsappShareUrl(
  guest: { first_name: string; phone?: string | null },
  event: { couple_names: string },
  guestLink: string
): string {
  const text = `Hi ${guest.first_name}, you're invited to ${event.couple_names}'s wedding! Here is your personal invitation: ${guestLink}`;
  const digits = (guest.phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
