import React, { useEffect, useMemo, useState, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";
// import { useFormPermissions } from '../../../hooks/useFormPermissions';

const FCompCode = "001";

// --- Inline SVG icons ---
const Icon = {
  Plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
    </svg>
  ),
  Edit: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  ),
  Trash: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="currentColor" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  ),
  Search: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="currentColor" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
    </svg>
  ),
  Close: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="currentColor" d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.29 9.18 12 2.88 5.71 4.29 4.29 10.59 10.59 16.88 4.29z" />
    </svg>
  ),
  Folder: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="currentColor" d="M10 4H4a2 2 0 00-2 2v2h20V8a2 2 0 00-2-2h-8l-2-2zM2 10v8a2 2 0 002 2h16a2 2 0 002-2v-8H2z" />
    </svg>
  ),
  File: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="currentColor" d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7zM13 3.5L18.5 9H13V3.5z" />
    </svg>
  ),
  Chevron: ({ down = false, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false" style={{ transform: down ? "rotate(90deg)" : "none" }}>
      <path fill="currentColor" d="M9 6l6 6-6 6" />
    </svg>
  ),
};

// --- Tree node component ---
function TreeNode({ node, level = 0, onSelect, expandedKeys, toggleExpand, selectedKey }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.key);
  const isSelected = selectedKey === node.key;

  return (
    <div className="tree-node" style={{ paddingLeft: `${12 + level * 16}px` }}>
      <div
        className={`tree-row ${isSelected ? "selected" : ""}`}
        onClick={() => onSelect(node)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect(node)}
      >
        {hasChildren ? (
          <button
            className="chev"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.key);
            }}
            aria-label={isExpanded ? "Collapse group" : "Expand group"}
          >
            <span className={`chev-rot ${isExpanded ? "open" : ""}`}><Icon.Chevron /></span>
          </button>
        ) : (
          <span className="chev-placeholder" />
        )}

        <span className="node-icon" aria-hidden>
          {hasChildren ? <Icon.Folder /> : <Icon.File />}
        </span>

        <span className="node-text" title={node.displayName}>
          {node.displayName}
        </span>
      </div>

      {hasChildren && (
        <div
          className={`node-children ${isExpanded ? "show" : ""}`}
          style={{
            height: isExpanded ? "auto" : 0,
            overflow: isExpanded ? "visible" : "hidden",
            transition: "all 220ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {isExpanded &&
            node.children.map((child) => (
              <TreeNode
                key={child.key}
                node={child}
                level={level + 1}
                onSelect={onSelect}
                expandedKeys={expandedKeys}
                toggleExpand={toggleExpand}
                selectedKey={selectedKey}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function LedgerCreation({ onCreated }) {
  // State management
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTreeOpen, setIsTreeOpen] = useState(true);
  const [mainGroup, setMainGroup] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [actionType, setActionType] = useState('create');
  const [searchTree, setSearchTree] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [isActive, setIsActive] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [message, setMessage] = useState(null);
  const [lastNetworkError, setLastNetworkError] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);

  // Form data state
  const [formData, setFormData] = useState({
    shortName: '',
    counter: '',
    partyName: '',
    dueDay: '',
    dueDate: '',
    fStreet: '',
    hallmark: '',
    area: '',
    gstin: '',
    city: '',
    pincode: '',
    phone: '',
    email: '',
    Hide: '1',
    fCode: '',
  });

  // Refs for form inputs
  const partyNameRef = useRef(null);
  const dueDayRef = useRef(null);
  const fStreetRef = useRef(null);
  const areaRef = useRef(null);
  const cityRef = useRef(null);
  const pincodeRef = useRef(null);
  const phoneRef = useRef(null);
  const hallmarkRef = useRef(null);
  const gstinRef = useRef(null);
  const shortNameRef = useRef(null);
  const emailRef = useRef(null);

  // Get permissions for this form (fallback when hook isn't available)
  const formPermissions = useMemo(() => ({ add: true, edit: true, delete: true }), []);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    setLastNetworkError(null);
    try {
      await fetchTreeData();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load data. Check console." });
    } finally {
      setLoading(false);
    }
  };

  const fetchTreeData = async () => {
    try {
      const path = API_ENDPOINTS.LEDGER_CREATION_ENDPOINTS.getTree;
      const fullUrl = (axiosInstance.defaults && axiosInstance.defaults.baseURL ? axiosInstance.defaults.baseURL : '') + path;
      console.log('Fetching tree from', fullUrl);
      setLastNetworkError(null);
      const response = await axiosInstance.get(path);
      if (!response.data) throw new Error('Invalid tree data format');
      
      const transformedData = transformApiData(response.data);
      setTreeData(transformedData);
      setExpandedKeys(new Set(transformedData.map(item => item.key)));
    } catch (error) {
      console.error('Tree data fetch error:', error);
      // Store network error details for debugging in UI
      const errInfo = {
        message: error.message,
        code: error.code || (error?.response?.status ? String(error.response.status) : null),
        url: (axiosInstance.defaults && axiosInstance.defaults.baseURL ? axiosInstance.defaults.baseURL : '') + API_ENDPOINTS.LEDGER_CREATION_ENDPOINTS.getTree,
        details: error.toString(),
      };
      setLastNetworkError(errInfo);
      setMessage({ type: "error", text: 'Failed to fetch tree data. See details below.' });
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setLastNetworkError(null);
    try {
      const path = API_ENDPOINTS.LEDGER_GROUP_CREATION_ENDPOINTS.getTree;
      const base = axiosInstance.defaults && axiosInstance.defaults.baseURL ? axiosInstance.defaults.baseURL : '';
      const fullUrl = base + path;
      console.log('Testing connection to', fullUrl);
      const resp = await axiosInstance.get(path);
      console.log('Connection test response', resp && resp.status);
      setMessage({ type: 'success', text: `Connection OK (status ${resp.status})` });
      setLastNetworkError(null);
    } catch (err) {
      console.error('Connection test error', err);
      const errInfo = {
        message: err.message,
        code: err.code || (err?.response?.status ? String(err.response.status) : null),
        url: (axiosInstance.defaults && axiosInstance.defaults.baseURL ? axiosInstance.defaults.baseURL : '') + API_ENDPOINTS.LEDGER_GROUP_CREATION_ENDPOINTS.getTree,
        details: err.toString(),
      };
      setLastNetworkError(errInfo);
      setMessage({ type: 'error', text: 'Connection test failed. See details below.' });
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (apiData) => {
    if (!Array.isArray(apiData)) return [];
    
    let nodeCounter = 0;
    
    const buildTree = (items, level = 0, parentPath = '') => {
      return items.map((item, index) => {
        nodeCounter++;
        const uniqueKey = `${parentPath}-${item.fcode || 'no-code'}-${nodeCounter}-${level}-${index}`;
        
        return {
          key: uniqueKey,
          displayName: item.fAcname || 'Unnamed Group',
          level,
          id: item.fcode,
          children: item.children ? buildTree(item.children, level + 1, uniqueKey) : [],
        };
      });
    };
    
    return buildTree(apiData);
  };

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const s = new Set(prev);
      if (s.has(key)) s.delete(key);
      else s.add(key);
      return s;
    });
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
    setMainGroup(node.displayName);
    setIsTreeOpen(true);
  };

  const handleChange = (name, value) => {
    if (name === 'dueDay') {
      const dueDays = parseInt(value, 10);

      if (!isNaN(dueDays)) {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + dueDays);
        const formattedDate = `${String(futureDate.getDate()).padStart(2, '0')}/${String(futureDate.getMonth() + 1).padStart(2, '0')}/${futureDate.getFullYear()}`;

        setFormData(prev => ({
          ...prev,
          dueDay: value,
          dueDate: formattedDate,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          dueDay: value,
          dueDate: '',
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleActive = () => {
    const newValue = !isActive;
    setIsActive(newValue);
    handleChange('Hide', newValue ? '1' : '0');
  };

  const validateForm = () => {
    if (!formData.partyName) {
      setMessage({ type: "error", text: 'Ledger Name is required.' });
      partyNameRef.current?.focus();
      return false;
    }
    if (!mainGroup) {
      setMessage({ type: "error", text: 'Group Name is required.' });
      return false;
    }

    if (formData.dueDay && isNaN(formData.dueDay)) {
      setMessage({ type: "error", text: 'Due Days must be a number.' });
      dueDayRef.current?.focus();
      return false;
    }

    if (formData.pincode && (isNaN(formData.pincode) || formData.pincode.length !== 6)) {
      setMessage({ type: "error", text: 'Pincode must be a 6-digit number.' });
      pincodeRef.current?.focus();
      return false;
    }

    if (formData.phone && (isNaN(formData.phone) || formData.phone.length !== 10)) {
      setMessage({ type: "error", text: 'Phone must be a 10-digit number.' });
      phoneRef.current?.focus();
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage({ type: "error", text: 'Invalid Email format.' });
      emailRef.current?.focus();
      return false;
    }

    return true;
  };

  const showConfirmation = (message, onConfirm) => {
    if (window.confirm(message)) {
      onConfirm();
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Check permissions based on action type
    if (actionType === 'create' && !formPermissions.add) {
      setMessage({ type: "error", text: "You don't have permission to create ledgers." });
      return;
    }
    if (actionType === 'edit' && !formPermissions.edit) {
      setMessage({ type: "error", text: "You don't have permission to edit ledgers." });
      return;
    }
    if (actionType === 'delete' && !formPermissions.delete) {
      setMessage({ type: "error", text: "You don't have permission to delete ledgers." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      if (actionType === 'create') {
        try {
          const response = await axiosInstance.get(`${API_ENDPOINTS.LEDGER_CREATION_ENDPOINTS.getDropdown}/1/1`);
          const existingLedgers = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          const isDuplicate = existingLedgers.some(ledger => 
            ledger.fAcname.toLowerCase() === formData.partyName.toLowerCase()
          );
          if (isDuplicate) {
            setMessage({ type: "error", text: 'A ledger with this name already exists. Please choose a different name.' });
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          console.error('Error checking for duplicates:', error);
          setMessage({ type: "error", text: 'Failed to verify ledger uniqueness. Please try again.' });
          setIsSubmitting(false);
          return;
        }
      }

      const requestData = {
        fcode: formData.fCode || '',
        CustomerName: formData.partyName || '',
        GroupName: mainGroup || '',
        duedays: formData.dueDay || '',
        dueDate: formData.dueDate || '',
        street: formData.fStreet || '',
        area: formData.area || '',
        city: formData.city || '',
        pincode: formData.pincode ? Number(formData.pincode) : null,
        phoneNumber: formData.phone || '',
        HallmarkNo: formData.hallmark || '',
        GstNo: formData.gstin || '',
        ShortName: formData.shortName || '',
        Email: formData.email || '',
        Hide: formData.Hide || '',
        fCompCode: FCompCode || '',
      };

      console.log('Submitted Request Data:', requestData);

      let response;
      switch (actionType) {
        case 'create':
          response = await axiosInstance.post(API_ENDPOINTS.LEDGER_CREATION_ENDPOINTS.postCreate, requestData);
          setMessage({ type: "success", text: 'Data saved successfully!' });
          if (onCreated) {
            onCreated({
              name: requestData.CustomerName,
              code: requestData.fcode,
            });
          }
          break;
        case 'edit':
          response = await axiosInstance.put(API_ENDPOINTS.LEDGER_CREATION_ENDPOINTS.putEdit, requestData);
          setMessage({ type: "success", text: 'Data updated successfully!' });
          break;
        case 'delete':
          if (!formData.fCode) {
            setMessage({ type: "error", text: 'fCode is required for deletion' });
            return;
          }
          response = await axiosInstance.delete(API_ENDPOINTS.LEDGER_CREATION_ENDPOINTS.delete(formData.fCode));
          setMessage({ type: "success", text: 'Data deleted successfully!' });
          break;
        default:
          setMessage({ type: "error", text: 'Invalid action type' });
          return;
      }

      if (response.status === 200 || response.status === 201) {
        handleClear();
        await fetchTreeData();
      } else {
        setMessage({ type: "error", text: 'Failed to process request' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'An unexpected server error occurred.';

        if (status === 409) {
          setMessage({ type: "error", text: 'Concurrent modification detected. Please refresh and try again.' });
        } else {
          setMessage({ type: "error", text: `Error ${status}: ${message}` });
        }
      } else if (error.request) {
        setMessage({ type: "error", text: 'No response received from the server. Please check your network connection.' });
      } else {
        setMessage({ type: "error", text: `Error: ${error.message}. Please check your connection and try again.` });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchData = async (searchText = '') => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_ENDPOINTS.LEDGER_CREATION_ENDPOINTS.getDropdownPaged(1, 20, searchText),
      );

      let responseData = response.data;
      if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
        responseData = responseData.data || responseData.result || [];
      }

      const dataArray = Array.isArray(responseData) ? responseData : [];
      setDataList(dataArray);
      setModalVisible(true);
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage({ type: "error", text: 'Failed to fetch data' });
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (keepAction = false) => {
    setMainGroup('');
    setSelectedNode(null);
    setFormData({
      shortName: '',
      counter: '',
      partyName: '',
      dueDay: '',
      dueDate: '',
      fStreet: '',
      hallmark: '',
      area: '',
      gstin: '',
      city: '',
      pincode: '',
      phone: '',
      email: '',
      Hide: '1',
      fCode: '',
    });
    setIsActive(true);
    setMessage(null);
    setSearchTree('');
    if (!keepAction) setActionType('create');
  };

  const changeActionType = (type) => {
    setActionType(type);
    if (type === 'create') {
      resetForm(true);
    }
    setIsTreeOpen(true);
    
    if (type === 'edit' || type === 'delete') {
      fetchData();
    }
  };

  const handleClear = () => {
    resetForm(false);
  };

  const filteredTree = useMemo(() => {
    if (!searchTree) return treeData;
    const q = searchTree.trim().toLowerCase();
    const filter = (nodes) => {
      const out = [];
      for (const n of nodes) {
        const matched = n.displayName.toLowerCase().includes(q);
        const children = filter(n.children || []);
        if (matched || children.length > 0) out.push({ ...n, children });
      }
      return out;
    };
    return filter(treeData);
  }, [treeData, searchTree]);

  return (
    <div className="lg-root" role="region" aria-labelledby="ledger-title">
      {/* Google/Local font — will fallback to system fonts if blocked */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@500;700&display=swap" rel="stylesheet" />

      <style>{`
        :root{
          /* blue theme (user-provided) */
          --bg-1: #f0f7fb;
          --bg-2: #f7fbff;
          --glass: rgba(255,255,255,0.55);
          --glass-2: rgba(255,255,255,0.35);
          --accent: #307AC8; /* primary */
          --accent-2: #1B91DA; /* secondary */
          --accent-3: #06A7EA; /* tertiary */
          --success: #06A7EA;
          --danger: #ef4444;
          --muted: #64748b;
          --card-shadow: 0 8px 30px rgba(16,24,40,0.08);
          --glass-border: rgba(255,255,255,0.45);
        }

        /* Page layout */
        .lg-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          background: linear-gradient(180deg, var(--bg-1), var(--bg-2));
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          box-sizing: border-box;
        }

        /* Main dashboard card (glass) */
        .dashboard {
          width: 100%;
          max-width: 1100px;
          border-radius: 16px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(255,255,255,0.75), rgba(245,248,255,0.65));
          box-shadow: var(--card-shadow);
          backdrop-filter: blur(8px) saturate(120%);
          border: 1px solid rgba(255,255,255,0.6);
          overflow: visible;
          transition: transform 260ms cubic-bezier(.2,.8,.2,1);
        }
        .dashboard:hover { transform: translateY(-6px); }

        /* header */
        .top-row {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .title-block {
          display:flex;
          align-items: center;
          gap:12px;
        }
        .title-block h2 {
          margin:0;
          font-family: "Poppins", "Inter", sans-serif;
          font-size: 20px;
          color: #0f172a;
          letter-spacing: -0.2px;
        }
        .subtitle {
          color: var(--muted);
          font-size: 13px;
        }

        /* action pills */
        .actions {
          display:flex;
          gap:10px;
          align-items:center;
          flex-wrap:wrap;
        }
        .action-pill {
          display:inline-flex;
          gap:8px;
          align-items:center;
          padding:10px 12px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.8), rgba(250,250,252,0.9));
          border: 1px solid var(--glass-border);
          cursor:pointer;
          box-shadow: 0 6px 16px rgba(2,6,23,0.04);
          font-weight: 600;
          font-size: 13px;
        }
        .action-pill.primary { color:white; background: linear-gradient(180deg, var(--accent), var(--accent-2)); }
        .action-pill.warn { color:white; background: linear-gradient(180deg,#f59e0b,#f97316); }
        .action-pill.danger { color:white; background: linear-gradient(180deg,var(--danger),#f97373); }

        /* grid layout */
        .grid {
          display:grid;
          grid-template-columns: 1fr 360px;
          gap:18px;
          align-items:start;
        }

        /* left card (form) */
        .card {
          background: rgba(255,255,255,0.85);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(15,23,42,0.04);
          box-shadow: 0 6px 20px rgba(12,18,35,0.06);
        }

        label.field-label {
          display:block;
          margin-bottom:6px;
          font-weight:700;
          color:#0f172a;
          font-size:13px;
          text-align: left;
          width: 100%;
        }

        .field {
          margin-bottom:12px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .row { 
          display:flex; 
          gap:8px; 
          align-items:center; 
          width:100%;
          flex-wrap: wrap;
        }
        .input, .search {
          flex:1;
          min-width: 0;
          padding:10px 12px;
          border-radius:10px;
          border: 1px solid rgba(15,23,42,0.06);
          background: linear-gradient(180deg, #fff, #fbfdff);
          font-size:14px;
          color:#0f172a;
          box-sizing:border-box;
          transition: box-shadow 160ms ease, transform 120ms ease, border-color 120ms ease;
        }
  .input:focus, .search:focus { outline:none; box-shadow: 0 8px 26px rgba(48,122,200,0.08); transform: translateY(-1px); border-color: rgba(48,122,200,0.25); }

        .btn {
          padding:10px 12px;
          border-radius:10px;
          border:1px solid rgba(12,18,35,0.06);
          background: linear-gradient(180deg,#fff,#f8fafc);
          cursor:pointer;
          min-width:86px;
          font-weight:600;
          white-space: nowrap;
        }

        .controls { display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; }

        /* tree panel */
        .panel {
          margin-top:8px;
          border-radius:10px;
          background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(250,251,255,0.6));
          border: 1px solid rgba(12,18,35,0.04);
          padding:10px;
        }
        .tree-scroll { max-height:260px; overflow:auto; padding-right:6px; }

        .tree-row {
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px;
          border-radius:10px;
          cursor:pointer;
          transition: background 160ms ease, transform 120ms ease, box-shadow 180ms ease;
        }
  .tree-row:hover { background: linear-gradient(90deg, rgba(48,122,200,0.06), rgba(48,122,200,0.02)); transform: translateX(6px); }
  .tree-row.selected { background: linear-gradient(90deg, rgba(15,23,42,0.03), rgba(15,23,42,0.01)); box-shadow: inset 0 0 0 1px rgba(48,122,200,0.06); }

        .chev, .chev-placeholder {
          background:transparent;
          border:none;
          width:26px;
          height:26px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          font-size:14px;
        }
        .chev-rot { display:inline-block; transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
        .chev-rot.open { transform: rotate(90deg); }

        .node-icon { width:22px; display:inline-flex; align-items:center; justify-content:center; color:var(--accent); }
        .node-text { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600; color:#0f172a; }

        /* right card (preview / summary) */
        .side {
          display:flex;
          flex-direction:column;
          gap:12px;
        }
        .stat {
          background: linear-gradient(180deg, rgba(255,255,255,0.7), rgba(250,251,255,0.7));
          border-radius: 12px;
          padding:12px;
          border: 1px solid rgba(12,18,35,0.04);
        }
        .muted { color: var(--muted); font-size:13px; margin-left:-7px; }

        /* message */
        .message {
          margin-top:8px;
          padding:12px;
          border-radius:10px;
          font-weight:600;
        }
        .message.error { background: #fff1f2; color: #9f1239; border: 1px solid #ffd7da; }
        .message.success { background: #f0fdf4; color: #064e3b; border: 1px solid #bbf7d0; }

        /* submit row */
        .submit-row { 
          display:flex; 
          gap:12px; 
          margin-top:14px; 
          align-items:center; 
          flex-wrap:wrap; 
        }
        .submit-primary {
          padding:12px 16px;
          background: linear-gradient(180deg,var(--accent),var(--accent-2));
          color:white;
          border-radius:10px;
          border:none;
          font-weight:700;
          cursor:pointer;
          min-width: 120px;
        }
        .submit-clear {
          padding:10px 12px;
          background:#fff;
          border:1px solid rgba(12,18,35,0.06);
          border-radius:10px;
          cursor:pointer;
        }
        
        .search-container {
          position: relative;
          width: 100%;
        }

        .search-with-clear {
          width: 100%;
          padding: 8px 1px 10px 5px;  
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }
        /* Limit search input width inside panels and modals */
        .panel .search-with-clear,
        .modal .search-with-clear {
          max-width: 420px;
          width: 100%;
        }

        .search-with-clear:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .clear-search-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6b7280;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clear-search-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        /* dropdown modal (glass) */
        .modal-overlay {
          position:fixed; 
          inset:0; 
          display:flex; 
          align-items:center; 
          justify-content:center; 
          background: rgba(2,6,23,0.46); 
          z-index:1200; 
          padding:20px;
        }
        .modal {
          width:100%; 
          max-width:720px; 
          max-height:80vh; 
          overflow:auto; 
          background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(245,248,255,0.8));
          border-radius:12px; 
          padding:14px;
          border:1px solid rgba(255,255,255,0.5);
          box-shadow: 0 18px 50px rgba(2,6,23,0.36);
          backdrop-filter: blur(8px);
        }
        .dropdown-list { max-height:50vh; overflow:auto; border-top:1px solid rgba(12,18,35,0.03); border-bottom:1px solid rgba(12,18,35,0.03); padding:6px 0; }
        .dropdown-item { padding:12px; border-bottom:1px solid rgba(12,18,35,0.03); cursor:pointer; display:flex; flex-direction:column; gap:4px; }
        .dropdown-item:hover { background: linear-gradient(90deg, rgba(48,122,200,0.04), rgba(48,122,200,0.01)); transform: translateX(6px); }

        /* form grid */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .full-width {
          grid-column: 1 / -1;
        }

        /* switch styles */
        .switch-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.6);
          border-radius: 8px;
          border: 1px solid rgba(15,23,42,0.04);
          
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 80px;
          height: 22px;
          margin-left: -50px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--accent);
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        /* Responsive styles */
        /* Large tablets and small laptops */
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .side {
            order: 2;
          }
          .card {
            order: 1;
          }
        }

        /* Tablets */
        @media (max-width: 768px) {
          .lg-root {
            padding: 16px 12px;
          }
          .dashboard {
            padding: 16px;
          }
          .top-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .actions {
            width: 100%;
            justify-content: space-between;
          }
          .action-pill {
            flex: 1;
            justify-content: center;
            min-width: 0;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Mobile phones */
        @media (max-width: 480px) {
          .lg-root {
            padding: 12px 8px;
          }
          .dashboard {
            padding: 12px;
            border-radius: 12px;
          }
          .title-block h2 {
            font-size: 18px;
          }
          .action-pill {
            padding: 8px 10px;
            font-size: 12px;
          }
          .card {
            padding: 12px;
          }
          .input, .search {
            padding: 8px 10px;
            font-size: 13px;
          }
          .btn {
            padding: 8px 10px;
            min-width: 70px;
            font-size: 13px;
          }
          .submit-primary {
            padding: 10px 14px;
            min-width: 100px;
          }
          .tree-row {
            padding: 8px;
          }
          .stat {
            padding: 10px;
          }
        }

        /* Very small screens */
        @media (max-width: 360px) {
          .actions {
                flex-direction: column;
                width: 100%;
              }
          .action-pill {
            width: 100%;
          }
          .controls {
            flex-direction: column;
          }
          .submit-row {
            flex-direction: column;
            align-items: stretch;
          }
          .submit-primary, .submit-clear {
            width: 100%;
            text-align: center;
          }
        }

        /* Print styles */
        @media print {
          .lg-root {
            background: white;
            padding: 0;
          }
          .dashboard {
            box-shadow: none;
            border: 1px solid #ccc;
          }
          .actions, .submit-row {
            display: none;
          }
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          :root {
            --accent: #0000ff;
            --accent-2: #0000aa;
            --bg-1: #ffffff;
            --bg-2: #f0f0f0;
          }
          .dashboard {
            border: 2px solid #000;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          :root {
            --bg-1: #0f172a;
            --bg-2: #1e293b;
            --glass: rgba(30, 41, 59, 0.8);
            --glass-2: rgba(30, 41, 59, 0.6);
            --accent: #3b82f6;
            --accent-2: #60a5fa;
            --muted: #94a3b8;
            --card-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            --glass-border: rgba(255, 255, 255, 0.1);
          }
          .dashboard {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.8));
            color: #f1f5f9;
          }
          .card {
            background: rgba(30, 41, 59, 0.7);
            color: #f1f5f9;
          }
          .input, .search {
            background: rgba(15, 23, 42, 0.6);
            border-color: rgba(255, 255, 255, 0.1);
            color: #f1f5f9;
          }
          .input:focus, .search:focus {
            border-color: var(--accent);
          }
          .tree-row {
            color: #f1f5f9;
          }
          .node-text {
            color: #f1f5f9;
          }
          .stat {
            background: rgba(30, 41, 59, 0.7);
            color: #f1f5f9;
          }
        }
      `}</style>

      <div className="dashboard">
        <div className="top-row">
          <div className="title-block">
            <h2 id="ledger-title">Ledger Creation</h2>
            <span className="subtitle">Create and manage ledger accounts</span>
          </div>
          <div className="actions">
            <div
              className={`action-pill ${actionType === 'create' ? 'primary' : ''} ${!formPermissions.add ? 'disabled' : ''}`}
              onClick={() => formPermissions.add && changeActionType('create')}
              onKeyDown={(e) => e.key === 'Enter' && formPermissions.add && changeActionType('create')}
              role="button"
              tabIndex={formPermissions.add ? 0 : -1}
              title={!formPermissions.add ? "You don't have permission to create" : "Create new ledger"}
              style={!formPermissions.add ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Icon.Plus size={14} />
              Create
            </div>
            <div
              className={`action-pill ${actionType === 'edit' ? 'warn' : ''} ${!formPermissions.edit ? 'disabled' : ''}`}
              onClick={() => formPermissions.edit && changeActionType('edit')}
              onKeyDown={(e) => e.key === 'Enter' && formPermissions.edit && changeActionType('edit')}
              role="button"
              tabIndex={formPermissions.edit ? 0 : -1}
              title={!formPermissions.edit ? "You don't have permission to edit" : "Edit existing ledger"}
              style={!formPermissions.edit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Icon.Edit size={14} />
              Edit
            </div>
            <div
              className={`action-pill ${actionType === 'delete' ? 'danger' : ''} ${!formPermissions.delete ? 'disabled' : ''}`}
              onClick={() => formPermissions.delete && changeActionType('delete')}
              onKeyDown={(e) => e.key === 'Enter' && formPermissions.delete && changeActionType('delete')}
              role="button"
              tabIndex={formPermissions.delete ? 0 : -1}
              title={!formPermissions.delete ? "You don't have permission to delete" : "Delete ledger"}
              style={!formPermissions.delete ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <Icon.Trash size={14} />
              Delete
            </div>
            {/* <button
              className="btn"
              onClick={testConnection}
              type="button"
              title="Test API connectivity"
              style={{ marginLeft: 6 }}
            >
              Test API
            </button> */}
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="field">
              <label className="field-label">Ledger Name *</label>
              <input
                ref={partyNameRef}
                type="text"
                className="input"
                placeholder="Enter ledger name"
                value={formData.partyName}
                onChange={(e) => handleChange('partyName', e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="field-label">Group Name *</label>
              <div className="row">
                <input
                  type="text"
                  className="input"
                  placeholder="Select group"
                  value={mainGroup}
                  // Group is selected via tree or modal; keep this readOnly and remove incorrect onChange
                  readOnly
                />
                <button
                  className="btn"
                  onClick={() => setIsTreeOpen(!isTreeOpen)}
                  type="button"
                >
                  {isTreeOpen ? 'Hide' : 'Show'} Tree
                </button>
              </div>
            </div>

            {isTreeOpen && (
              <div className="panel">
                <div className="search-container">
                  <input
                    type="text"
                    className="search-with-clear"
                    placeholder="Search groups..."
                    value={searchTree}
                    onChange={(e) => setSearchTree(e.target.value)}
                  />
                  {searchTree && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setSearchTree('')}
                      aria-label="Clear search"
                    >
                      <Icon.Close size={14} />
                    </button>
                  )}
                </div>
                <div className="tree-scroll">
                  {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                      Loading tree...
                    </div>
                  ) : filteredTree.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                      No groups found
                    </div>
                  ) : (
                    filteredTree.map((node) => (
                      <TreeNode
                        key={node.key}
                        node={node}
                        onSelect={handleSelectNode}
                        expandedKeys={expandedKeys}
                        toggleExpand={toggleExpand}
                        selectedKey={selectedNode?.key}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="form-grid">
              <div className="field">
                <label className="field-label">Short Name</label>
                <input
                  ref={shortNameRef}
                  type="text"
                  className="input"
                  placeholder="Short name"
                  value={formData.shortName}
                  onChange={(e) => handleChange('shortName', e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Due Days</label>
                <input
                  ref={dueDayRef}
                  type="text"
                  className="input"
                  placeholder="Due days"
                  value={formData.dueDay}
                  onChange={(e) => handleChange('dueDay', e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Due Date</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Due date"
                  value={formData.dueDate}
                  readOnly
                />
              </div>

              <div className="field">
                <label className="field-label">Hallmark No.</label>
                <input
                  ref={hallmarkRef}
                  type="text"
                  className="input"
                  placeholder="Hallmark number"
                  value={formData.hallmark}
                  onChange={(e) => handleChange('hallmark', e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Street Address</label>
                <input
                  ref={fStreetRef}
                  type="text"
                  className="input"
                  placeholder="Street address"
                  value={formData.fStreet}
                  onChange={(e) => handleChange('fStreet', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">GSTIN</label>
                <input
                  ref={gstinRef}
                  type="text"
                  className="input"
                  placeholder="GSTIN"
                  value={formData.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Area</label>
                <input
                  ref={areaRef}
                  type="text"
                  className="input"
                  placeholder="Area"
                  value={formData.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">City</label>
                <input
                  ref={cityRef}
                  type="text"
                  className="input"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Pincode</label>
                <input
                  ref={pincodeRef}
                  type="text"
                  className="input"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  maxLength={6}
                />
              </div>

              <div className="field">
                <label className="field-label">Phone</label>
                <input
                  ref={phoneRef}
                  type="text"
                  className="input"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  maxLength={10}
                />
              </div>

              <div className="field" style={{ gridColumn: '1 / 2' }}>
                <label className="field-label">Email</label>
                <input
                  ref={emailRef}
                  type="email"
                  className="input"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>

              <div className="field" style={{ gridColumn: '2 / 3', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <div className="switch-container" style={{ margin: 0 }}>
                  <label className="field-label" style={{ margin: 0, marginRight: 12 }}>Active Status</label>
                  <label className="switch" style={{ marginRight: 12 }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={toggleActive}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="muted">{isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              
            </div>

            

            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            {lastNetworkError && (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: '#fff7f7', color: '#9f1239', fontSize: 13 }}>
                <strong>Network Error Details</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(lastNetworkError, null, 2)}</pre>
              </div>
            )}

            <div className="submit-row">
              <button
                className="submit-primary"
                onClick={() => {
                  if (actionType === 'delete') {
                    showConfirmation('Are you sure you want to delete this ledger?', handleSubmit);
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 
                 actionType === 'create' ? 'Create Ledger' :
                 actionType === 'edit' ? 'Update Ledger' : 'Delete Ledger'}
              </button>
              <button
                className="submit-clear"
                onClick={handleClear}
                disabled={isSubmitting}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="side">
            <div className="card stat">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Summary</h3>
              <div className="muted">Ledger Name: {formData.partyName || 'Not set'}</div>
              <div className="muted">Group: {mainGroup || 'Not selected'}</div>
              <div className="muted">Status: {isActive ? 'Active' : 'Inactive'}</div>
              {formData.dueDay && <div className="muted">Due Days: {formData.dueDay}</div>}
              {formData.dueDate && <div className="muted">Due Date: {formData.dueDate}</div>}
            </div>

            <div className="card stat">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Contact Info</h3>
              {formData.phone && <div className="muted">Phone: {formData.phone}</div>}
              {formData.email && <div className="muted">Email: {formData.email}</div>}
              {formData.fStreet && <div className="muted">Address: {formData.fStreet}</div>}
              {(formData.area || formData.city) && (
                <div className="muted">Location: {[formData.area, formData.city].filter(Boolean).join(', ')}</div>
              )}
              {formData.pincode && <div className="muted">Pincode: {formData.pincode}</div>}
            </div>

            <div className="card stat">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Tax & Identification</h3>
              {formData.gstin && <div className="muted">GSTIN: {formData.gstin}</div>}
              {formData.hallmark && <div className="muted">Hallmark: {formData.hallmark}</div>}
              {formData.shortName && <div className="muted">Short Name: {formData.shortName}</div>}
            </div>
          </div>
        </div>
      </div>

      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Select Ledger</h3>
              <button
                onClick={() => setModalVisible(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                aria-label="Close"
              >
                <Icon.Close size={20} />
              </button>
            </div>
            <div className="dropdown-list">
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
              ) : dataList.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>No data found</div>
              ) : (
                dataList.map((item, index) => (
                  <div
                    key={index}
                    className="dropdown-item"
                    onClick={() => {
                      // backend can return group name as fParent or GroupName; prefer fParent
                      const groupValue = item.fParent || item.GroupName || item.Group || '';
                      setFormData({
                        partyName: item.fAcname || item.fAcName || '',
                        // keep a copy in formData in case other code expects it
                        groupName: groupValue,
                        dueDay: item.fDueDays || item.fDueDay || '',
                        dueDate: item.fDueDt || item.fDueDate || '',
                        fStreet: item.fStreet || '',
                        hallmark: item.fTngst || '',
                        area: item.fArea || '',
                        gstin: item.fCstno || item.fGst || '',
                        city: item.fCity || '',
                        pincode: item.fPincode || '',
                        phone: item.fPhone || '',
                        email: item.fMail || item.fEmail || '',
                        Hide: item.Hide || '1',
                        fCode: item.fCode || item.fcode || '',
                        shortName: item.fFax || item.fShort || '',
                      });
                      setMainGroup(groupValue);
                      setIsActive(item.Hide !== '0');
                      setModalVisible(false);
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{item.fAcname || item.fAcName}</div>
                    {/* preview: try fParent then GroupName */}
                    {/* <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{(item.fParent || item.GroupName || '') + ' • ' + (item.fcode || item.fCode || '')}</div> */}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}