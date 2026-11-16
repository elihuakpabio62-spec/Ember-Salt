import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, ExternalLink, MapPin, MessageSquare } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';
import { useToast } from '@/src/context/ToastContext';
import { buildWhatsAppInquiryUrl, formatWhatsAppDisplay } from '@/src/lib/whatsapp';
import { submitContactMessage } from '@/src/services/menuService';

export function ContactPage() {
  const { storeSettings } = useCart();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Private Dining & Catering');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (name.trim().length < 2) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 10) {
      setErrorMessage('Please enter a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({ name, email, phone, subject, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      showToast('success', 'Inquiry sent', 'Our kitchen team will respond shortly.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to send your message.';
      setErrorMessage(msg);
      showToast('error', 'Could not send message', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappDirectHref = buildWhatsAppInquiryUrl(
    storeSettings.whatsapp_number,
    `Hello ${storeSettings.kitchen_name}, I would like to inquire about catering / an order.`
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1F4E3D]">
          Contact &amp; Catering
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[#1A1917]">
          Speak with the Kitchen
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#645F58]">
          Reach out for group catering platters, allergen questions, or large scheduled pickups.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        {/* Info Column */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-[#E6E1D8] bg-white p-6 space-y-5">
            <div className="flex items-start gap-3.5">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#1F4E3D]" />
              <div>
                <h2 className="text-sm font-semibold text-[#1A1917]">Kitchen Address</h2>
                <p className="mt-1 text-sm text-[#645F58]">{storeSettings.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 border-t border-[#E6E1D8] pt-5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#1F4E3D]" />
              <div>
                <h2 className="text-sm font-semibold text-[#1A1917]">Hours of Service</h2>
                <p className="mt-1 text-sm text-[#645F58]">{storeSettings.opening_hours}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 border-t border-[#E6E1D8] pt-5">
              <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#1F4E3D]" />
              <div>
                <h2 className="text-sm font-semibold text-[#1A1917]">Direct WhatsApp Line</h2>
                <p className="mt-1 font-mono text-sm text-[#645F58] tabular-nums">
                  {formatWhatsAppDisplay(storeSettings.whatsapp_number)}
                </p>
                <a
                  href={whatsappDirectHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1F4E3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#173B2E]"
                >
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-[#E6E1D8] bg-white p-6 sm:p-8">
            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[#1F4E3D]" />
                <h2 className="mt-4 font-display text-2xl font-semibold text-[#1A1917]">
                  Message Received
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#645F58]">
                  Thank you for reaching out to {storeSettings.kitchen_name}. Our team will follow
                  up shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-6 inline-flex min-h-[40px] items-center rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-5 py-2 text-sm font-medium text-[#1A1917] hover:bg-[#F2EFE9]"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-[#1A1917]">
                      Your Name <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Elena Brooks"
                      className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-[#1A1917]">
                      Email Address <span className="text-[#B91C1C]">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="elena@example.com"
                      className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium text-[#1A1917]">
                      Phone (Optional)
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (503) 555-0142"
                      className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-[#1A1917]">
                      Topic
                    </label>
                    <select
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                    >
                      <option value="Private Dining & Catering">Private Dining &amp; Catering</option>
                      <option value="Allergen & Dietary Question">Allergen &amp; Dietary Question</option>
                      <option value="Large Group Pickup">Large Group Pickup</option>
                      <option value="General Feedback">General Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-[#1A1917]">
                    Message <span className="text-[#B91C1C]">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your event date, guest count, or question..."
                    className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
                  />
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F4E3D] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#173B2E] disabled:opacity-60"
                >
                  {submitting ? 'Sending Message...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
