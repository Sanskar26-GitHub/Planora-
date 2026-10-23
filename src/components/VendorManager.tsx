import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  DollarSign,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import { VendorItem, PlanoraEventData, VendorBookingStatus, VendorPaymentStatus } from '../types';
import { calculateVendorSummary, formatCurrency, roundCurrency } from '../utils/calculations';
import { validateVendorInput } from '../utils/validation';
import { storage } from '../services/storage';

interface VendorManagerProps {
  eventData: PlanoraEventData;
  onRefresh: () => void;
}

export const VendorManager: React.FC<VendorManagerProps> = ({ eventData, onRefresh }) => {
  const { event, categories, vendors } = eventData;
  const vendorSummary = calculateVendorSummary(vendors);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showVendorModal, setShowVendorModal] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);

  const [vendorForm, setVendorForm] = useState<Partial<VendorItem>>({
    name: '',
    category: categories[0]?.name || 'Venue',
    contactName: '',
    phone: '',
    email: '',
    quotedAmount: 0,
    bookingStatus: 'quoted',
    depositPaid: 0,
    paymentStatus: 'unpaid',
    deadline: '',
    notes: '',
  });
  const [vendorErrors, setVendorErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVendorModal) {
        setShowVendorModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVendorModal]);

  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      name: '',
      category: categories[0]?.name || 'Venue',
      contactName: '',
      phone: '',
      email: '',
      quotedAmount: 0,
      bookingStatus: 'quoted',
      depositPaid: 0,
      paymentStatus: 'unpaid',
      deadline: '',
      notes: '',
    });
    setVendorErrors({});
    setShowVendorModal(true);
  };

  const handleOpenEditVendor = (v: VendorItem) => {
    setEditingVendor(v);
    setVendorForm({ ...v });
    setVendorErrors({});
    setShowVendorModal(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateVendorInput(vendorForm);
    if (!validation.isValid) {
      setVendorErrors(validation.errors);
      return;
    }

    const quoted = Number(vendorForm.quotedAmount || 0);
    const deposit = Number(vendorForm.depositPaid || 0);
    const remaining = Math.max(0, quoted - deposit);

    let paymentStatus: VendorPaymentStatus = 'unpaid';
    if (deposit >= quoted && quoted > 0) {
      paymentStatus = 'fully_paid';
    } else if (deposit > 0) {
      paymentStatus = 'deposit_paid';
    }

    if (editingVendor) {
      const updated: VendorItem = {
        ...editingVendor,
        name: vendorForm.name!.trim(),
        category: vendorForm.category || 'General',
        contactName: vendorForm.contactName?.trim() || '',
        phone: vendorForm.phone?.trim() || '',
        email: vendorForm.email?.trim() || '',
        quotedAmount: quoted,
        bookingStatus: (vendorForm.bookingStatus as VendorBookingStatus) || 'quoted',
        depositPaid: deposit,
        remainingBalance: remaining,
        paymentStatus,
        deadline: vendorForm.deadline || undefined,
        notes: vendorForm.notes?.trim() || undefined,
      };
      storage.updateVendor(event.id, updated);
    } else {
      const created: VendorItem = {
        id: `ven-${Date.now()}`,
        name: vendorForm.name!.trim(),
        category: vendorForm.category || 'General',
        contactName: vendorForm.contactName?.trim() || '',
        phone: vendorForm.phone?.trim() || '',
        email: vendorForm.email?.trim() || '',
        quotedAmount: quoted,
        bookingStatus: (vendorForm.bookingStatus as VendorBookingStatus) || 'quoted',
        depositPaid: deposit,
        remainingBalance: remaining,
        paymentStatus,
        deadline: vendorForm.deadline || undefined,
        notes: vendorForm.notes?.trim() || undefined,
        isAiSuggested: false,
      };
      storage.addVendor(event.id, created);
    }

    setShowVendorModal(false);
    setEditingVendor(null);
    onRefresh();
  };

  const handleDeleteVendor = (vendorId: string) => {
    storage.deleteVendor(event.id, vendorId);
    onRefresh();
  };

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    if (
      searchQuery &&
      !v.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !v.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && v.bookingStatus !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: VendorBookingStatus) => {
    switch (status) {
      case 'booked':
        return 'text-[#166534] bg-[#dcfce7] border-[#bbf7d0]';
      case 'quoted':
        return 'text-[#854d0e] bg-[#fef9c3] border-[#fef08a]';
      case 'contacted':
        return 'text-[#1e40af] bg-[#dbeafe] border-[#bfdbfe]';
      case 'prospective':
        return 'text-[#475569] bg-[#f1f5f9] border-[#e2e8f0]';
      case 'cancelled':
        return 'text-[#991b1b] bg-[#fee2e2] border-[#fecaca]';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e1d7] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#142d22]">
            Vendor & Partner Management
          </h1>
          <p className="text-xs text-[#716859]">
            Track contracts, proposals, deposits, and contact directories
          </p>
        </div>

        <button
          onClick={handleOpenAddVendor}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#1b4332] text-white hover:bg-[#2d6a4f] rounded-md transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#716859] mb-1">Total Providers</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#142d22]">
            {vendorSummary.totalVendors}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">
            {vendorSummary.bookedCount} contracts confirmed
          </div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#716859] mb-1">Total Quoted Value</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#142d22] truncate">
            {formatCurrency(vendorSummary.totalQuoted, event.currency)}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">Agreed quotes</div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#716859] mb-1">Deposits Paid</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#2d6a4f] truncate">
            {formatCurrency(vendorSummary.totalDepositsPaid, event.currency)}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">Advances settled</div>
        </div>

        <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-[#716859] mb-1">Balance Remaining</div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#c86d51] truncate">
            {formatCurrency(vendorSummary.totalRemainingBalance, event.currency)}
          </div>
          <div className="text-[11px] text-[#8c8273] mt-1">To be disbursed</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#f8f6f0] border border-[#e7e1d7] rounded-xl text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#716859] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name or contact..."
            className="w-full px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-[#2c261e] focus:ring-1 focus:ring-[#1b4332] outline-hidden text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-[#2c261e]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-[#2c261e]"
          >
            <option value="all">All Booking Statuses</option>
            <option value="booked">Booked</option>
            <option value="quoted">Quoted</option>
            <option value="contacted">Contacted</option>
            <option value="prospective">Prospective</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-[#716859] bg-[#fbf9f5] border border-dashed border-[#dcd4c7] rounded-xl">
            No vendors match the specified criteria.
          </div>
        ) : (
          filteredVendors.map((v) => (
            <div
              key={v.id}
              className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-[#1b4332]/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-[#142d22] text-sm truncate">{v.name}</h3>
                    <div className="text-[11px] text-[#716859] flex items-center gap-1.5">
                      <span>{v.category}</span>
                      {v.isAiSuggested && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#d97706] font-medium flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" />
                            <span>AI Suggestion</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-sm font-semibold uppercase text-[10px] border ${getStatusBadge(
                      v.bookingStatus
                    )}`}
                  >
                    {v.bookingStatus}
                  </span>
                </div>

                {v.contactName && (
                  <div className="text-xs text-[#4a4237]">
                    <span className="text-[#8c8273]">Contact: </span>
                    <span className="font-medium">{v.contactName}</span>
                  </div>
                )}

                <div className="space-y-1 text-xs text-[#5c5344]">
                  {v.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#8c8273] shrink-0" />
                      <a href={`tel:${v.phone}`} className="hover:underline">
                        {v.phone}
                      </a>
                    </div>
                  )}
                  {v.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#8c8273] shrink-0" />
                      <a href={`mailto:${v.email}`} className="hover:underline truncate">
                        {v.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Financial figures */}
                <div className="p-2.5 bg-[#f8f6f0] rounded-lg border border-[#f0eae0] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#716859]">Quoted:</span>
                    <span className="font-mono tabular-nums font-semibold text-[#142d22]">
                      {formatCurrency(v.quotedAmount, event.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#716859]">Paid Deposit:</span>
                    <span className="font-mono tabular-nums text-[#2d6a4f]">
                      {formatCurrency(v.depositPaid, event.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#716859]">Remaining:</span>
                    <span className="font-mono tabular-nums font-semibold text-[#c86d51]">
                      {formatCurrency(v.remainingBalance, event.currency)}
                    </span>
                  </div>
                </div>

                {v.notes && (
                  <p className="text-[11px] text-[#716859] leading-relaxed line-clamp-2">
                    {v.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-[#f0eae0] flex items-center justify-end gap-1">
                <button
                  onClick={() => handleOpenEditVendor(v)}
                  title="Edit Vendor"
                  aria-label={`Edit ${v.name}`}
                  className="p-1.5 text-[#716859] hover:text-[#1b4332] hover:bg-[#ede7dd] rounded-md transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteVendor(v.id)}
                  title="Delete Vendor"
                  aria-label={`Delete ${v.name}`}
                  className="p-1.5 text-[#716859] hover:text-[#c86d51] hover:bg-[#ede7dd] rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: ADD / EDIT VENDOR */}
      {showVendorModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4"
        >
          <div className="bg-[#fbf9f5] border border-[#e7e1d7] rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e7e1d7] pb-3">
              <h3 id="vendor-modal-title" className="text-base font-bold text-[#142d22]">
                {editingVendor ? 'Edit Vendor Record' : 'Record New Vendor'}
              </h3>
              <button
                onClick={() => setShowVendorModal(false)}
                className="text-xs text-[#716859] hover:text-[#142d22]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2c261e] mb-1">
                  Vendor / Business Name <span className="text-[#c86d51]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vendorForm.name || ''}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="e.g. Amber Garden Florals or SoundWave DJs"
                  className="w-full px-3 py-2 bg-white border border-[#dcd4c7] rounded-md text-[#142d22] focus:ring-1 focus:ring-[#1b4332] outline-hidden text-xs"
                />
                {vendorErrors.name && <p className="text-[#c86d51] mt-1">{vendorErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">
                    Category <span className="text-[#c86d51]">*</span>
                  </label>
                  <select
                    value={vendorForm.category || ''}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="General">Other / General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Booking Status</label>
                  <select
                    value={vendorForm.bookingStatus || 'quoted'}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        bookingStatus: e.target.value as VendorBookingStatus,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                  >
                    <option value="prospective">Prospective</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="booked">Booked</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={vendorForm.contactName || ''}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactName: e.target.value })}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={vendorForm.phone || ''}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2c261e] mb-1">Email Address</label>
                <input
                  type="email"
                  value={vendorForm.email || ''}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  placeholder="contact@vendor.example"
                  className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                />
                {vendorErrors.email && <p className="text-[#c86d51] mt-1">{vendorErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">
                    Quoted Amount ({event.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={vendorForm.quotedAmount || 0}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, quotedAmount: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2c261e] mb-1">
                    Deposit Paid ({event.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={vendorForm.depositPaid || 0}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, depositPaid: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#dcd4c7] rounded-md font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2c261e] mb-1">Contract Notes / Scope</label>
                <textarea
                  rows={2}
                  value={vendorForm.notes || ''}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  placeholder="Deliverables, setup windows, overtime rates, cancellation policy"
                  className="w-full px-3 py-1.5 bg-white border border-[#dcd4c7] rounded-md text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#e7e1d7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-3 py-1.5 text-[#716859] hover:bg-[#ede7dd] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1b4332] text-white font-semibold rounded-md hover:bg-[#2d6a4f]"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
