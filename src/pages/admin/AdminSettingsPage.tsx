import { useEffect, useState, type FormEvent } from 'react';
import { useCart } from '@/src/context/CartContext';
import { useToast } from '@/src/context/ToastContext';
import { updateStoreSettings } from '@/src/services/menuService';

export function AdminSettingsPage() {
  const { storeSettings, refreshStoreSettings } = useCart();
  const { showToast } = useToast();

  const [kitchenName, setKitchenName] = useState(storeSettings.kitchen_name);
  const [whatsappNumber, setWhatsappNumber] = useState(storeSettings.whatsapp_number);
  const [address, setAddress] = useState(storeSettings.address);
  const [openingHours, setOpeningHours] = useState(storeSettings.opening_hours);
  const [deliveryFee, setDeliveryFee] = useState(String(storeSettings.delivery_fee));
  const [freeThreshold, setFreeThreshold] = useState(
    String(storeSettings.free_delivery_threshold)
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setKitchenName(storeSettings.kitchen_name);
    setWhatsappNumber(storeSettings.whatsapp_number);
    setAddress(storeSettings.address);
    setOpeningHours(storeSettings.opening_hours);
    setDeliveryFee(String(storeSettings.delivery_fee));
    setFreeThreshold(String(storeSettings.free_delivery_threshold));
  }, [storeSettings]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');
    if (cleanWhatsapp.length < 7) {
      setErrorMessage('Enter a valid WhatsApp phone number including country code.');
      return;
    }

    setSaving(true);
    try {
      await updateStoreSettings({
        kitchen_name: kitchenName,
        whatsapp_number: cleanWhatsapp,
        address,
        opening_hours: openingHours,
        delivery_fee: Number(deliveryFee.replace(/,/g, '')) || 0,
        free_delivery_threshold: Number(freeThreshold.replace(/,/g, '')) || 0,
      });
      await refreshStoreSettings();
      showToast('success', 'Store settings updated', 'Changes are live across the storefront.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not update settings.';
      setErrorMessage(msg);
      showToast('error', 'Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[#1A1917]">Store Settings</h1>
        <p className="mt-1 text-sm text-[#645F58]">
          Configure your WhatsApp ordering number, service hours, and delivery fees.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-xl border border-[#E6E1D8] bg-white p-6"
      >
        <div>
          <label htmlFor="set-name" className="block text-sm font-medium text-[#1A1917]">
            Kitchen Name
          </label>
          <input
            id="set-name"
            type="text"
            required
            value={kitchenName}
            onChange={(e) => setKitchenName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="set-whatsapp" className="block text-sm font-medium text-[#1A1917]">
            WhatsApp Ordering Number (digits with country code)
          </label>
          <input
            id="set-whatsapp"
            type="text"
            required
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="15552348910"
            className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 font-mono text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="set-address" className="block text-sm font-medium text-[#1A1917]">
            Kitchen Street Address
          </label>
          <input
            id="set-address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="set-hours" className="block text-sm font-medium text-[#1A1917]">
            Opening Hours
          </label>
          <input
            id="set-hours"
            type="text"
            required
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="set-fee" className="block text-sm font-medium text-[#1A1917]">
              Local Delivery Fee (NGN &#8358;)
            </label>
            <input
              id="set-fee"
              type="text"
              inputMode="decimal"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 font-mono text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="set-threshold" className="block text-sm font-medium text-[#1A1917]">
              Free Delivery Threshold (NGN &#8358;)
            </label>
            <input
              id="set-threshold"
              type="text"
              inputMode="decimal"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#E6E1D8] bg-[#FAF9F7] px-3.5 py-2.5 font-mono text-sm text-[#1A1917] focus:border-[#1F4E3D] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-[#B91C1C]/30 bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#B91C1C]">
            {errorMessage}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[42px] rounded-lg bg-[#1F4E3D] px-5 py-2 text-sm font-medium text-white hover:bg-[#173B2E] disabled:opacity-60"
          >
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
