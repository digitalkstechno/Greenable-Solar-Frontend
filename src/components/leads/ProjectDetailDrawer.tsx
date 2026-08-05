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
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/Input';
import Calendar from '@/components/ui/Calendar';

interface Props {
  isOpen: boolean;
  lead: ApiLead | null;
  onClose: () => void;
  onSaved?: () => void;
}

type FileOrNull = File | null;

interface FormState {
  projectCode: string;
  srNo: string;
  salesPersonName: string;
  creatorName: string;
  customerFullName: string;
  registerMobileNumber: string;
  locationLink: string;
  address: string;
  city: string;
  pincode: string;
  consumerNo: string;
  division: string;
  subDivision: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branchName: string;
  accountHolderName: string;
  registrationPortal: string;
  panelType: string;
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
  loanPortal: string;
  totalKw: string;
  downPaymentAmount: string;
  loanFirstPaymentAmount: string;
  loanSecondPaymentAmount: string;
  meterChargeAmount: string;
  meterChargePayableBy: string;
  registrationDate: string;
  registrationNo: string;
  registrationName: string;
  documentFeasibilityDate: string;
  registrationDone: string;
  meterPaymentDone: string;
}

const EMPTY_FORM: FormState = {
  projectCode: '', srNo: '', salesPersonName: '', creatorName: '', customerFullName: '', registerMobileNumber: '',
  locationLink: '', address: '', city: '', pincode: '', consumerNo: '', division: '', subDivision: '',
  bankName: '', accountNo: '', ifscCode: '', branchName: '', accountHolderName: '',
  registrationPortal: '', panelType: '', panelMake: '', panelWp: '', noOfPanel: '',
  inverterMake: '', inverterKw: '', inverterPhase: '', installationRoof: '',
  discom: '', consumerConnectionType: '', elcbInstalled: '', elcbProvideBy: '',
  wiringType: '', homeFloor: '', walkway: '', walkwayLengthFeet: '',
  ladder: '', ladderLengthFeet: '', hdgiPipeMake: '',
  hdgiPipe80x40: '0', hdgiPipe60x40: '0', hdgiPipe40x40: '0', hdgiPipe20x40PatiPipe: '0',
  paymentMode: '', projectAmount: '', subsidyLessProject: '', loanPortal: '', totalKw: '',
  downPaymentAmount: '', loanFirstPaymentAmount: '', loanSecondPaymentAmount: '',
  meterChargeAmount: '', meterChargePayableBy: '', registrationDate: '', registrationNo: '', registrationName: '', documentFeasibilityDate: '', registrationDone: '', meterPaymentDone: '',
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

type SectionKey = 'project' | 'photos' | 'regDocs' | 'regProcess' | 'payment' | 'loanDocs';

// ─── Option lists ───────────────────────────────────────────────────────────────
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
const REG_PORTAL_OPTS = [{ value: 'NP', label: 'NP' }, { value: 'GEDA', label: 'GEDA' }];
const PANEL_TYPE_OPTS = [{ value: 'DCR', label: 'DCR' }, { value: 'NDCR', label: 'NDCR' }];

// ─── File Input Component ─────────────────────────────────────────────────────
interface FileInputProps {
  fieldKey: string;
  label: string;
  accept?: string;
  isPdf?: boolean;
  existingFiles: Record<string, any>;
  files: Record<string, FileOrNull>;
  onFileChange: (key: string, file: File | null) => void;
  error?: string;
  required?: boolean;
}
const FileInput = ({ fieldKey, label, accept = '*', isPdf = false, existingFiles, files, onFileChange, error, required = true }: FileInputProps) => {
  const existing = existingFiles[fieldKey];
  const selected = files[fieldKey];
  const hasError = !!error;
  
  return (
    <div className="space-y-1 mb-4">
      <label className="block text-xs font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <label className={`group flex items-center gap-3 cursor-pointer rounded-xl border-2 border-dashed bg-gray-50 px-4 py-3 hover:border-orange-300 hover:bg-orange-50/30 transition ${hasError ? 'border-red-500 ring-2 ring-red-50' : 'border-gray-200'}`}>
        <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2 group-hover:bg-orange-100 transition">
          {isPdf
            ? <FileText className="h-4 w-4 text-gray-500 group-hover:text-orange-500" />
            : <Image className="h-4 w-4 text-gray-500 group-hover:text-orange-500" />}
        </div>
        <div className="flex-1 min-w-0">
          {selected ? (
            <p className="text-xs font-medium text-orange-600 truncate">{selected.name}</p>
          ) : existing ? (
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-green-600 flex items-center gap-1 min-w-0">
                <CheckCircle className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{existing.originalName || 'File uploaded'}</span>
              </p>
              <a
                href={existing.url?.startsWith('http') ? existing.url : `${process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:5009'}${existing.url || '/' + existing.path}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-orange-500 hover:text-orange-600 ml-2 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                View
              </a>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Click to upload {isPdf ? '(PDF)' : '(Image/PDF)'}</p>
          )}
        </div>
        {!existing && <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFileChange(fieldKey, e.target.files?.[0] || null)}
        />
      </label>
      {hasError && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <X size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-red-500 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLoanDocs, setShowLoanDocs] = useState(false);
  const [isBackOffice, setIsBackOffice] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const token = getAuthToken();
    if (!token) return;
    axios.get(baseUrl.currentStaff, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const staff = res.data?.data || {};
        const role = staff.role || {};
        const roleName = (role.roleName || role.name || '').toLowerCase().replace(/\s+/g, '');
        setIsBackOffice(roleName.includes('backoffice'));
        
        const staffName = staff.fullName || staff.name || '';
        if (staffName) {
          setForm(prev => prev.registrationName ? prev : { ...prev, registrationName: staffName });
        }
      })
      .catch(() => setIsBackOffice(false));
  }, [isOpen]);

  // Fetch data function
  const fetchData = async () => {
    if (!isOpen || !lead) return;
    setLoading(true);
      try {
        const token = getAuthToken();
        const res = await axios.get(`${baseUrl.projectDetail}/${lead._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data?.data;
        if (d) {
          setForm({
            projectCode: d.projectCode || '',
            srNo: d.srNo || '',
            salesPersonName: d.salesPersonName || lead.assignedTo?.fullName || lead.createdBy?.fullName || '',
            creatorName: d.creatorName || d.leadRefrance || lead.createdBy?.fullName || lead.createdBy?.name || '',
            customerFullName: d.customerFullName || lead.fullName || '',
            registerMobileNumber: d.registerMobileNumber || lead.contact || '',
            locationLink: d.locationLink || lead.locationLink || '',
            address: d.address || lead.address || '',
            city: d.city || '',
            pincode: d.pincode || '',
            consumerNo: d.consumerNo || '',
            division: d.division || '',
            subDivision: d.subDivision || '',
            bankName: d.bankName || '',
            accountNo: d.accountNo || '',
            ifscCode: d.ifscCode || '',
            branchName: d.branchName || '',
            accountHolderName: d.accountHolderName || '',
            registrationPortal: d.registrationPortal || '',
            panelType: d.panelType || '',
            panelMake: d.panelMake || '',
            panelWp: d.panelWp?.toString() || '',
            noOfPanel: d.noOfPanel?.toString() || '',
            totalKw: d.totalKw?.toString() || '',
            inverterMake: d.inverterMake || '',
            inverterKw: d.inverterKw?.toString() || '',
            inverterPhase: d.inverterPhase || '',
            installationRoof: d.installationRoof || '',
            discom: d.discom || lead.discomName || '',
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
            loanPortal: d.loanPortal || '',
            downPaymentAmount: d.downPaymentAmount?.toString() || '',
            loanFirstPaymentAmount: d.loanFirstPaymentAmount?.toString() || '',
            loanSecondPaymentAmount: d.loanSecondPaymentAmount?.toString() || '',
            meterChargeAmount: d.meterChargeAmount?.toString() || '',
            meterChargePayableBy: d.meterChargePayableBy || '',
            registrationDate: d.registrationDate || '',
            registrationNo: d.registrationNo || '',
            registrationName: d.registrationName || '',
            documentFeasibilityDate: d.documentFeasibilityDate || '',
            registrationDone: d.registrationDone || '',
            meterPaymentDone: d.meterPaymentDone || '',
          });
          const ef: Record<string, any> = {};
          [...PHOTO_FIELDS, ...REG_DOC_FIELDS, ...LOAN_DOC_FIELDS, 
            { key: 'downPaymentDoc' }, { key: 'loanFirstPaymentDoc' }, { key: 'loanSecondPaymentDoc' }
          ].forEach(({ key }) => {
            if (d[key]) ef[key] = d[key];
          });
          setExistingFiles(ef);

          const hasLoan = d.applyForLoan === true || d.applyForLoan === 'true' || !!(d.loanDocQuotation || d.loanDocBankStatement || d.loanDocITRReturn || d.loanDocPanCard || d.loanDocAadhaarCard);
          setShowLoanDocs(hasLoan);
        } else {
          // If no existing project detail, try to autofill from the last quotation
          const quotations = lead.quotations || [];
          if (quotations.length > 0) {
            const lastQ = quotations[quotations.length - 1];
            
            // Parse solar module
            const solarStr = lastQ.solarModule || '';
            const matchSolar = solarStr.match(/^([a-zA-Z\s\-]+)?\s*(\d+)/);
            const panelMake = matchSolar ? (matchSolar[1] || '').trim() : solarStr;
            const panelWp = matchSolar ? matchSolar[2] : '';

            
            const inverterStr = lastQ.inverter || '';
            const matchInverter = inverterStr.match(/^([a-zA-Z\s\-]+)?\s*(\d+(\.\d+)?)/);
            const inverterMake = matchInverter ? (matchInverter[1] || '').trim() : inverterStr;

        
            let noOfPanel = '';

           
            const firstRow = lastQ.rows?.[0];
            const costVal = firstRow ? (firstRow.values?.[0] || '') : '';
            const matchCost = costVal.replace(/[^\d]/g, '');
            const projectAmount = matchCost || '';

            setForm({
              ...EMPTY_FORM,
              salesPersonName: lead.assignedTo?.fullName || lead.createdBy?.fullName || '',
              creatorName: lead.createdBy?.fullName || lead.createdBy?.name || '',
              customerFullName: lead.fullName || '',
              registerMobileNumber: lead.contact || '',
              locationLink: (lead as any).locationLink || '',
              address: (lead as any).address || '',
              city: (lead as any).city || '',
              pincode: (lead as any).pincode || '',
              discom: lead.discomName || '',
              panelMake,
              panelWp,
              noOfPanel,
              inverterMake,
              projectAmount,
            });
            setShowLoanDocs(false);
          } else {
            setForm({
              ...EMPTY_FORM,
              creatorName: lead.createdBy?.fullName || lead.createdBy?.name || '',
            });
            setShowLoanDocs(false);
          }
        }
      } catch {
        // 404 = no existing data, fine
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    if (!isOpen || !lead) return;
    setForm(EMPTY_FORM);
    setFiles({});
    setExistingFiles({});
    setActiveSection('project');
    setErrors({});
    fetchData();
  }, [isOpen, lead]);

  const handleCloseRef = useRef(handleClose);
  useEffect(() => {
    handleCloseRef.current = handleClose;
  });

  // Close on outside click (but not if click is inside a portal dropdown)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // If any portal dropdown is open, don't close
      const portals = document.querySelectorAll('[id^="portal-"]');
      for (const p of Array.from(portals)) {
        if (p.contains(e.target as Node)) return;
      }
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        handleCloseRef.current();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleFormChange = (key: keyof FormState, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((p) => ({ ...p, [key]: file }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validateSection = (section: SectionKey): boolean => {
    const newErrors: Record<string, string> = { ...errors };

    if (section === 'project') {
      const projectFields = [
        'creatorName', 'panelMake', 'panelWp', 'noOfPanel',
        'inverterMake', 'inverterKw', 'inverterPhase', 'installationRoof',
        'discom', 'consumerConnectionType', 'elcbInstalled', 'elcbProvideBy',
        'wiringType', 'homeFloor', 'walkway', 'walkwayLengthFeet', 'ladder', 'ladderLengthFeet', 'hdgiPipeMake'
      ];
      projectFields.forEach(f => delete newErrors[f]);

      const requiredFields: (keyof FormState)[] = [
        'creatorName', 'panelMake', 'panelWp', 'noOfPanel',
        'inverterMake', 'inverterKw', 'inverterPhase', 'installationRoof',
        'discom', 'consumerConnectionType', 'elcbInstalled', 'elcbProvideBy',
        'wiringType', 'homeFloor', 'walkway', 'ladder', 'hdgiPipeMake'
      ];

      requiredFields.forEach(field => {
        if (!form[field]) {
          const fieldNames: Record<string, string> = {
            creatorName: 'Lead Reference',
            panelMake: 'Panel Make',
            panelWp: 'Panel WP',
            noOfPanel: 'No. of Panels',
            inverterMake: 'Inverter Make',
            inverterKw: 'Inverter KW',
            inverterPhase: 'Inverter Phase',
            installationRoof: 'Installation Rood',
            discom: 'DISCOM',
            consumerConnectionType: 'Consumer Connection Type',
            elcbInstalled: 'ELCB / RCCB Installed',
            elcbProvideBy: 'ELCB / RCCB Provide By',
            wiringType: 'Wiring Type',
            homeFloor: 'Home Floor',
            walkway: 'Walkway',
            ladder: 'Ladder',
            hdgiPipeMake: 'HDGI Pipe Make'
          };
          newErrors[field] = `${fieldNames[field] || field} is required`;
        }
      });

      if (form.walkway === 'yes' && !form.walkwayLengthFeet) {
        newErrors.walkwayLengthFeet = 'Walkway Length is required';
      }
      if (form.ladder === 'yes' && !form.ladderLengthFeet) {
        newErrors.ladderLengthFeet = 'Ladder Length is required';
      }
    } else if (section === 'photos') {
      PHOTO_FIELDS.forEach(f => delete newErrors[f.key]);
      PHOTO_FIELDS.forEach(f => {
        if (!existingFiles[f.key] && !files[f.key]) {
          newErrors[f.key] = `${f.label} is required`;
        }
      });
    } else if (section === 'regDocs') {
      REG_DOC_FIELDS.forEach(f => delete newErrors[f.key]);
      REG_DOC_FIELDS.forEach(f => {
        if (f.key !== 'docLatestTaxBill' && f.key !== 'docCancelCheck') {
          if (!existingFiles[f.key] && !files[f.key]) {
            newErrors[f.key] = `${f.label} is required`;
          }
        }
      });
    } else if (section === 'payment') {
      const paymentFields: (keyof FormState)[] = ['paymentMode', 'projectAmount', 'subsidyLessProject'];
      paymentFields.forEach(f => delete newErrors[f]);
      paymentFields.forEach(field => {
        if (!form[field]) {
          const fieldNames: Record<string, string> = {
            paymentMode: 'Payment Mode',
            projectAmount: 'Project Amount',
            subsidyLessProject: 'Subsidy Less Project'
          };
          newErrors[field] = `${fieldNames[field] || field} is required`;
        }
      });
    } else if (section === 'loanDocs') {
      LOAN_DOC_FIELDS.forEach(f => delete newErrors[f.key]);
    }

    setErrors(newErrors);

    if (section === 'project') {
      const projectFields = [
        'creatorName', 'panelMake', 'panelWp', 'noOfPanel',
        'inverterMake', 'inverterKw', 'inverterPhase', 'installationRoof',
        'discom', 'consumerConnectionType', 'elcbInstalled', 'elcbProvideBy',
        'wiringType', 'homeFloor', 'walkway', 'walkwayLengthFeet', 'ladder', 'ladderLengthFeet', 'hdgiPipeMake'
      ];
      return !projectFields.some(f => !!newErrors[f]);
    } else if (section === 'photos') {
      return !PHOTO_FIELDS.some(f => !!newErrors[f.key]);
    } else if (section === 'regDocs') {
      return !REG_DOC_FIELDS.some(f => !!newErrors[f.key]);
    } else if (section === 'regProcess') {
      return true;
    } else if (section === 'payment') {
      const paymentFields = ['paymentMode', 'projectAmount', 'subsidyLessProject'];
      return !paymentFields.some(f => !!newErrors[f]);
    } else if (section === 'loanDocs') {
      return true;
    }

    return true;
  };

  const validateWholeForm = (): boolean => {
    const isProjValid = validateSection('project');
    const isPhotosValid = validateSection('photos');
    const isRegDocsValid = validateSection('regDocs');
    const isPaymentValid = validateSection('payment');

    return isProjValid && isPhotosValid && isRegDocsValid && isPaymentValid;
  };

  const handleSectionSwitch = (target: SectionKey) => {
    if (target === 'loanDocs' && !showLoanDocs) return;
    if (target !== 'project') {
      const isProjValid = validateSection('project');
      if (!isProjValid) {
        toast.error('Please fill all required fields in Project Info first');
        return;
      }
    }
    setActiveSection(target);
  };

  const handleNextOrSave = () => {
    if (activeSection === 'project') {
      if (validateSection('project')) {
        setActiveSection('photos');
      } else {
        toast.error('Please fill all required fields in Project Info first');
      }
    } else if (activeSection === 'photos') {
      if (validateSection('photos')) {
        setActiveSection('regDocs');
      } else {
        toast.error('Please upload all required Site Photos first');
      }
    } else if (activeSection === 'regDocs') {
      if (validateSection('regDocs')) {
        setActiveSection(isBackOffice ? 'regProcess' : 'payment');
      } else {
        toast.error('Please upload all required Registration Documents first');
      }
    } else if (activeSection === 'regProcess') {
      if (validateSection('regProcess')) {
        setActiveSection('payment');
      }
    } else if (activeSection === 'payment') {
      if (validateSection('payment')) {
        if (showLoanDocs) {
          setActiveSection('loanDocs');
        } else {
          handleSubmit();
        }
      } else {
        toast.error('Please fill all required Payment Details first');
      }
    } else if (activeSection === 'loanDocs') {
      if (validateSection('loanDocs')) {
        handleSubmit();
      } else {
        toast.error('Please upload all required Loan Documents first');
      }
    }
  };

  const handleSubmit = async () => {
    if (!lead) return;
    
    if (!validateWholeForm()) {
      toast.error('Please fill all required fields across all sections');
      if (!validateSection('project')) {
        setActiveSection('project');
      } else if (!validateSection('photos')) {
        setActiveSection('photos');
      } else if (!validateSection('regDocs')) {
        setActiveSection('regDocs');
      } else if (!validateSection('payment')) {
        setActiveSection('payment');
      } else if (showLoanDocs && !validateSection('loanDocs')) {
        setActiveSection('loanDocs');
      }
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { 
        if (v !== '') {
          fd.append(k, v); 
          if (k === 'creatorName') {
            fd.append('leadRefrance', v);
          }
        }
      });
      Object.entries(files).forEach(([k, f]) => { if (f) fd.append(k, f); });
      fd.append('applyForLoan', showLoanDocs ? 'true' : 'false');

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
  ];
  if (isBackOffice) {
    sections.push({ key: 'regProcess', label: 'Reg. Process', icon: <Zap className="h-4 w-4" /> });
  }
  sections.push({ key: 'payment', label: 'Payment', icon: <CreditCard className="h-4 w-4" /> });

  const handleAutosave = () => {
    // Attempt a silent save if some fields are filled
    const token = getAuthToken();
    const fd = new FormData();
    let hasData = false;
    Object.entries(form).forEach(([k, v]) => { 
      if (v !== '' && v !== '0') {
        fd.append(k, v); 
        if (k === 'creatorName') {
          fd.append('leadRefrance', v);
        }
        hasData = true;
      }
    });
    // Append files
    Object.entries(files).forEach(([k, f]) => { if (f) fd.append(k, f); });
    fd.append('applyForLoan', showLoanDocs ? 'true' : 'false');

    if (lead && hasData) {
      axios.post(`${baseUrl.projectDetail}/${lead._id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      }).then((res) => {
        if (res.data?.data?.totalKw !== undefined) {
          setForm(prev => ({ ...prev, totalKw: res.data.data.totalKw.toString() }));
        }
      }).catch(() => {});
    }
  };

  // Autosave wrapper for close
  function handleClose() {
    handleAutosave();
    if (onSaved) onSaved();
    onClose();
  }

  if (showLoanDocs) {
    sections.push({ key: 'loanDocs', label: 'Loan Docs', icon: <FileText className="h-4 w-4" /> });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-4xl flex-col bg-white transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-secondary px-6 py-4">
          
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Project Details</h2>
            <p className="text-xs text-white/80 truncate">{lead?.fullName}</p>
          </div>
          <button onClick={handleClose} className="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => handleSectionSwitch(s.key)}
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            </div>
          ) : (
            <>
              {/* ─── Project Info ───────────────────────────────────────────────── */}
              {activeSection === 'project' && (
                <div>
                  <SectionTitle>Customer Basic Details</SectionTitle>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isBackOffice && (
                      <>
                        <FormInput
                          label="Project Code"
                          name="projectCode"
                          placeholder="e.g. GS001 (Auto generated if blank)"
                          value={form.projectCode}
                          onChange={(e) => handleFormChange('projectCode', e.target.value)}
                        />
                        <FormInput
                          label="Sr No"
                          name="srNo"
                          placeholder="e.g. 1"
                          value={form.srNo}
                          onChange={(e) => handleFormChange('srNo', e.target.value)}
                        />
                        <FormInput
                          label="Sales Person Name"
                          name="salesPersonName"
                          placeholder="Sales Person Name..."
                          value={form.salesPersonName}
                          onChange={(e) => handleFormChange('salesPersonName', e.target.value)}
                        />
                      </>
                    )}
                    <FormInput
                      label="Lead Reference"
                      name="creatorName"
                      placeholder="Lead ref..."
                      value={form.creatorName}
                      onChange={(e) => handleFormChange('creatorName', e.target.value)}
                      error={errors.creatorName}
                      required
                    />
                    <FormInput
                      label="Customer Full Name"
                      name="customerFullName"
                      placeholder="e.g. John Doe"
                      value={form.customerFullName}
                      maxLength={50}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length <= 50) {
                          handleFormChange('customerFullName', val);
                        }
                      }}
                      error={errors.customerFullName}
                      required
                    />
                    <FormInput
                      label="Register Mobile Number"
                      name="registerMobileNumber"
                      placeholder="e.g. 9876543210"
                      value={form.registerMobileNumber}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) {
                          handleFormChange('registerMobileNumber', val);
                        }
                      }}
                      error={errors.registerMobileNumber}
                      required
                    />
                    {isBackOffice && (
                      <>
                        <FormInput
                          label="Location Link"
                          name="locationLink"
                          placeholder="Google Maps link..."
                          value={form.locationLink}
                          onChange={(e) => handleFormChange('locationLink', e.target.value)}
                        />
                        <FormInput
                          label="Address"
                          name="address"
                          placeholder="Full Address..."
                          value={form.address}
                          onChange={(e) => handleFormChange('address', e.target.value)}
                        />
                        <FormInput
                          label="City"
                          name="city"
                          placeholder="City..."
                          value={form.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                        />
                        <FormInput
                          label="Pincode"
                          name="pincode"
                          placeholder="Pincode..."
                          value={form.pincode}
                          onChange={(e) => handleFormChange('pincode', e.target.value)}
                        />
                        <FormInput
                          label="Consumer No"
                          name="consumerNo"
                          placeholder="Consumer No..."
                          value={form.consumerNo}
                          onChange={(e) => handleFormChange('consumerNo', e.target.value)}
                        />
                        <FormInput
                          label="Division"
                          name="division"
                          placeholder="Division..."
                          value={form.division}
                          onChange={(e) => handleFormChange('division', e.target.value)}
                        />
                        <FormInput
                          label="Sub Division"
                          name="subDivision"
                          placeholder="Sub Division..."
                          value={form.subDivision}
                          onChange={(e) => handleFormChange('subDivision', e.target.value)}
                        />
                      </>
                    )}
                    <div>
                      <FormSelect
                        label="Registration Portal"
                        name="registrationPortal"
                        value={form.registrationPortal}
                        onChange={(val) => handleFormChange('registrationPortal', val)}
                        options={REG_PORTAL_OPTS}
                        placeholder="Select..."
                        error={errors.registrationPortal}
                        required
                      />
                    </div>
                    <div>
                      <FormSelect
                        label="Panel Type"
                        name="panelType"
                        value={form.panelType}
                        onChange={(val) => handleFormChange('panelType', val)}
                        options={PANEL_TYPE_OPTS}
                        placeholder="Select..."
                        error={errors.panelType}
                        required
                      />
                    </div>
                    <FormInput
                      label="Panel Make"
                      name="panelMake"
                      placeholder="e.g. Adani"
                      value={form.panelMake}
                      onChange={(e) => handleFormChange('panelMake', e.target.value)}
                      error={errors.panelMake}
                      required
                    />
                    <FormInput
                      label="Panel WP"
                      name="panelWp"
                      type="number"
                      placeholder="e.g. 540"
                      value={form.panelWp}
                      onChange={(e) => handleFormChange('panelWp', e.target.value)}
                      error={errors.panelWp}
                      required
                    />
                    <FormInput
                      label="No. of Panels"
                      name="noOfPanel"
                      type="number"
                      placeholder="e.g. 10"
                      value={form.noOfPanel}
                      onChange={(e) => handleFormChange('noOfPanel', e.target.value)}
                      error={errors.noOfPanel}
                      required
                    />
                    <FormInput
                      label="Total KW"
                      name="totalKw"
                      type="number"
                      value={form.totalKw || ((Number(form.panelWp || 0) * Number(form.noOfPanel || 0)) / 1000).toString()}
                      disabled
                      readOnly
                      className="bg-gray-100 font-bold"
                    />
                    <FormInput
                      label="Inverter Make"
                      name="inverterMake"
                      placeholder="e.g. Growatt"
                      value={form.inverterMake}
                      onChange={(e) => handleFormChange('inverterMake', e.target.value)}
                      error={errors.inverterMake}
                      required
                    />
                    <FormInput
                      label="Inverter KW"
                      name="inverterKw"
                      type="number"
                      placeholder="e.g. 5"
                      value={form.inverterKw}
                      onChange={(e) => handleFormChange('inverterKw', e.target.value)}
                      error={errors.inverterKw}
                      required
                    />
                    <div>
                      <FormSelect
                        label="Inverter Phase"
                        name="inverterPhase"
                        value={form.inverterPhase}
                        onChange={(val) => handleFormChange('inverterPhase', val)}
                        options={PHASE_OPTS}
                        placeholder="Select..."
                        error={errors.inverterPhase}
                        required
                      />
                    </div>
                    <div>
                      <FormSelect
                        label="Installation Rood"
                        name="installationRoof"
                        value={form.installationRoof}
                        onChange={(val) => handleFormChange('installationRoof', val)}
                        options={ROOF_OPTS}
                        placeholder="Select..."
                        error={errors.installationRoof}
                        required
                      />
                    </div>
                    <div>
                      <FormSelect
                        label="DISCOM"
                        name="discom"
                        value={form.discom}
                        onChange={(val) => handleFormChange('discom', val)}
                        options={DISCOM_OPTS}
                        placeholder="Select..."
                        error={errors.discom}
                        required
                      />
                    </div>
                    <div>
                      <FormSelect
                        label="Consumer Connection Type"
                        name="consumerConnectionType"
                        value={form.consumerConnectionType}
                        onChange={(val) => handleFormChange('consumerConnectionType', val)}
                        options={CONN_TYPE_OPTS}
                        placeholder="Select..."
                        error={errors.consumerConnectionType}
                        required
                      />
                    </div>
                    <div>
                      <FormSelect
                        label="ELCB / RCCB Installed"
                        name="elcbInstalled"
                        value={form.elcbInstalled}
                        onChange={(val) => handleFormChange('elcbInstalled', val)}
                        options={YES_NO_OPTS}
                        placeholder="Select..."
                        error={errors.elcbInstalled}
                        required
                      />
                    </div>
                    <div>
                      <FormSelect
                        label="ELCB / RCCB Provide By"
                        name="elcbProvideBy"
                        value={form.elcbProvideBy}
                        onChange={(val) => handleFormChange('elcbProvideBy', val)}
                        options={ELCB_BY_OPTS}
                        placeholder="Select..."
                        error={errors.elcbProvideBy}
                        required
                      />
                    </div>
                    <div>
                      <FormSelect
                        label="Wiring Type"
                        name="wiringType"
                        value={form.wiringType}
                        onChange={(val) => handleFormChange('wiringType', val)}
                        options={WIRING_OPTS}
                        placeholder="Select..."
                        error={errors.wiringType}
                        required
                      />
                    </div>
                    <FormInput
                      label="Home Floor"
                      name="homeFloor"
                      placeholder="e.g. G+2"
                      value={form.homeFloor}
                      onChange={(e) => handleFormChange('homeFloor', e.target.value)}
                      error={errors.homeFloor}
                      required
                    />
                    <div>
                      <FormSelect
                        label="Walkway"
                        name="walkway"
                        value={form.walkway}
                        onChange={(val) => handleFormChange('walkway', val)}
                        options={YES_NO_OPTS}
                        placeholder="Select..."
                        error={errors.walkway}
                        required
                      />
                    </div>
                    {form.walkway === 'yes' && (
                      <FormInput
                        label="Walkway Length (feet)"
                        name="walkwayLengthFeet"
                        type="number"
                        value={form.walkwayLengthFeet}
                        onChange={(e) => handleFormChange('walkwayLengthFeet', e.target.value)}
                        error={errors.walkwayLengthFeet}
                        required
                      />
                    )}
                    <div>
                      <FormSelect
                        label="Ladder"
                        name="ladder"
                        value={form.ladder}
                        onChange={(val) => handleFormChange('ladder', val)}
                        options={YES_NO_OPTS}
                        placeholder="Select..."
                        error={errors.ladder}
                        required
                      />
                    </div>
                    {form.ladder === 'yes' && (
                      <FormInput
                        label="Ladder Length (feet)"
                        name="ladderLengthFeet"
                        type="number"
                        value={form.ladderLengthFeet}
                        onChange={(e) => handleFormChange('ladderLengthFeet', e.target.value)}
                        error={errors.ladderLengthFeet}
                        required
                      />
                    )}
                    <FormInput
                      label="HDGI Pipe Make"
                      name="hdgiPipeMake"
                      placeholder="e.g. Tata"
                      value={form.hdgiPipeMake}
                      onChange={(e) => handleFormChange('hdgiPipeMake', e.target.value)}
                      error={errors.hdgiPipeMake}
                      required
                    />
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mt-4">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">HDGI Pipe in Feet</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <FormInput
                        label="80 × 40"
                        name="hdgiPipe80x40"
                        type="number"
                        placeholder="0 = acceptable"
                        value={form.hdgiPipe80x40}
                        onChange={(e) => handleFormChange('hdgiPipe80x40', e.target.value)}
                      />
                      <FormInput
                        label="60 × 40"
                        name="hdgiPipe60x40"
                        type="number"
                        placeholder="0 = acceptable"
                        value={form.hdgiPipe60x40}
                        onChange={(e) => handleFormChange('hdgiPipe60x40', e.target.value)}
                      />
                      <FormInput
                        label="40 × 40"
                        name="hdgiPipe40x40"
                        type="number"
                        placeholder="0 = acceptable"
                        value={form.hdgiPipe40x40}
                        onChange={(e) => handleFormChange('hdgiPipe40x40', e.target.value)}
                      />
                      <FormInput
                        label="20 × 40 Pati Pipe"
                        name="hdgiPipe20x40PatiPipe"
                        type="number"
                        placeholder="0 = acceptable"
                        value={form.hdgiPipe20x40PatiPipe}
                        onChange={(e) => handleFormChange('hdgiPipe20x40PatiPipe', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Site Photos ─────────────────────────────────────────────────── */}
              {activeSection === 'photos' && (
                <div>
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
                      error={errors[f.key]}
                    />
                  ))}
                </div>
              )}

              {/* ─── Registration Docs ───────────────────────────────────────────── */}
              {activeSection === 'regDocs' && (
                <div>
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
                      error={errors[f.key]}
                      required={f.key !== 'docLatestTaxBill' && f.key !== 'docCancelCheck'}
                    />
                  ))}
                </div>
              )}

              {/* ─── Registration Process ────────────────────────────────────────── */}
              {activeSection === 'regProcess' && isBackOffice && (
                <div>
                  <SectionTitle>Registration, Feasibility & Meter Payment</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormInput label="Meter Charge (Discom)" name="_discom_display" value={form.discom} disabled readOnly className="bg-gray-100 font-bold" />
                    <FormInput label="Meter Charge Amount" name="meterChargeAmount" type="number" value={form.meterChargeAmount} onChange={(e) => handleFormChange('meterChargeAmount', e.target.value)} />
                    <div>
                      <FormSelect label="Meter Charge Payable By" name="meterChargePayableBy" value={form.meterChargePayableBy} onChange={(val) => handleFormChange('meterChargePayableBy', val)} options={[{value:'Customer', label:'Customer'}, {value:'Greeneable', label:'Greeneable'}]} placeholder="Select..." />
                    </div>
                    
                    <div className="w-full mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">Registration Date</label>
                      </div>
                      <Calendar 
                        value={form.registrationDate ? new Date(form.registrationDate) : null} 
                        onChange={(date) => handleFormChange('registrationDate', date ? date.toLocaleDateString('en-CA') : '')} 
                        placeholder="dd-mm-yyyy"
                        className="rounded-xl border-2 py-[9px] bg-white/90"
                      />
                    </div>

                    <FormInput label="Registration No" name="registrationNo" value={form.registrationNo} onChange={(e) => handleFormChange('registrationNo', e.target.value)} />
                    <FormInput label="Registration Name" name="registrationName" value={form.registrationName} onChange={(e) => handleFormChange('registrationName', e.target.value)} />
                    
                    <div className="w-full mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">Document Feasibility Date</label>
                      </div>
                      <Calendar 
                        value={form.documentFeasibilityDate ? new Date(form.documentFeasibilityDate) : null} 
                        onChange={(date) => handleFormChange('documentFeasibilityDate', date ? date.toLocaleDateString('en-CA') : '')} 
                        placeholder="dd-mm-yyyy"
                        className="rounded-xl border-2 py-[9px] bg-white/90"
                      />
                    </div>
                    <div>
                      <FormSelect label="Registration Done" name="registrationDone" value={form.registrationDone} onChange={(val) => handleFormChange('registrationDone', val)} options={YES_NO_OPTS} placeholder="Select..." />
                    </div>
                    <div>
                      <FormSelect label="Meter Payment Done" name="meterPaymentDone" value={form.meterPaymentDone} onChange={(val) => handleFormChange('meterPaymentDone', val)} options={YES_NO_OPTS} placeholder="Select..." />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Payment ─────────────────────────────────────────────────────── */}
              {activeSection === 'payment' && (
                <div>
                  <SectionTitle>Payment Details</SectionTitle>
                  
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Bank Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormInput label="Bank Account Holder Name" name="accountHolderName" value={form.accountHolderName} onChange={(e) => handleFormChange('accountHolderName', e.target.value.toUpperCase())} />
                      <FormInput label="Bank Account No" name="accountNo" value={form.accountNo} maxLength={18} onChange={(e) => handleFormChange('accountNo', e.target.value.toUpperCase())} />
                      <FormInput label="IFSC Code" name="ifscCode" value={form.ifscCode} maxLength={11} onChange={(e) => handleFormChange('ifscCode', e.target.value.toUpperCase())} />
                      <FormInput label="Bank Branch" name="branchName" value={form.branchName} onChange={(e) => handleFormChange('branchName', e.target.value.toUpperCase())} />
                      <FormInput label="Bank Name" name="bankName" value={form.bankName} onChange={(e) => handleFormChange('bankName', e.target.value.toUpperCase())} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <FormSelect
                        label="Payment Mode"
                        name="paymentMode"
                        value={form.paymentMode}
                        onChange={(val) => handleFormChange('paymentMode', val)}
                        options={PAYMENT_OPTS}
                        placeholder="Select..."
                        error={errors.paymentMode}
                        required
                      />
                    </div>
                    <FormInput
                      label="Project Amount"
                      name="projectAmount"
                      type="number"
                      placeholder="e.g. 150000"
                      value={form.projectAmount}
                      onChange={(e) => handleFormChange('projectAmount', e.target.value)}
                      error={errors.projectAmount}
                      required
                    />
                    <div>
                      <FormSelect
                        label="Subsidy Less Project"
                        name="subsidyLessProject"
                        value={form.subsidyLessProject}
                        onChange={(val) => handleFormChange('subsidyLessProject', val)}
                        options={YES_NO_OPTS}
                        placeholder="Select..."
                        error={errors.subsidyLessProject}
                        required
                      />
                    </div>
                  </div>

                  {/* Loan Toggle */}
                  <div className="mt-8 flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Apply for Loan</h4>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">Toggle this if the customer is opting for a solar project loan</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLoanDocs}
                        onChange={(e) => {
                          setShowLoanDocs(e.target.checked);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  
                  {/* Loan Portal and Payments slide down if toggle is on */}
                  {showLoanDocs && (
                    <div className="mt-4 space-y-4 transition-all duration-300 animate-in slide-in-from-top-4 fade-in">
                      <div className="p-4 border border-orange-200 rounded-xl bg-orange-50/30">
                        <FormInput
                          label="Loan Portal *"
                          name="loanPortal"
                          placeholder="Jansamarth / Private finance"
                          value={form.loanPortal}
                          onChange={(e) => handleFormChange('loanPortal', e.target.value)}
                          error={errors.loanPortal}
                          required
                        />
                      </div>

                      {/* Payment Breakdown - Only visible to Back Office */}
                      {isBackOffice && (
                        <>
                          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/20 space-y-3">
                            <p className="text-xs font-semibold text-gray-800">Down Payment</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FormInput
                                label="Down Payment Amount"
                                name="downPaymentAmount"
                                type="number"
                                placeholder="e.g. 50000"
                                value={form.downPaymentAmount}
                                onChange={(e) => handleFormChange('downPaymentAmount', e.target.value)}
                              />
                              <FileInput
                                fieldKey="downPaymentDoc"
                                label="Down Payment Receipt / Document"
                                accept="image/*,application/pdf"
                                isPdf
                                existingFiles={existingFiles}
                                files={files}
                                onFileChange={handleFileChange}
                              />
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/20 space-y-3">
                            <p className="text-xs font-semibold text-gray-800">Loan 1st Payment</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FormInput
                                label="Loan 1st Payment Amount"
                                name="loanFirstPaymentAmount"
                                type="number"
                                placeholder="e.g. 40000"
                                value={form.loanFirstPaymentAmount}
                                onChange={(e) => handleFormChange('loanFirstPaymentAmount', e.target.value)}
                              />
                              <FileInput
                                fieldKey="loanFirstPaymentDoc"
                                label="Loan 1st Payment Document"
                                accept="image/*,application/pdf"
                                isPdf
                                existingFiles={existingFiles}
                                files={files}
                                onFileChange={handleFileChange}
                              />
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/20 space-y-3">
                            <p className="text-xs font-semibold text-gray-800">Loan 2nd Payment</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FormInput
                                label="Loan 2nd Payment Amount"
                                name="loanSecondPaymentAmount"
                                type="number"
                                placeholder="e.g. 30000"
                                value={form.loanSecondPaymentAmount}
                                onChange={(e) => handleFormChange('loanSecondPaymentAmount', e.target.value)}
                              />
                              <FileInput
                                fieldKey="loanSecondPaymentDoc"
                                label="Loan 2nd Payment Document"
                                accept="image/*,application/pdf"
                                isPdf
                                existingFiles={existingFiles}
                                files={files}
                                onFileChange={handleFileChange}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ─── Loan Docs ───────────────────────────────────────────────────── */}
              {activeSection === 'loanDocs' && showLoanDocs && (
                <div>
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
                      error={errors[f.key]}
                      required={f.key !== 'loanDocBankStatement' && f.key !== 'loanDocITRReturn'}
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
                onClick={() => handleSectionSwitch(s.key)}
                className={`h-2 rounded-full transition-all ${activeSection === s.key ? 'bg-orange-500 w-5' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleNextOrSave}
              disabled={saving}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-6 py-2 text-sm font-semibold text-white shadow-md active:scale-95 transition-all"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : activeSection === (showLoanDocs ? 'loanDocs' : 'payment') ? 'Save Details' : 'Next '}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
