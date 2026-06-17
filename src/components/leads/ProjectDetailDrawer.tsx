'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  X, Upload, FileText, Image, ChevronRight, CheckCircle,
  Zap, Settings, CreditCard, FileCheck
} from 'lucide-react';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead } from './types';
import { FormSelect } from '@/components/ui/FormSelect';

interface Props {
  isOpen: boolean;
  lead: ApiLead | null;
  onClose: () => void;
  onSaved?: () => void;
}

type FileOrNull = File | null;

interface FormState {
  leadRefrance: string;
  panelMake: string;
  panelWp: string;
  noOfPanel: string;
  inverterMake: string;
  inverterKw: string;
  inverterPhase: string;
  installationRoof: string;
  discom: string;
  consumerConnectionType: string;
  elcbInstalled: string;
  elcbProvideBy: string;
  wiringType: string;
  homeFloor: string;
  walkway: string;
  walkwayLengthFeet: string;
  ladder: string;
  ladderLengthFeet: string;
  hdgiPipeMake: string;
  hdgiPipe80x40: string;
  hdgiPipe60x40: string;
  hdgiPipe40x40: string;
  hdgiPipe20x40PatiPipe: string;
  paymentMode: string;
  projectAmount: string;
  subsidyLessProject: string;
}

const EMPTY_FORM: FormState = {
  leadRefrance: '', panelMake: '', panelWp: '', noOfPanel: '',
  inverterMake: '', inverterKw: '', inverterPhase: '', installationRoof: '',
  discom: '', consumerConnectionType: '', elcbInstalled: '', elcbProvideBy: '',
  wiringType: '', homeFloor: '', walkway: '', walkwayLengthFeet: '',
  ladder: '', ladderLengthFeet: '', hdgiPipeMake: '',
  hdgiPipe80x40: '0', hdgiPipe60x40: '0', hdgiPipe40x40: '0', hdgiPipe20x40PatiPipe: '0',
  paymentMode: '', projectAmount: '', subsidyLessProject: '',
};

const PHOTO_FIELDS = [
  { key: 'photoTerraceLayout', label: 'Terrace Layout' },
  { key: 'photoPanelLayout', label: 'Panel Layout' },
  { key: 'photoSolarInstallation', label: 'Photos of where Solar will be installed' },
  { key: 'photoInverterLocation', label: 'Location where the inverter is to be installed' },
  { key: 'photoEarthingLocation', label: 'Location where the earthing is to be done' },
  { key: 'photoMeterBox', label: 'Where the meter box and ECB are installed' },
];

const REG_DOC_FIELDS = [
  { key: 'docLatestLightBill', label: 'Latest light bill' },
  { key: 'docLatestTaxBill', label: 'Latest tax bill' },
  { key: 'docCancelCheck', label: 'Cancel check' },
  { key: 'docPanCard', label: 'PAN card' },
  { key: 'docAadhaarCard', label: 'Aadhaar card' },
];

const LOAN_DOC_FIELDS = [
  { key: 'loanDocQuotation', label: 'Quotation' },
  { key: 'loanDocBankStatement', label: 'Six month bank statement' },
  { key: 'loanDocITRReturn', label: 'Three years, ITR return' },
  { key: 'loanDocPanCard', label: 'PAN card (Loan)' },
  { key: 'loanDocAadhaarCard', label: 'Aadhaar card (Loan)' },
];

type SectionKey = 'project' | 'photos' | 'regDocs' | 'payment' | 'loanDocs';

// ── Option lists ─────────────────────────────────────────────────────────────
const PHASE_OPTS = [{ value: 'single', label: 'Single' }, { value: 'three', label: 'Three' }];
const ROOF_OPTS = [
  { value: 'rcc', label: 'RCC' },
  { value: 'gi sheet', label: 'GI Sheet' },
  { value: 'rcc+gisheet', label: 'RCC + GI Sheet' },
];
const DISCOM_OPTS = [{ value: 'dgvcl', label: 'DGVCL' }, { value: 'torrent', label: 'Torrent' }];
const CONN_TYPE_OPTS = [{ value: 'single', label: 'Single' }, { value: 'three', label: 'Three' }];
const YES_NO_OPTS = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const ELCB_BY_OPTS = [{ value: 'greeneable', label: 'Greeneable' }, { value: 'customer', label: 'Customer' }];
const WIRING_OPTS = [{ value: 'open', label: 'Open' }, { value: 'consild', label: 'Consild' }];
const PAYMENT_OPTS = [{ value: 'cash', label: 'Cash' }, { value: 'cheque', label: 'Cheque' }];

