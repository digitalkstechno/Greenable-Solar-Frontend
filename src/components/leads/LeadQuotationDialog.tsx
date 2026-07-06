import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import { ApiLead } from './types';
import FormInput from '../ui/Input';
import { Trash2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: ApiLead;
  onRefresh: () => void;
  editQuotationData?: any;
  onQuotationSaved?: (quotations: any[]) => void;
}

const formatNumberWithCommas = (num: string) => {
  if (!num || num.toUpperCase() === 'INCLUDED') return num;
  const cleanNum = num.replace(/\D/g, '');
  if (!cleanNum) return num;
  return parseInt(cleanNum, 10).toLocaleString('en-IN');
};

const stripCommas = (str: string) => {
  if (!str || str.toUpperCase() === 'INCLUDED') return str;
  return str.replace(/,/g, '');
};

const HighlightableInput = ({ value, onChange, placeholder, className }: { value: string; onChange: (val: string) => void; placeholder?: string; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !ref.current) return;
    const range = selection.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return;

    const selectedText = range.toString();

    // Skip if selection is only whitespace
    if (selectedText.trim() === '') {
      selection.removeAllRanges();
      return;
    }

    // Check if selection is already inside a <mark> tag — if so, unwrap it
    let node: Node | null = range.commonAncestorContainer;
    let markAncestor: HTMLElement | null = null;
    while (node && node !== ref.current) {
      if (node.nodeType === 1 && (node as HTMLElement).tagName === 'MARK') {
        markAncestor = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }

    if (markAncestor) {
      // Un-highlight: replace <mark> with its text content
      const textNode = document.createTextNode(markAncestor.textContent || '');
      markAncestor.replaceWith(textNode);
    } else {
      // Highlight: wrap selection in <mark>
      const mark = document.createElement('mark');
      mark.style.backgroundColor = '#fff200';
      mark.style.padding = '0 1px';
      try {
        range.surroundContents(mark);
      } catch (e) {
        // surroundContents fails if selection spans multiple elements; fallback
        const contents = range.extractContents();
        mark.appendChild(contents);
        range.insertNode(mark);
      }
    }

    selection.removeAllRanges();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseUp={handleMouseUp}
      onInput={handleInput}
      data-placeholder={placeholder}
      className={className}
      style={{ minHeight: '1.5em', outline: 'none' }}
    />
  );
};

