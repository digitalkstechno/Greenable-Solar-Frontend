'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  X, Upload, FileText, Image, ChevronRight, CheckCircle,
  Zap, Settings, CreditCard, FileCheck, Camera, Building2, Receipt, ArrowRightLeft
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
  installationStatus: string;
  installationDate: string;
  pipeDispatchDate: string;
  pipeDispatchNote: string;
  panelDispatchDate: string;
  panelDispatchNote: string;
  fabricationDate: string;
  fabricationTeamName: string;
  fabricationNote: string;
  wiringDate: string;
  wiringTeamName: string;
  wiringNote: string;
  elcbStatus: string;
  elcbNote: string;
  giPipe80x40Consumption: string;
  giPipe60x40Consumption: string;
  giPipe40x40Consumption: string;
  giPipe20x40PatiPipeConsumption: string;
  giPipeConsumptionNote: string;

  // Meter File (Image 2)
  meterFileMakeDate: string;
  meterFileRegDate: string;
  meterFileMakePersonName: string;
  dcrReportNo: string;
  dcrDate: string;

  // After Installation Final Data (Image 2)
  finalPanelMake: string;
  finalPanelWp: string;
  finalNoOfPanel: string;
  finalProjectKw: string;
  finalInverterMake: string;
  finalInverterKw: string;

  // Intimation and Subsidy (Image 2)
  intimationDate: string;
  intimationRejectDate: string;
  intimationRejectReason: string;
  meterInstolationDate: string;
  intimationApprovalDate: string;
  subsidyRedeem: string;
  subsidyRedeemName: string;
  subsidyAmount: string;
  subsidyDisbusmentDate: string;

  // Account Dept / Invoice & Warranty (Image 2)
  makeInvoice: string;
  consumerFile: string;
  currentDepartment: string;
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
  installationStatus: 'Pending', installationDate: '', pipeDispatchDate: '', pipeDispatchNote: '',
  panelDispatchDate: '', panelDispatchNote: '', fabricationDate: '', fabricationTeamName: '',
  fabricationNote: '', wiringDate: '', wiringTeamName: '', wiringNote: '', elcbStatus: 'Pending', elcbNote: '',
  giPipe80x40Consumption: '', giPipe60x40Consumption: '', giPipe40x40Consumption: '',
  giPipe20x40PatiPipeConsumption: '', giPipeConsumptionNote: '',

  meterFileMakeDate: '', meterFileRegDate: '', meterFileMakePersonName: '', dcrReportNo: '', dcrDate: '',
  finalPanelMake: '', finalPanelWp: '', finalNoOfPanel: '', finalProjectKw: '', finalInverterMake: '', finalInverterKw: '',
  intimationDate: '', intimationRejectDate: '', intimationRejectReason: '', meterInstolationDate: '', intimationApprovalDate: '',
  subsidyRedeem: 'no', subsidyRedeemName: '', subsidyAmount: '', subsidyDisbusmentDate: '',
  makeInvoice: 'no', consumerFile: 'PENDING', currentDepartment: 'Project Back Office',
};

const PHOTO_FIELDS = [
  { key: 'photoTerraceLayout', label: 'Terrace Layout' },
  { key: 'photoPanelLayout', label: 'Panel Layout' },
  { key: 'photoSolarInstallation', label: 'Photos of where Solar will be installed' },
  { key: 'photoInverterLocation', label: 'Location where the inverter is to be installed' },
  { key: 'photoEarthingLocation', label: 'Location where the earthing is to be done' },
  { key: 'photoMeterBox', label: 'Where the meter box and ECB are installed' },
];