// ── Reusable sub-components ────────────────────────────────────────────────
const Field = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label} {req && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

interface TextInputProps {
  name: keyof FormState;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (name: keyof FormState, val: string) => void;
}
const TextInput = ({ name, type = 'text', placeholder = '', value, onChange }: TextInputProps) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(name, e.target.value)}
    placeholder={placeholder}
    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm hover:border-gray-400 hover:shadow-md focus:border-secondary focus:outline-none focus:ring-2 focus:ring-blue-50 transition-all duration-300"
  />
);

interface SelectProps {
  name: keyof FormState;
  options: { value: string; label: string }[];
  uid?: string;
  value: string;
  onChange: (name: keyof FormState, val: string) => void;
}
// Thin wrapper so FormSelect works with our `onChange` helper
const Select = ({ name, options, uid, value, onChange }: SelectProps) => (
  <FormSelect
    name={uid || name}
    value={value}
    onChange={(val) => onChange(name, val)}
    options={options}
    placeholder="Select..."
  />
);

interface FileInputProps {
  fieldKey: string;
  label: string;
  accept?: string;
  isPdf?: boolean;
  existingFiles: Record<string, any>;
  files: Record<string, FileOrNull>;
  onFileChange: (key: string, file: File | null) => void;
}
const FileInput = ({ fieldKey, label, accept = '*', isPdf = false, existingFiles, files, onFileChange }: FileInputProps) => {
  const existing = existingFiles[fieldKey];
  const selected = files[fieldKey];
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label} <span className="text-red-500">*</span>
      </label>
      <label className="group flex items-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-3 hover:border-orange-300 hover:bg-orange-50/30 transition">
        <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2 group-hover:bg-orange-100 transition">
          {isPdf
            ? <FileText className="h-4 w-4 text-gray-500 group-hover:text-orange-500" />
            : <Image className="h-4 w-4 text-gray-500 group-hover:text-orange-500" />}
        </div>
        <div className="flex-1 min-w-0">
          {selected ? (
            <p className="text-xs font-medium text-orange-600 truncate">{selected.name}</p>
          ) : existing ? (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> {existing.originalName || 'File uploaded'}
            </p>
          ) : (
            <p className="text-xs text-gray-500">Click to upload {isPdf ? '(PDF)' : '(Image/PDF)'}</p>
          )}
        </div>
        <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFileChange(fieldKey, e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="h-1 w-6 rounded-full bg-orange-500" />
      <h3 className="text-sm font-bold text-gray-800">{children}</h3>
    </div>
  );
}

