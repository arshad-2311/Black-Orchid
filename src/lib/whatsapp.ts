/**
 * General Restaurant Contact WhatsApp helper (Preserved for general website inquiry buttons)
 */
export function getGeneralWhatsAppContactLink(phone: string = "+919585018502", message: string = "Hello Black Orchid, I have a general inquiry."): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