export default function LeadQuotationDialog({ isOpen, onClose, lead, onRefresh, editQuotationData, onQuotationSaved }: Props) {
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [solarModule, setSolarModule] = useState('');
  const [inverter, setInverter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>(['OPTION 1']);
  const [rows, setRows] = useState([
    { title: 'Design, Supply, Installation, Commissioning of On-Grid, Solar Power System', values: [''] },
    { title: 'Solar Meter Charge', values: ['INCLUDED'] },
    { title: 'GST % (AS PER GOVERNMENT RULES) ', values: ['INCLUDED'] },
    { title: 'Total Applicable Subsidy ( Subsidy Receive Consumer Bank Account ) ', values: [''] },
    { title: 'After Subsidy Received Consumer System Cost ', values: [''] },
    { title: 'Units Generation kWh / kw / month Average (Approx)', values: [''] },
    { title: 'Auto cleaning Sprinkler System', values: [''] },
  ]);
  const [bomItems, setBomItems] = useState<{ srNo: string; description: string; uom: string; qty: string; size: string; make: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ date?: string; solarModule?: string; inverter?: string }>({});

  // useEffect(() => {
  //   if (isOpen && lead?._id) {
  //     // First populate with whatever we have in the prop
  //     if (lead.quotation) {
  //       setDate(lead.quotation.date ? new Date(lead.quotation.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
  //       setSolarModule(lead.quotation.solarModule || '');
  //       setInverter(lead.quotation.inverter || '');
  //       if (lead.quotation.options && lead.quotation.options.length > 0) {
  //         setOptions(lead.quotation.options);
  //       }
  //       if (lead.quotation.rows && lead.quotation.rows.length > 0) {
  //         setRows(lead.quotation.rows);
  //       }
  //     }

  //     // Then fetch the latest from server in case the prop is stale
  //     axios.get(`${baseUrl.findLeadById}/${lead._id}`, {
  //       headers: { Authorization: `Bearer ${getAuthToken()}` }
  //     }).then(res => {
  //       const latestLead = res.data.data;
  //       if (latestLead?.quotation && (latestLead.quotation.solarModule || latestLead.quotation.inverter || (latestLead.quotation.options && latestLead.quotation.options.length > 0) || (latestLead.quotation.rows && latestLead.quotation.rows.length > 0))) {
  //         setDate(latestLead.quotation.date ? new Date(latestLead.quotation.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
  //         setSolarModule(latestLead.quotation.solarModule || '');
  //         setInverter(latestLead.quotation.inverter || '');
  //         if (latestLead.quotation.options && latestLead.quotation.options.length > 0) {
  //           setOptions(latestLead.quotation.options);
  //         }
  //         if (latestLead.quotation.rows && latestLead.quotation.rows.length > 0) {
  //           setRows(latestLead.quotation.rows);
  //         }
  //       }
  //     }).catch(err => {
  //       console.error("Failed to fetch latest quotation data", err);
  //     });
  //   } else if (isOpen) {
  //     // Reset
  //     setDate(new Date().toISOString().substring(0, 10));
  //     setSolarModule('');
  //     setInverter('');
  //     setOptions(['OPTION 1']);
  //     setRows([
  //       { title: 'SOLAR MODULE MAKE', values: [''] },
  //       { title: 'SYSTEM CAPACITY', values: [''] },
  //       { title: 'METER CHARGES REGISTRATION', values: [''] },
  //       { title: 'CUSTOMER PAYABLE AMOUNT', values: [''] },
  //       { title: 'SUBSIDY', values: [''] },
  //       { title: 'EFFECTIVE PRICE', values: [''] },
  //     ]);
  //   }
  //   setEditingId(null);
  // }, [isOpen, lead]);

  useEffect(() => {
    if (isOpen && !editQuotationData) {
      // Reset for Add New
      setDate(new Date().toISOString().substring(0, 10));
      setSolarModule('');
      setInverter('');
      setOptions(['OPTION 1']);
      setRows([
        { title: 'Design, Supply, Installation, Commissioning of On-Grid, Solar Power System', values: [''] },
        { title: 'Solar Meter Charge', values: ['INCLUDED'] },
        { title: 'GST % (AS PER GOVERNMENT RULES) ', values: ['INCLUDED'] },
        { title: 'Total Applicable Subsidy( Subsidy Receive Consumer Bank Account )', values: [''] },
        { title: 'After Subsidy Received Consumer System Cost ', values: [''] },
        { title: 'Units Generation kWh / kw / month Average (Approx)', values: [''] },
        { title: 'Auto cleaning Sprinkler System', values: [''] },
      ]);
      setBomItems([]);
      setEditingId(null);
      setErrors({});
    }
  }, [isOpen, editQuotationData]);

  useEffect(() => {
    if (isOpen && editQuotationData) {
      setDate(editQuotationData.date ? new Date(editQuotationData.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10));
      setSolarModule(editQuotationData.solarModule || '');
      setInverter(editQuotationData.inverter || '');
      setOptions(editQuotationData.options?.length ? editQuotationData.options : ['OPTION 1']);
      setRows(editQuotationData.rows?.length ? editQuotationData.rows : [{ title: '', values: [''] }]);
      setBomItems(editQuotationData.bomItems?.length ? editQuotationData.bomItems : []);
      setEditingId(editQuotationData.id);
      setErrors({});
    }
  }, [isOpen, editQuotationData]);

  const handleAddOption = () => {
    if (options.length >= 5) {
      toast.warning('Max 5 options allowed');
      return;
    }
    const newOptions = [...options, `OPTION ${options.length + 1}`];
    setOptions(newOptions);
    // setRows(rows.map(row => ({ ...row, values: [...row.values, ''] })));
    setRows(rows.map(row => {
      const titleUpper = row.title.toUpperCase();
      const defaultValue = (titleUpper.includes('SOLAR METER CHARGE') || titleUpper.includes('GST')) ? 'INCLUDED' : '';
      return { ...row, values: [...row.values, defaultValue] };
    }));
  };

  const handleAddRow = () => {
    setRows([...rows, { title: '', values: Array(options.length).fill('') }]);
  };

  // const handleSave = async () => {
  //   setSaving(true);
  //   try {
  //     const payload = {
  //       quotation: {
  //         date,
  //         solarModule,
  //         inverter,
  //         options,
  //         rows
  //       }
  //     };

  //     await axios.put(
  //       `${baseUrl.updateLead}/${lead._id}`,
  //       payload,
  //       { headers: { Authorization: `Bearer ${getAuthToken()}` } }
  //     );

  //     toast.success('Quotation saved successfully');
  //     onRefresh();
  //     onClose();
  //   } catch (e: any) {
  //     toast.error(e?.response?.data?.message || 'Failed to save quotation');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const handleSave = async () => {
    const newErrors: { date?: string; solarModule?: string; inverter?: string } = {};
    if (!date) {
      newErrors.date = 'Date is required';
    }
    if (!solarModule || !solarModule.trim()) {
      newErrors.solarModule = 'Solar Module is required';
    }
    if (!inverter || !inverter.trim()) {
      newErrors.inverter = 'Inverter is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validate that no row has values without a title
    const hasInvalidRow = rows.some(row => {
      const hasValues = row.values && row.values.some(v => v && v.trim() !== "");
      const hasTitle = row.title && row.title.trim() !== "";
      return hasValues && !hasTitle;
    });

    if (hasInvalidRow) {
      toast.error("Please enter a Row Title for all rows with values.");
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const idToUse = editQuotationData?.id || editingId;
      const existingQuotations = lead.quotations || [];
      const existingQ = existingQuotations.find((q: any) => q.id === idToUse);
      const cleanedRows = rows.filter(row => {
        const hasTitle = row.title && row.title.trim() !== "";
        const hasValues = row.values && row.values.some(v => v && v.trim() !== "");
        return hasTitle || hasValues;
      });

      const cleanedBomItems = bomItems
        .filter(item => {
          return (
            (item.description && item.description.trim() !== "") ||
            (item.uom && item.uom.trim() !== "") ||
            (item.qty && item.qty.trim() !== "") ||
            (item.size && item.size.trim() !== "") ||
            (item.make && item.make.trim() !== "")
          );
        })
        .map((item, idx) => ({
          ...item,
          srNo: String(idx + 1)
        }));

      const newQuotation = {
        id: idToUse || Date.now().toString(),
        date,
        createdAt: new Date().toISOString(),
        solarModule,
        inverter,
        options,
        rows: cleanedRows,
        bomItems: cleanedBomItems,
      };
      const updatedQuotations = idToUse
        ? existingQuotations.map((q: any) => (q.id === idToUse ? newQuotation : q))
        : [...existingQuotations, newQuotation];

      await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        { quotations: updatedQuotations },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      toast.success('Quotation saved successfully');
      if (onQuotationSaved) onQuotationSaved(updatedQuotations);
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleRowTitleChange = (index: number, val: string) => {
    const newRows = [...rows];
    newRows[index].title = val;
    // Auto-fill INCLUDED for Solar Meter Charge and GST rows when title matches
    const titleUpper = val.toUpperCase();
    if (titleUpper.includes('SOLAR METER CHARGE') || titleUpper.includes('GST')) {
      newRows[index].values = newRows[index].values.map(v => v === '' ? 'INCLUDED' : v);
    }
    setRows(newRows);
  };

  const handleRowValueChange = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = [...rows];
    const rowTitle = newRows[rowIndex].title.toLowerCase();
    const isAutoCleaningRow = rowTitle.includes('auto cleaning');
    
    let cleanVal;
    if (val.toUpperCase() === 'INCLUDED') {
      cleanVal = 'INCLUDED';
    } else if (isAutoCleaningRow) {
      // Allow alphanumeric and spaces for auto cleaning row
      cleanVal = val;
    } else {
      // For other rows, keep only digits (and commas for display, but store clean)
      cleanVal = stripCommas(val).replace(/[^\d]/g, '');
    }
    
    newRows[rowIndex].values[colIndex] = cleanVal;

    // Auto-calculate "After Subsidy" if relevant rows exist
    const baseCostIdx = newRows.findIndex(r => r.title.toLowerCase().includes('design, supply'));
    const subsidyIdx = newRows.findIndex(r => r.title.toLowerCase().includes('total applicable subsidy'));
    const finalCostIdx = newRows.findIndex(r => r.title.toLowerCase().includes('after subsidy received'));

    if (baseCostIdx !== -1 && subsidyIdx !== -1 && finalCostIdx !== -1 && !isAutoCleaningRow) {
      const baseCost = parseInt(newRows[baseCostIdx].values[colIndex] || '0', 10) || 0;
      const subsidy = parseInt(newRows[subsidyIdx].values[colIndex] || '0', 10) || 0;
      
      // If either has a value, calculate it (prevents overriding if user explicitly wants it empty, but auto-updates normally)
      if (newRows[baseCostIdx].values[colIndex] || newRows[subsidyIdx].values[colIndex]) {
        newRows[finalCostIdx].values[colIndex] = String(Math.max(0, baseCost - subsidy));
      }
    }

    setRows(newRows);
  };

  const handleOptionNameChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) {
      toast.warning('At least one option is required');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    const newRows = rows.map(row => ({
      ...row,
      values: row.values.filter((_, i) => i !== index)
    }));
    setRows(newRows);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      toast.warning('At least one row is required');
      return;
    }
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleAddBomItem = () => {
    setBomItems([...bomItems, { srNo: String(bomItems.length + 1), description: '', uom: '', qty: '', size: '', make: '' }]);
  };

  const handleBomItemChange = (index: number, field: string, val: string) => {
    const newItems = [...bomItems];
    (newItems[index] as any)[field] = val;
    setBomItems(newItems);
  };

  const handleRemoveBomItem = (index: number) => {
    const newItems = bomItems.filter((_, i) => i !== index).map((item, i) => ({ ...item, srNo: String(i + 1) }));
    setBomItems(newItems);
  };



  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editQuotationData ? 'Edit Quotation' : 'Add Quotation'}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Quotation'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Date"
            required
            name="date"
            type="date"
            value={date}
            onChange={(e: any) => {
              setDate(e.target.value);
              if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
            }}
            error={errors.date}
            min={new Date().toISOString().substring(0, 10)}
          />
          <FormInput
            label="Solar Module"
            required
            name="solarModule"
            type="text"
            value={solarModule}
            onChange={(e: any) => {
              setSolarModule(e.target.value);
              if (errors.solarModule) setErrors(prev => ({ ...prev, solarModule: undefined }));
            }}
            error={errors.solarModule}
          />
          <FormInput
            label="Inverter"
            required
            name="inverter"
            type="text"
            value={inverter}
            onChange={(e: any) => {
              setInverter(e.target.value);
              if (errors.inverter) setErrors(prev => ({ ...prev, inverter: undefined }));
            }}
            error={errors.inverter}
          />
        </div>

        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium text-gray-700">Options (Columns):</span>
            <span className="text-xs text-gray-400">Max 5 options</span>
          </div>

          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-secondary text-white">
                  <th className="p-2 border border-secondary w-64 uppercase text-xs font-bold">ROW TITLE</th>
                  {options.map((opt, i) => (
                    <th key={i} className="p-2 border border-secondary font-bold uppercase text-xs text-center relative group">
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionNameChange(i, e.target.value)}
                          className="header-option-input w-full placeholder-orange-200 outline-none text-center"
                          placeholder={`OPTION ${i + 1}`}
                        />
                        {options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(i)}
                            className="text-white hover:text-red-200 p-0.5 rounded transition-colors flex-shrink-0"
                            title="Remove Column"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-2 border border-secondary w-10 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="bg-white hover:bg-gray-50 border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200">
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => handleRowTitleChange(rIdx, e.target.value)}
                        className="w-full uppercase text-xs font-semibold text-gray-700 px-2 py-1 outline-none border border-transparent focus:border-gray-300 focus:bg-white bg-gray-50 rounded"
                        placeholder="Row Title"
                      />
                    </td>
                    {row.values.map((val, cIdx) => (
                      <td key={cIdx} className="p-1 border-r border-gray-200">
                        <input
                          type="text"
                          value={formatNumberWithCommas(val)}
                          onChange={(e) => handleRowValueChange(rIdx, cIdx, e.target.value)}
                          className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 focus:bg-white bg-gray-50 rounded"
                          placeholder="Value"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(rIdx)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 bg-gray-50">
              <button
                onClick={handleAddRow}
                className="text-xs font-medium text-fuchsia-600 hover:text-fuchsia-800 flex items-center gap-1"
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-800">BILL OF MATERIALS</span>
            <button
              onClick={handleAddBomItem}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-blue-200 rounded px-2 py-1 bg-blue-50"
            >
              + Add
            </button>
          </div>
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-secondary text-white">
                  <th className="p-2 border border-secondary uppercase text-xs font-bold w-16">SR. NO.</th>
                  <th className="p-2 border border-secondary uppercase text-xs font-bold">DESCRIPTION</th>
                  <th className="p-2 border border-secondary uppercase text-xs font-bold">UOM</th>
                  <th className="p-2 border border-secondary uppercase text-xs font-bold">QTY.</th>
                  <th className="p-2 border border-secondary uppercase text-xs font-bold">SIZE</th>
                  <th className="p-2 border border-secondary uppercase text-xs font-bold">MAKE</th>
                  <th className="p-2 border border-secondary w-10 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {bomItems.map((item, idx) => (
                  <tr key={idx} className="bg-white hover:bg-gray-50 border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200">
                      <input type="text" value={item.srNo} readOnly className="w-full text-sm px-2 py-1 outline-none bg-gray-50 rounded text-center" />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      {/* <input type="text" value={item.description} onChange={(e) => handleBomItemChange(idx, 'description', e.target.value)} className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded" placeholder="Description" /> */}
                      <HighlightableInput
                        value={item.description}
                        onChange={(val) => handleBomItemChange(idx, 'description', val)}
                        placeholder="Description"
                        className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      {/* <input type="text" value={item.uom} onChange={(e) => handleBomItemChange(idx, 'uom', e.target.value)} className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded" placeholder="UOM" /> */}
                      <HighlightableInput
                        value={item.uom}
                        onChange={(val) => handleBomItemChange(idx, 'uom', val)}
                        placeholder="UOM"
                        className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      {/* <input type="text" value={item.qty} onChange={(e) => handleBomItemChange(idx, 'qty', e.target.value)} className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded" placeholder="Qty" /> */}
                      <HighlightableInput
                        value={item.qty}
                        onChange={(val) => handleBomItemChange(idx, 'qty', val)}
                        placeholder="Qty"
                        className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      {/* <input type="text" value={item.size} onChange={(e) => handleBomItemChange(idx, 'size', e.target.value)} className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded" placeholder="Size" /> */}
                      <HighlightableInput
                        value={item.size}
                        onChange={(val) => handleBomItemChange(idx, 'size', val)}
                        placeholder="Size"
                        className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded"
                      />
                    </td>
                    <td className="p-1 border-r border-gray-200">
                      {/* <input type="text" value={item.make} onChange={(e) => handleBomItemChange(idx, 'make', e.target.value)} className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded" placeholder="Make" /> */}
                      <HighlightableInput
                        value={item.make}
                        onChange={(val) => handleBomItemChange(idx, 'make', val)}
                        placeholder="Make"
                        className="w-full text-sm px-2 py-1 outline-none border border-transparent focus:border-gray-300 bg-gray-50 rounded"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button type="button" onClick={() => handleRemoveBomItem(idx)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {bomItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-3 text-center text-gray-400 text-xs">No items added</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Dialog>
  );
}