const INSTALLATION_PHOTO_FIELDS = [
  { key: 'photoSiteOverview', label: 'SITE OVERVIEW PHOTO' },
  { key: 'photoPanelSrNo', label: 'PANEL SR NO PHOTO (IN PDF)', isPdf: true },
  { key: 'photoInverterSrNo', label: 'INVETER SR NO PHOTO' },
  { key: 'photoPanelPlacement', label: 'PANEL PLASEMENT CLERLY VISIBAL PHOTO' },
  { key: 'photoMountingStructure', label: 'MOUNTING STRUCTURE PHOTO PROPERLY VISIBLE' },
  { key: 'photoInverterInstalled', label: 'INVETER INSTOLLED PHOTO' },
  { key: 'photoAcdbDcdb', label: 'ACDB / DCDB PHOTO' },
  { key: 'photoEarthingConnection', label: 'ERTHING CONECTION VISIBLE PHOTO' },
  { key: 'photoCableWiringRoute1', label: 'CABLE ROUTE AND WIRING ROUTE PHOTO 1' },
  { key: 'photoCableWiringRoute2', label: 'CABLE ROUTE AND WIRING ROUTE PHOTO 2' },
  { key: 'photoCableWiringRoute3', label: 'CABLE ROUTE AND WIRING ROUTE PHOTO 3' },
  { key: 'photoEarthingPit', label: 'ERTHING PIT PHOTO' },
  { key: 'photoJioTagCustomer', label: 'JIO TAG CUSTOMER PHOTO' },
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

type SectionKey = 'project' | 'photos' | 'regDocs' | 'regProcess' | 'payment' | 'loanDocs' | 'installationPhotos' | 'installation';

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
  const [canViewBankDetails, setCanViewBankDetails] = useState(false);
  const [isExecutiveVerified, setIsExecutiveVerified] = useState(false);
  const [executiveName, setExecutiveName] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const token = getAuthToken();
    if (!token) return;
    axios.get(baseUrl.currentStaff, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const staff = res.data?.data || {};
        const role = staff.role || {};
        const roleName = (role.roleName || role.name || '').toLowerCase();
        const deptName = (
          typeof staff.department === 'string'
            ? staff.department
            : (staff.department?.name || staff.department?.roleName || '')
        ).toLowerCase();
        
        const isBO = roleName.includes('back office') || roleName.includes('backoffice') || deptName.includes('back office') || deptName.includes('backoffice');
        const isExec = roleName.includes('executive') || deptName.includes('executive');
        const isAdmin = roleName.includes('admin') || deptName.includes('admin');

        setIsBackOffice(isBO);
        setCanViewBankDetails(isBO);
        
        const staffName = staff.fullName || staff.name || '';
        if (staffName) {  
          setForm(prev => prev.registrationName ? prev : { ...prev, registrationName: staffName });
        }
      })
      .catch(() => {
        setIsBackOffice(false);
        setCanViewBankDetails(false);
      });
  }, [isOpen]);

  const getDefaultFormFromLead = (ld: ApiLead): FormState => {
    const quotations = ld.quotations || [];
    let panelMake = '';
    let panelWp = '';
    let inverterMake = '';
    let projectAmount = '';

    if (quotations.length > 0) {
      const lastQ = quotations[quotations.length - 1];
      const solarStr = lastQ.solarModule || '';
      const matchSolar = solarStr.match(/^([a-zA-Z\s\-]+)?\s*(\d+)/);
      panelMake = matchSolar ? (matchSolar[1] || '').trim() : solarStr;
      panelWp = matchSolar ? matchSolar[2] : '';

      const inverterStr = lastQ.inverter || '';
      const matchInverter = inverterStr.match(/^([a-zA-Z\s\-]+)?\s*(\d+(\.\d+)?)/);
      inverterMake = matchInverter ? (matchInverter[1] || '').trim() : inverterStr;

      const firstRow = lastQ.rows?.[0];
      const costVal = firstRow ? (firstRow.values?.[0] || '') : '';
      const matchCost = costVal.replace(/[^\d]/g, '');
      projectAmount = matchCost || '';
    }

    return {
      ...EMPTY_FORM,
      salesPersonName: ld.assignedTo?.fullName || (ld.assignedTo as any)?.name || ld.createdBy?.fullName || (ld.createdBy as any)?.name || '',
      creatorName: ld.createdBy?.fullName || (ld.createdBy as any)?.name || '',
      customerFullName: ld.fullName || (ld as any).name || '',
      registerMobileNumber: ld.contact || (ld as any).phone || (ld as any).mobile || '',
      locationLink: (ld as any).locationLink || '',
      address: (ld as any).address || '',
      city: (ld as any).city || '',
      pincode: (ld as any).pincode || '',
      discom: ld.discomName || '',
      panelMake,
      panelWp,
      inverterMake,
      projectAmount,
    };
  };

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
        const isVer = !!(d && d.isExecutiveVerified);
        setIsExecutiveVerified(isVer);
        if ((!isBackOffice || !isVer) && (activeSection === 'installation' || activeSection === 'installationPhotos')) {
          setActiveSection('project');
        }
        if (d) {
          setExecutiveName(d.executiveVerifiedBy?.fullName || d.executiveVerifiedBy?.name || '');
          setForm({
            projectCode: d.projectCode || '',
            srNo: d.srNo || '',
            salesPersonName: d.salesPersonName || lead.assignedTo?.fullName || lead.createdBy?.fullName || '',
            creatorName: d.creatorName || d.leadRefrance || lead.createdBy?.fullName || (lead.createdBy as any)?.name || '',
            customerFullName: d.customerFullName || lead.fullName || (lead as any).name || '',
            registerMobileNumber: d.registerMobileNumber || lead.contact || (lead as any).phone || '',
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
            installationStatus: d.installationStatus || 'Pending',
            installationDate: d.installationDate || (d.executiveVerifiedAt ? new Date(d.executiveVerifiedAt).toISOString().split('T')[0] : ''),
            pipeDispatchDate: d.pipeDispatchDate || '',
            pipeDispatchNote: d.pipeDispatchNote || '',
            panelDispatchDate: d.panelDispatchDate || '',
            panelDispatchNote: d.panelDispatchNote || '',
            fabricationDate: d.fabricationDate || '',
            fabricationTeamName: d.fabricationTeamName || '',
            fabricationNote: d.fabricationNote || '',
            wiringDate: d.wiringDate || '',
            wiringTeamName: d.wiringTeamName || '',
            wiringNote: d.wiringNote || '',
            elcbStatus: d.elcbStatus || 'Pending',
            elcbNote: d.elcbNote || '',
            giPipe80x40Consumption: d.giPipe80x40Consumption !== undefined && d.giPipe80x40Consumption !== null ? d.giPipe80x40Consumption.toString() : (d.hdgiPipe80x40?.toString() || '0'),
            giPipe60x40Consumption: d.giPipe60x40Consumption !== undefined && d.giPipe60x40Consumption !== null ? d.giPipe60x40Consumption.toString() : (d.hdgiPipe60x40?.toString() || '0'),
            giPipe40x40Consumption: d.giPipe40x40Consumption !== undefined && d.giPipe40x40Consumption !== null ? d.giPipe40x40Consumption.toString() : (d.hdgiPipe40x40?.toString() || '0'),
            giPipe20x40PatiPipeConsumption: d.giPipe20x40PatiPipeConsumption !== undefined && d.giPipe20x40PatiPipeConsumption !== null ? d.giPipe20x40PatiPipeConsumption.toString() : (d.hdgiPipe20x40PatiPipe?.toString() || '0'),
            giPipeConsumptionNote: d.giPipeConsumptionNote || '',

            meterFileMakeDate: d.meterFileMakeDate || '',
            meterFileRegDate: d.meterFileRegDate || '',
            meterFileMakePersonName: d.meterFileMakePersonName || '',
            dcrReportNo: d.dcrReportNo || '',
            dcrDate: d.dcrDate || '',
            finalPanelMake: d.finalPanelMake || d.panelMake || '',
            finalPanelWp: d.finalPanelWp?.toString() || d.panelWp?.toString() || '',
            finalNoOfPanel: d.finalNoOfPanel?.toString() || d.noOfPanel?.toString() || '',
            finalProjectKw: d.finalProjectKw?.toString() || d.totalKw?.toString() || '',
            finalInverterMake: d.finalInverterMake || d.inverterMake || '',
            finalInverterKw: d.finalInverterKw?.toString() || d.inverterKw?.toString() || '',
            intimationDate: d.intimationDate || '',
            intimationRejectDate: d.intimationRejectDate || '',
            intimationRejectReason: d.intimationRejectReason || '',
            meterInstolationDate: d.meterInstolationDate || '',
            intimationApprovalDate: d.intimationApprovalDate || '',
            subsidyRedeem: d.subsidyRedeem || 'no',
            subsidyRedeemName: d.subsidyRedeemName || '',
            subsidyAmount: d.subsidyAmount?.toString() || '',
            subsidyDisbusmentDate: d.subsidyDisbusmentDate || '',
            makeInvoice: d.makeInvoice || 'no',
            consumerFile: d.consumerFile || 'PENDING',
            currentDepartment: d.currentDepartment || 'Project Back Office',
          });
          const ef: Record<string, any> = {};
          [...PHOTO_FIELDS, ...INSTALLATION_PHOTO_FIELDS, ...REG_DOC_FIELDS, ...LOAN_DOC_FIELDS, 
            { key: 'downPaymentDoc' }, { key: 'loanFirstPaymentDoc' }, { key: 'loanSecondPaymentDoc' },
            { key: 'docDcrReport' }, { key: 'docPanelInverterSrNo' }, { key: 'docInvoice' }, { key: 'docWarrantyCertificate' }
          ].forEach(({ key }) => {
            if (d[key]) ef[key] = d[key];
          });
          setExistingFiles(ef);

          const hasLoan = d.applyForLoan === true || d.applyForLoan === 'true' || !!(d.loanDocQuotation || d.loanDocBankStatement || d.loanDocITRReturn || d.loanDocPanCard || d.loanDocAadhaarCard);
          setShowLoanDocs(hasLoan);
        } else {
          setForm(getDefaultFormFromLead(lead));
          setShowLoanDocs(false);
        }
      } catch {
        if (lead) setForm(getDefaultFormFromLead(lead));
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    if (!isOpen || !lead) return;
    setForm(getDefaultFormFromLead(lead));
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
      const projectFields: (keyof FormState)[] = [
        'creatorName', 'customerFullName', 'registerMobileNumber', 'registrationPortal', 'panelType',
        'panelMake', 'panelWp', 'noOfPanel',
        'inverterMake', 'inverterKw', 'inverterPhase', 'installationRoof',
        'discom', 'consumerConnectionType', 'elcbInstalled', 'elcbProvideBy',
        'wiringType', 'homeFloor', 'walkway', 'walkwayLengthFeet', 'ladder', 'ladderLengthFeet', 'hdgiPipeMake'
      ];
      projectFields.forEach(f => delete newErrors[f]);

      const requiredFields: (keyof FormState)[] = [
        'creatorName', 'customerFullName', 'registerMobileNumber', 'registrationPortal', 'panelType',
        'panelMake', 'panelWp', 'noOfPanel',
        'inverterMake', 'inverterKw', 'inverterPhase', 'installationRoof',
        'discom', 'consumerConnectionType', 'elcbInstalled', 'elcbProvideBy',
        'wiringType', 'homeFloor', 'walkway', 'ladder', 'hdgiPipeMake'
      ];

      requiredFields.forEach(field => {
        if (!form[field]) {
          const fieldNames: Record<string, string> = {
            creatorName: 'Lead Reference',
            customerFullName: 'Customer Full Name',
            registerMobileNumber: 'Register Mobile Number',
            registrationPortal: 'Registration Portal',
            panelType: 'Panel Type',
            panelMake: 'Panel Make',
            panelWp: 'Panel WP',
            noOfPanel: 'No. of Panels',
            inverterMake: 'Inverter Make',
            inverterKw: 'Inverter KW',
            inverterPhase: 'Inverter Phase',
            installationRoof: 'Installation Roof',
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
      const bankFields = ['accountHolderName', 'accountNo', 'ifscCode', 'branchName', 'bankName'];
      [...paymentFields, ...bankFields].forEach(f => delete newErrors[f]);
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

      if (canViewBankDetails) {
        if (form.accountHolderName && form.accountHolderName.trim()) {
          const val = form.accountHolderName.trim();
          if (!/^[a-zA-Z\s\.\'-]{2,}$/.test(val)) {
            newErrors.accountHolderName = 'Account holder name must contain letters only (min 2 chars)';
          }
        }

        if (form.accountNo && form.accountNo.trim()) {
          const val = form.accountNo.trim();
          if (!/^\d{9,18}$/.test(val)) {
            newErrors.accountNo = 'Bank account number must be between 9 and 18 digits';
          }
        }

        if (form.ifscCode && form.ifscCode.trim()) {
          const val = form.ifscCode.trim().toUpperCase();
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(val)) {
            newErrors.ifscCode = 'IFSC code must be 11 characters (e.g. SBIN0001234)';
          }
        }

        if (form.branchName && form.branchName.trim()) {
          const val = form.branchName.trim();
          if (!/^[a-zA-Z0-9\s\.\,-]{2,}$/.test(val) || /^\d+$/.test(val)) {
            newErrors.branchName = 'Branch name must contain valid text (min 2 chars)';
          }
        }

        if (form.bankName && form.bankName.trim()) {
          const val = form.bankName.trim();
          if (!/^[a-zA-Z\s\.\'-]{2,}$/.test(val)) {
            newErrors.bankName = 'Bank name must contain letters only (min 2 chars)';
          }
        }
      }
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
      const paymentCheckFields = ['paymentMode', 'projectAmount', 'subsidyLessProject', 'accountHolderName', 'accountNo', 'ifscCode', 'branchName', 'bankName'];
      return !paymentCheckFields.some(f => !!newErrors[f]);
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
        } else if (isBackOffice && isExecutiveVerified) {
          setActiveSection('installationPhotos');
        } else {
          handleSubmit();
        }
      } else {
        toast.error('Please fill all required Payment Details first');
      }
    } else if (activeSection === 'loanDocs') {
      if (validateSection('loanDocs')) {
        if (isBackOffice && isExecutiveVerified) {
          setActiveSection('installationPhotos');
        } else {
          handleSubmit();
        }
      } else {
        toast.error('Please upload all required Loan Documents first');
      }
    } else if (activeSection === 'installationPhotos') {
      if (isBackOffice && isExecutiveVerified) {
        setActiveSection('installation');
      } else {
        handleSubmit();
      }
    } else if (activeSection === 'installation') {
      handleSubmit();
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
      fd.append('isFullyCompleted', 'true');

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
  if (showLoanDocs) {
    sections.push({ key: 'loanDocs', label: 'Loan Docs', icon: <FileText className="h-4 w-4" /> });
  }
  if (isBackOffice && isExecutiveVerified) {
    sections.push({ key: 'installationPhotos', label: 'Inst. Photos', icon: <Camera className="h-4 w-4" /> });
    sections.push({ key: 'installation', label: 'Installation', icon: <CheckCircle className="h-4 w-4" /> });
  }

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
                          error={errors.address}
                          required
                        />
                        <FormInput
                          label="City"
                          name="city"
                          placeholder="City..."
                          value={form.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                          error={errors.city}
                          required
                        />
                        <FormInput
                          label="Pincode"
                          name="pincode"
                          placeholder="Enter 6-digit Pincode"
                          maxLength={6}
                          value={form.pincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            handleFormChange('pincode', val);
                          }}
                          error={errors.pincode}
                          required
                        />
                        <FormInput
                          label="Consumer No"
                          name="consumerNo"
                          placeholder="Consumer No..."
                          value={form.consumerNo}
                          onChange={(e) => handleFormChange('consumerNo', e.target.value)}
                          error={errors.consumerNo}
                          required
                        />
                        <FormInput
                          label="Division"
                          name="division"
                          placeholder="Division..."
                          value={form.division}
                          onChange={(e) => handleFormChange('division', e.target.value)}
                          error={errors.division}
                          required
                        />
                        <FormInput
                          label="Sub Division"
                          name="subDivision"
                          placeholder="Sub Division..."
                          value={form.subDivision}
                          onChange={(e) => handleFormChange('subDivision', e.target.value)}
                          error={errors.subDivision}
                          required
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
                      onChange={() => {}}
                      disabled
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
                    <FormInput label="Meter Charge (Discom)" name="_discom_display" value={form.discom} onChange={() => {}} disabled className="bg-gray-100 font-bold" />
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
                  
                  {canViewBankDetails && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Bank Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormInput
                          label="Bank Account Holder Name"
                          name="accountHolderName"
                          value={form.accountHolderName}
                          onChange={(e) => handleFormChange('accountHolderName', e.target.value.toUpperCase())}
                          error={errors.accountHolderName}
                        />
                        <FormInput
                          label="Bank Account No"
                          name="accountNo"
                          value={form.accountNo}
                          maxLength={18}
                          onChange={(e) => handleFormChange('accountNo', e.target.value.replace(/\D/g, ''))}
                          error={errors.accountNo}
                        />
                        <FormInput
                          label="IFSC Code"
                          name="ifscCode"
                          value={form.ifscCode}
                          maxLength={11}
                          onChange={(e) => handleFormChange('ifscCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                          error={errors.ifscCode}
                        />
                        <FormInput
                          label="Bank Branch"
                          name="branchName"
                          value={form.branchName}
                          onChange={(e) => handleFormChange('branchName', e.target.value.toUpperCase())}
                          error={errors.branchName}
                        />
                        <FormInput
                          label="Bank Name"
                          name="bankName"
                          value={form.bankName}
                          onChange={(e) => handleFormChange('bankName', e.target.value.toUpperCase())}
                          error={errors.bankName}
                        />
                      </div>
                    </div>
                  )}

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

              {/* ─── Installation & Execution Details ───────────────────────────── */}
              {activeSection === 'installation' && isBackOffice && isExecutiveVerified && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="Executive Person Name"
                      name="executiveName"
                      value={executiveName}
                      onChange={() => {}}
                      disabled
                    />
                    <FormSelect
                      label="Installation"
                      name="installationStatus"
                      value={form.installationStatus}
                      onChange={(val) => handleFormChange('installationStatus', val)}
                      options={[
                        { value: 'Pending', label: 'Pending' },
                        { value: 'Done', label: 'Done' }
                      ]}
                    />
                    <div className="w-full relative">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">
                        Installation Date
                      </label>
                      <Calendar
                        value={form.installationDate ? new Date(form.installationDate) : null}
                        onChange={(d) => handleFormChange('installationDate', d ? d.toISOString().split('T')[0] : '')}
                      />
                    </div>
                    <div className="w-full relative">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">
                        Pipe Dispatch Date
                      </label>
                      <Calendar
                        value={form.pipeDispatchDate ? new Date(form.pipeDispatchDate) : null}
                        onChange={(d) => handleFormChange('pipeDispatchDate', d ? d.toISOString().split('T')[0] : '')}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FormInput
                        label="Pipe Dispatch Note"
                        name="pipeDispatchNote"
                        placeholder="Enter note..."
                        value={form.pipeDispatchNote}
                        onChange={(e) => handleFormChange('pipeDispatchNote', e.target.value)}
                      />
                    </div>
                    <div className="w-full relative">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">
                        Panel Dispatch Date
                      </label>
                      <Calendar
                        value={form.panelDispatchDate ? new Date(form.panelDispatchDate) : null}
                        onChange={(d) => handleFormChange('panelDispatchDate', d ? d.toISOString().split('T')[0] : '')}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FormInput
                        label="Panel Dispatch Note"
                        name="panelDispatchNote"
                        placeholder="Enter note..."
                        value={form.panelDispatchNote}
                        onChange={(e) => handleFormChange('panelDispatchNote', e.target.value)}
                      />
                    </div>
                    <div className="w-full relative">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">
                        Fabrication Date
                      </label>
                      <Calendar
                        value={form.fabricationDate ? new Date(form.fabricationDate) : null}
                        onChange={(d) => handleFormChange('fabricationDate', d ? d.toISOString().split('T')[0] : '')}
                      />
                    </div>
                    <FormInput
                      label="Fabrication Team Name"
                      name="fabricationTeamName"
                      placeholder="Enter team name..."
                      value={form.fabricationTeamName}
                      onChange={(e) => handleFormChange('fabricationTeamName', e.target.value)}
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="Fabrication Note"
                        name="fabricationNote"
                        placeholder="Enter note..."
                        value={form.fabricationNote}
                        onChange={(e) => handleFormChange('fabricationNote', e.target.value)}
                      />
                    </div>
                    <div className="w-full relative">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">
                        Wiring Date
                      </label>
                      <Calendar
                        value={form.wiringDate ? new Date(form.wiringDate) : null}
                        onChange={(d) => handleFormChange('wiringDate', d ? d.toISOString().split('T')[0] : '')}
                      />
                    </div>
                    <FormInput
                      label="Wiring Team Name"
                      name="wiringTeamName"
                      placeholder="Enter team name..."
                      value={form.wiringTeamName}
                      onChange={(e) => handleFormChange('wiringTeamName', e.target.value)}
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="Wiring Note"
                        name="wiringNote"
                        placeholder="Enter note..."
                        value={form.wiringNote}
                        onChange={(e) => handleFormChange('wiringNote', e.target.value)}
                      />
                    </div>
                    <FormSelect
                      label="ELCB / RCCB"
                      name="elcbStatus"
                      value={form.elcbStatus}
                      onChange={(val) => handleFormChange('elcbStatus', val)}
                      options={[
                        { value: 'Pending', label: 'Pending' },
                        { value: 'Done', label: 'Done' }
                      ]}
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="ELCB / RCCB Note"
                        name="elcbNote"
                        placeholder="Enter note..."
                        value={form.elcbNote}
                        onChange={(e) => handleFormChange('elcbNote', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">GI Pipe Consumption Report</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="80 X 40 *"
                        name="giPipe80x40Consumption"
                        type="number"
                        value={form.giPipe80x40Consumption}
                        onChange={(e) => handleFormChange('giPipe80x40Consumption', e.target.value)}
                      />
                      <FormInput
                        label="60 X 40 *"
                        name="giPipe60x40Consumption"
                        type="number"
                        value={form.giPipe60x40Consumption}
                        onChange={(e) => handleFormChange('giPipe60x40Consumption', e.target.value)}
                      />
                      <FormInput
                        label="40 X 40"
                        name="giPipe40x40Consumption"
                        type="number"
                        value={form.giPipe40x40Consumption}
                        onChange={(e) => handleFormChange('giPipe40x40Consumption', e.target.value)}
                      />
                      <FormInput
                        label="20 X 40 Pati Pipe"
                        name="giPipe20x40PatiPipeConsumption"
                        type="number"
                        value={form.giPipe20x40PatiPipeConsumption}
                        onChange={(e) => handleFormChange('giPipe20x40PatiPipeConsumption', e.target.value)}
                      />
                      <div className="md:col-span-2">
                        <FormInput
                          label="GI Pipe Note"
                          name="giPipeConsumptionNote"
                          placeholder="Enter note..."
                          value={form.giPipeConsumptionNote}
                          onChange={(e) => handleFormChange('giPipeConsumptionNote', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Meter File, After Installation, Intimation & Subsidy (Requires Make Invoice = YES) ── */}
                  {form.makeInvoice === 'yes' ? (
                    <>
                      {/* ── Meter File (Image 2 Section 1) ────────────────── */}
                      <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/20 space-y-4">
                        <div className="bg-[#F6D2B4] px-4 py-2 rounded-lg border border-orange-300 shadow-xs flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-900" />
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">METER FILE</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="w-full relative">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Meter File Make Date</label>
                            <Calendar
                              value={form.meterFileMakeDate ? new Date(form.meterFileMakeDate) : null}
                              onChange={(d) => handleFormChange('meterFileMakeDate', d ? d.toISOString().split('T')[0] : '')}
                            />
                          </div>
                          <div className="w-full relative">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Meter File Registration Date</label>
                            <Calendar
                              value={form.meterFileRegDate ? new Date(form.meterFileRegDate) : null}
                              onChange={(d) => handleFormChange('meterFileRegDate', d ? d.toISOString().split('T')[0] : '')}
                            />
                          </div>
                          <FormInput
                            label="Meter File Make Person Name (Auto)"
                            name="meterFileMakePersonName"
                            placeholder="Auto filled user name"
                            value={form.meterFileMakePersonName}
                            onChange={(e) => handleFormChange('meterFileMakePersonName', e.target.value)}
                          />
                          <FormInput
                            label="DCR Report No"
                            name="dcrReportNo"
                            placeholder="Enter DCR report number"
                            value={form.dcrReportNo}
                            onChange={(e) => handleFormChange('dcrReportNo', e.target.value)}
                          />
                          <div className="w-full relative">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">DCR Date</label>
                            <Calendar
                              value={form.dcrDate ? new Date(form.dcrDate) : null}
                              onChange={(d) => handleFormChange('dcrDate', d ? d.toISOString().split('T')[0] : '')}
                            />
                          </div>
                          <FileInput
                            fieldKey="docDcrReport"
                            label="DCR Report Document"
                            accept="image/*,application/pdf"
                            isPdf
                            existingFiles={existingFiles}
                            files={files}
                            onFileChange={handleFileChange}
                            required={false}
                          />
                        </div>
                      </div>

                      {/* ── After Installation Final Data (Image 2 Section 2) ────────────────── */}
                      <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/20 space-y-4">
                        <div className="bg-[#F6D2B4] px-4 py-2 rounded-lg border border-orange-300 shadow-xs flex items-center gap-2">
                          <Zap className="h-4 w-4 text-slate-900" />
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">AFTER INSTALLATION FINAL DATA</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Panel Make"
                            name="finalPanelMake"
                            placeholder="Panel Make"
                            value={form.finalPanelMake}
                            onChange={(e) => handleFormChange('finalPanelMake', e.target.value)}
                          />
                          <FormInput
                            label="Panel WP"
                            name="finalPanelWp"
                            type="number"
                            placeholder="Panel WP"
                            value={form.finalPanelWp}
                            onChange={(e) => {
                              const wp = e.target.value;
                              const count = form.finalNoOfPanel;
                              const kw = (wp && count) ? ((Number(wp) * Number(count)) / 1000).toFixed(2) : form.finalProjectKw;
                              setForm(prev => ({ ...prev, finalPanelWp: wp, finalProjectKw: kw }));
                            }}
                          />
                          <FormInput
                            label="No of Panel"
                            name="finalNoOfPanel"
                            type="number"
                            placeholder="No of Panel"
                            value={form.finalNoOfPanel}
                            onChange={(e) => {
                              const count = e.target.value;
                              const wp = form.finalPanelWp;
                              const kw = (wp && count) ? ((Number(wp) * Number(count)) / 1000).toFixed(2) : form.finalProjectKw;
                              setForm(prev => ({ ...prev, finalNoOfPanel: count, finalProjectKw: kw }));
                            }}
                          />
                          <FormInput
                            label="Final Project KW"
                            name="finalProjectKw"
                            type="number"
                            placeholder="Final Project KW"
                            value={form.finalProjectKw}
                            onChange={(e) => handleFormChange('finalProjectKw', e.target.value)}
                          />
                          <FormInput
                            label="Inverter Make"
                            name="finalInverterMake"
                            placeholder="Inverter Make"
                            value={form.finalInverterMake}
                            onChange={(e) => handleFormChange('finalInverterMake', e.target.value)}
                          />
                          <FormInput
                            label="Inverter KW"
                            name="finalInverterKw"
                            type="number"
                            placeholder="Inverter KW"
                            value={form.finalInverterKw}
                            onChange={(e) => handleFormChange('finalInverterKw', e.target.value)}
                          />
                          <div className="md:col-span-2">
                            <FileInput
                              fieldKey="docPanelInverterSrNo"
                              label="Panel & Inverter SR No Document"
                              accept="image/*,application/pdf"
                              isPdf
                              existingFiles={existingFiles}
                              files={files}
                              onFileChange={handleFileChange}
                              required={false}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Intimation and Subsidy (Image 2 Section 3) ────────────────── */}
                      <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/20 space-y-4">
                        <div className="bg-[#F6D2B4] px-4 py-2 rounded-lg border border-orange-300 shadow-xs flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-slate-900" />
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">INTIMATION AND SUBSIDY</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="w-full relative">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Intimation Date</label>
                            <Calendar
                              value={form.intimationDate ? new Date(form.intimationDate) : null}
                              onChange={(d) => handleFormChange('intimationDate', d ? d.toISOString().split('T')[0] : '')}
                            />
                          </div>
                          <div className="w-full relative">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Intimation Reject Date</label>
                            <Calendar
                              value={form.intimationRejectDate ? new Date(form.intimationRejectDate) : null}
                              onChange={(d) => handleFormChange('intimationRejectDate', d ? d.toISOString().split('T')[0] : '')}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FormInput
                              label="Intimation Reject Reason"
                              name="intimationRejectReason"
                              placeholder="Enter reject reason if any..."
                              value={form.intimationRejectReason}
                              onChange={(e) => handleFormChange('intimationRejectReason', e.target.value)}
                            />
                          </div>
                          <div className="w-full relative">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Meter Installation Date</label>
                            <Calendar
                              value={form.meterInstolationDate ? new Date(form.meterInstolationDate) : null}
                              onChange={(d) => handleFormChange('meterInstolationDate', d ? d.toISOString().split('T')[0] : '')}
                            />
                          </div>
                          <div className="w-full relative">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Intimation Approval Date</label>
                            <Calendar
                              value={form.intimationApprovalDate ? new Date(form.intimationApprovalDate) : null}
                              onChange={(d) => handleFormChange('intimationApprovalDate', d ? d.toISOString().split('T')[0] : '')}
                            />
                          </div>
                          <FormSelect
                            label="Subsidy Redeem"
                            name="subsidyRedeem"
                            value={form.subsidyRedeem}
                            onChange={(val) => handleFormChange('subsidyRedeem', val)}
                            options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                          />
                          <FormInput
                            label="Subsidy Redeem Name (Auto)"
                            name="subsidyRedeemName"
                            placeholder="Auto filled user name"
                            value={form.subsidyRedeemName}
                            onChange={(e) => handleFormChange('subsidyRedeemName', e.target.value)}
                          />
                          <FormInput
                            label="Subsidy Amount"
                            name="subsidyAmount"
                            type="number"
                            placeholder="e.g. 78000"
                            value={form.subsidyAmount}
                            onChange={(e) => handleFormChange('subsidyAmount', e.target.value)}
                          />
                          <div className="w-full relative">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Subsidy Disbursement Date</label>
                            <Calendar
                              value={form.subsidyDisbusmentDate ? new Date(form.subsidyDisbusmentDate) : null}
                              onChange={(d) => handleFormChange('subsidyDisbusmentDate', d ? d.toISOString().split('T')[0] : '')}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* ─── Required Photos for Installation (Image 1) ───────────────────── */}
              {activeSection === 'installationPhotos' && isBackOffice && isExecutiveVerified && (
                <div className="space-y-4">
                  <SectionTitle>Required Photos for Installation</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {INSTALLATION_PHOTO_FIELDS.map((f) => (
                      <FileInput
                        key={f.key}
                        fieldKey={f.key}
                        label={f.label}
                        accept={f.isPdf ? 'application/pdf' : 'image/*,application/pdf'}
                        isPdf={f.isPdf}
                        existingFiles={existingFiles}
                        files={files}
                        onFileChange={handleFileChange}
                        required={false}
                      />
                    ))}
                  </div>
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
              {saving ? 'Saving...' : (activeSection === 'installation' || (!isExecutiveVerified && ((activeSection === 'payment' && !showLoanDocs) || activeSection === 'loanDocs'))) ? 'Save Details' : 'Next '}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