export default function ProjectDetailDrawer({ isOpen, lead, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<Record<string, FileOrNull>>({});
  const [existingFiles, setExistingFiles] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('project');
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fetch existing data when drawer opens
  useEffect(() => {
    if (!isOpen || !lead) return;
    setForm(EMPTY_FORM);
    setFiles({});
    setExistingFiles({});
    setActiveSection('project');

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const res = await axios.get(`${baseUrl.projectDetail}/${lead._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data?.data;
        if (d) {
          setForm({
            leadRefrance: d.leadRefrance || '',
            panelMake: d.panelMake || '',
            panelWp: d.panelWp?.toString() || '',
            noOfPanel: d.noOfPanel?.toString() || '',
            inverterMake: d.inverterMake || '',
            inverterKw: d.inverterKw?.toString() || '',
            inverterPhase: d.inverterPhase || '',
            installationRoof: d.installationRoof || '',
            discom: d.discom || '',
            consumerConnectionType: d.consumerConnectionType || '',
            elcbInstalled: d.elcbInstalled || '',
            elcbProvideBy: d.elcbProvideBy || '',
            wiringType: d.wiringType || '',
            homeFloor: d.homeFloor || '',
            walkway: d.walkway || '',
            walkwayLengthFeet: d.walkwayLengthFeet?.toString() || '',
            ladder: d.ladder || '',
            ladderLengthFeet: d.ladderLengthFeet?.toString() || '',
            hdgiPipeMake: d.hdgiPipeMake || '',
            hdgiPipe80x40: d.hdgiPipe80x40?.toString() || '0',
            hdgiPipe60x40: d.hdgiPipe60x40?.toString() || '0',
            hdgiPipe40x40: d.hdgiPipe40x40?.toString() || '0',
            hdgiPipe20x40PatiPipe: d.hdgiPipe20x40PatiPipe?.toString() || '0',
            paymentMode: d.paymentMode || '',
            projectAmount: d.projectAmount?.toString() || '',
            subsidyLessProject: d.subsidyLessProject || '',
          });
          const ef: Record<string, any> = {};
          [...PHOTO_FIELDS, ...REG_DOC_FIELDS, ...LOAN_DOC_FIELDS].forEach(({ key }) => {
            if (d[key]) ef[key] = d[key];
          });
          setExistingFiles(ef);
        }
      } catch {
        // 404 = no existing data, fine
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, lead]);

  // Close on outside click (but not if click is inside a portal dropdown)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // If any portal dropdown is open, don't close
      const portals = document.querySelectorAll('[id^="portal-"]');
      for (const p of Array.from(portals)) {
        if (p.contains(e.target as Node)) return;
      }
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const handleFormChange = (key: keyof FormState, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((p) => ({ ...p, [key]: file }));
  };

  const handleSubmit = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const token = getAuthToken();
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      Object.entries(files).forEach(([k, f]) => { if (f) fd.append(k, f); });

      await axios.post(`${baseUrl.projectDetail}/${lead._id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Project details saved!');
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save project details');
    } finally {
      setSaving(false);
    }
  };

  const sections: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
    { key: 'project', label: 'Project Info', icon: <Settings className="h-4 w-4" /> },
    { key: 'photos', label: 'Site Photos', icon: <Image className="h-4 w-4" /> },
    { key: 'regDocs', label: 'Reg. Docs', icon: <FileCheck className="h-4 w-4" /> },
    { key: 'payment', label: 'Payment', icon: <CreditCard className="h-4 w-4" /> },
    { key: 'loanDocs', label: 'Loan Docs', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Project Details</h2>
            <p className="text-xs text-white/80 truncate">{lead?.fullName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex flex-1 min-w-[80px] flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition whitespace-nowrap ${
                activeSection === s.key
                  ? 'border-b-2 border-orange-500 text-orange-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            </div>
          ) : (
            <>
              {/* ── Project Info ──────────────────────────────────────────── */}
              {activeSection === 'project' && (
                <div className="space-y-4">
                  <SectionTitle>Add Details After Project Done</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Lead Reference" req>
                      <TextInput
                        name="leadRefrance"
                        placeholder="Lead ref..."
                        value={form.leadRefrance}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Panel Make" req>
                      <TextInput
                        name="panelMake"
                        placeholder="e.g. Adani"
                        value={form.panelMake}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Panel WP" req>
                      <TextInput
                        name="panelWp"
                        type="number"
                        placeholder="e.g. 540"
                        value={form.panelWp}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="No. of Panels" req>
                      <TextInput
                        name="noOfPanel"
                        type="number"
                        placeholder="e.g. 10"
                        value={form.noOfPanel}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Inverter Make" req>
                      <TextInput
                        name="inverterMake"
                        placeholder="e.g. Growatt"
                        value={form.inverterMake}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Inverter KW" req>
                      <TextInput
                        name="inverterKw"
                        type="number"
                        placeholder="e.g. 5"
                        value={form.inverterKw}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Inverter Phase" req>
                      <Select
                        name="inverterPhase"
                        options={PHASE_OPTS}
                        uid="inv-phase"
                        value={form.inverterPhase}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Installation Roof" req>
                      <Select
                        name="installationRoof"
                        options={ROOF_OPTS}
                        uid="inst-roof"
                        value={form.installationRoof}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="DISCOM" req>
                      <Select
                        name="discom"
                        options={DISCOM_OPTS}
                        uid="discom"
                        value={form.discom}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Consumer Connection Type" req>
                      <Select
                        name="consumerConnectionType"
                        options={CONN_TYPE_OPTS}
                        uid="conn-type"
                        value={form.consumerConnectionType}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="ELCB / RCCB Installed" req>
                      <Select
                        name="elcbInstalled"
                        options={YES_NO_OPTS}
                        uid="elcb-inst"
                        value={form.elcbInstalled}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="ELCB / RCCB Provide By" req>
                      <Select
                        name="elcbProvideBy"
                        options={ELCB_BY_OPTS}
                        uid="elcb-by"
                        value={form.elcbProvideBy}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Wiring Type" req>
                      <Select
                        name="wiringType"
                        options={WIRING_OPTS}
                        uid="wiring"
                        value={form.wiringType}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Home Floor" req>
                      <TextInput
                        name="homeFloor"
                        placeholder="e.g. G+2"
                        value={form.homeFloor}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Walkway" req>
                      <Select
                        name="walkway"
                        options={YES_NO_OPTS}
                        uid="walkway"
                        value={form.walkway}
                        onChange={handleFormChange}
                      />
                    </Field>
                    {form.walkway === 'yes' && (
                      <Field label="Walkway Length (feet)" req>
                        <TextInput
                          name="walkwayLengthFeet"
                          type="number"
                          value={form.walkwayLengthFeet}
                          onChange={handleFormChange}
                        />
                      </Field>
                    )}
                    <Field label="Ladder" req>
                      <Select
                        name="ladder"
                        options={YES_NO_OPTS}
                        uid="ladder"
                        value={form.ladder}
                        onChange={handleFormChange}
                      />
                    </Field>
                    {form.ladder === 'yes' && (
                      <Field label="Ladder Length (feet)" req>
                        <TextInput
                          name="ladderLengthFeet"
                          type="number"
                          value={form.ladderLengthFeet}
                          onChange={handleFormChange}
                        />
                      </Field>
                    )}
                    <Field label="HDGI Pipe Make" req>
                      <TextInput
                        name="hdgiPipeMake"
                        placeholder="e.g. Tata"
                        value={form.hdgiPipeMake}
                        onChange={handleFormChange}
                      />
                    </Field>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">HDGI Pipe in Feet</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="80 × 40">
                        <TextInput
                          name="hdgiPipe80x40"
                          type="number"
                          placeholder="0 = acceptable"
                          value={form.hdgiPipe80x40}
                          onChange={handleFormChange}
                        />
                      </Field>
                      <Field label="60 × 40">
                        <TextInput
                          name="hdgiPipe60x40"
                          type="number"
                          placeholder="0 = acceptable"
                          value={form.hdgiPipe60x40}
                          onChange={handleFormChange}
                        />
                      </Field>
                      <Field label="40 × 40">
                        <TextInput
                          name="hdgiPipe40x40"
                          type="number"
                          placeholder="0 = acceptable"
                          value={form.hdgiPipe40x40}
                          onChange={handleFormChange}
                        />
                      </Field>
                      <Field label="20 × 40 Pati Pipe">
                        <TextInput
                          name="hdgiPipe20x40PatiPipe"
                          type="number"
                          placeholder="0 = acceptable"
                          value={form.hdgiPipe20x40PatiPipe}
                          onChange={handleFormChange}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Site Photos ───────────────────────────────────────────── */}
              {activeSection === 'photos' && (
                <div className="space-y-3">
                  <SectionTitle>Required Photos for Installation</SectionTitle>
                  {PHOTO_FIELDS.map((f) => (
                    <FileInput
                      key={f.key}
                      fieldKey={f.key}
                      label={f.label}
                      accept="image/*,application/pdf"
                      existingFiles={existingFiles}
                      files={files}
                      onFileChange={handleFileChange}
                    />
                  ))}
                </div>
              )}

              {/* ── Registration Docs ─────────────────────────────────────── */}
              {activeSection === 'regDocs' && (
                <div className="space-y-3">
                  <SectionTitle>Required Documents for Registration</SectionTitle>
                  {REG_DOC_FIELDS.map((f) => (
                    <FileInput
                      key={f.key}
                      fieldKey={f.key}
                      label={f.label}
                      accept="image/*,application/pdf"
                      isPdf
                      existingFiles={existingFiles}
                      files={files}
                      onFileChange={handleFileChange}
                    />
                  ))}
                </div>
              )}

              {/* ── Payment ───────────────────────────────────────────────── */}
              {activeSection === 'payment' && (
                <div className="space-y-4">
                  <SectionTitle>Payment Details</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Payment Mode" req>
                      <Select
                        name="paymentMode"
                        options={PAYMENT_OPTS}
                        uid="pay-mode"
                        value={form.paymentMode}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Project Amount" req>
                      <TextInput
                        name="projectAmount"
                        type="number"
                        placeholder="e.g. 150000"
                        value={form.projectAmount}
                        onChange={handleFormChange}
                      />
                    </Field>
                    <Field label="Subsidy Less Project" req>
                      <Select
                        name="subsidyLessProject"
                        options={YES_NO_OPTS}
                        uid="subsidy"
                        value={form.subsidyLessProject}
                        onChange={handleFormChange}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* ── Loan Docs ─────────────────────────────────────────────── */}
              {activeSection === 'loanDocs' && (
                <div className="space-y-3">
                  <SectionTitle>Required Documents for Loan</SectionTitle>
                  {LOAN_DOC_FIELDS.map((f) => (
                    <FileInput
                      key={f.key}
                      fieldKey={f.key}
                      label={f.label}
                      accept="image/*,application/pdf"
                      isPdf
                      existingFiles={existingFiles}
                      files={files}
                      onFileChange={handleFileChange}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          {/* Section dot nav */}
          <div className="flex items-center gap-2">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`h-2 rounded-full transition-all ${activeSection === s.key ? 'bg-orange-500 w-5' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 active:scale-95 transition disabled:opacity-60"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
