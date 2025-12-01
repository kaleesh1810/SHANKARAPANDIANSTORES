import React, { useState, useEffect, useRef, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../api/endpoints';
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

const ItemCreation = ({ onCreated }) => {
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
  const [modalVisible, setModalVisible] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [counterList, setCounterList] = useState([]);
  const [filteredCounterList, setFilteredCounterList] = useState([]);
  const [counterSearch, setCounterSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);

  // Checkbox states
  const [gstChecked, setGstChecked] = useState(false);
  const [manualPrefixChecked, setManualPrefixChecked] = useState(false);
  const [pieceRateChecked, setPieceRateChecked] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    fitemCode: '',
    itemName: '',
    groupName: '',
    shortName: '',
    counter: '',
    prefix: '',
    hsnCode: '',
    gstin: '',
    pieceRate: 'N',
    gst: 'N',
    manualprefix: 'N'
  });

  // Refs for form inputs
  const itemNameRef = useRef(null);
  const shortNameRef = useRef(null);
  const counterRef = useRef(null);
  const prefixRef = useRef(null);
  const hsnCodeRef = useRef(null);
  const gstinRef = useRef(null);

  // Get permissions for this form.
  // The `useFormPermissions` hook may not be available in this workspace yet.
  // Use a safe permissive fallback to avoid runtime ReferenceError.
  const formPermissions = useMemo(() => ({ add: true, edit: true, delete: true }), []);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep track of viewport to adapt tree rendering for small screens
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadInitial = async () => {
    setLoading(true);
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
      const response = await axiosInstance.get(API_ENDPOINTS.ITEM_CREATION_ENDPOINTS.getTree);
      if (!response.data) throw new Error('Invalid tree data format');
      
      const transformedData = transformApiData(response.data);
      setTreeData(transformedData);
      setExpandedKeys(new Set(transformedData.map(item => item.key)));
    } catch (error) {
      console.error('Tree data fetch error:', error);
      setMessage({ type: "error", text: 'Failed to fetch tree data.' });
    }
  };

  const transformApiData = (apiData) => {
    if (!Array.isArray(apiData)) return [];
    
    const buildTree = (items, parentPath = "") =>
      items.map((item, idx) => {
        const key = `${parentPath}/${item.fitemcode || item.fitemCode || idx}`;
        return {
          key,
          displayName: item.fitemname || item.fitemName || "Unnamed",
          id: item.fitemcode || item.fitemCode || null,
          children: Array.isArray(item.children) ? buildTree(item.children, key) : [],
        };
      });
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Checkbox handlers
  const handleGstToggle = () => {
    const newValue = !gstChecked;
    setGstChecked(newValue);
    handleChange('gst', newValue ? 'Y' : 'N');
    if (!newValue) {
      handleChange('gstin', '');
    }
  };

  const handleManualPrefixToggle = () => {
    const newValue = !manualPrefixChecked;
    setManualPrefixChecked(newValue);
    handleChange('manualprefix', newValue ? 'Y' : 'N');
    if (newValue) {
      getMaxPrefixFromAPI();
    } else {
      handleChange('prefix', '');
    }
  };

  const handlePieceRateToggle = () => {
    const newValue = !pieceRateChecked;
    setPieceRateChecked(newValue);
    handleChange('pieceRate', newValue ? 'Y' : 'N');
  };

  const getMaxPrefixFromAPI = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ITEM_CREATION_ENDPOINTS.getMaxPrefix);
      if (response.status === 200 && response.data.prefix) {
        handleChange('prefix', response.data.prefix);
      }
    } catch (error) {
      console.error('Error fetching max prefix:', error);
      setMessage({ type: "error", text: 'Failed to fetch prefix. Please try again.' });
    }
  };

  // Validation function
  const validateForm = () => {
    if (!formData.itemName) {
      setMessage({ type: "error", text: 'Item Name is required.' });
      itemNameRef.current?.focus();
      return false;
    }
    if (!mainGroup) {
      setMessage({ type: "error", text: 'Group Name is required.' });
      return false;
    }

    // Validate GSTIN
    if (gstChecked && formData.gstin) {
      const allowedGSTValues = ['3', '5', '12', '18', '28'];
      if (!allowedGSTValues.includes(formData.gstin)) {
        setMessage({ type: "error", text: 'Only 3, 5, 12, 18, or 28 are allowed for GST%.' });
        gstinRef.current?.focus();
        return false;
      }
    }

    // Validate HSN Code (8 digits)
    if (formData.hsnCode && (isNaN(formData.hsnCode) || formData.hsnCode.length !== 8)) {
      setMessage({ type: "error", text: 'HSN Code must be an 8-digit number.' });
      hsnCodeRef.current?.focus();
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
      setMessage({ type: "error", text: "You don't have permission to create items." });
      return;
    }
    if (actionType === 'edit' && !formPermissions.edit) {
      setMessage({ type: "error", text: "You don't have permission to edit items." });
      return;
    }
    if (actionType === 'delete' && !formPermissions.delete) {
      setMessage({ type: "error", text: "You don't have permission to delete items." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      // For create operations, check for duplicates
      if (actionType === 'create') {
        try {
          const response = await axiosInstance.get(API_ENDPOINTS.ITEM_CREATION_ENDPOINTS.getDropdown);
          const existingItems = Array.isArray(response.data) ? response.data : [];
          const isDuplicate = existingItems.some(item => 
            item.fItemName?.toLowerCase() === formData.itemName.toLowerCase()
          );
          if (isDuplicate) {
            setMessage({ type: "error", text: 'An item with this name already exists. Please choose a different name.' });
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          console.error('Error checking for duplicates:', error);
          setMessage({ type: "error", text: 'Failed to verify item uniqueness. Please try again.' });
          setIsSubmitting(false);
          return;
        }
      }

      const requestData = {
        fitemCode: formData.fitemCode || '',
        fitemName: formData.itemName || '',
        groupName: mainGroup || '',
        shortName: formData.shortName || '',
        counter: formData.counter || '',
        prefix: formData.prefix || '',
        hsnCode: formData.hsnCode || '',
        gstNumber: formData.gstin || '', 
        pieceRate: formData.pieceRate || 'N',
        gst: formData.gst || 'N',
        manualprefix: formData.manualprefix || 'N',
        fCompCode: FCompCode || '',
      };

      console.log('Submitted Request Data:', requestData);

      let response;
      switch (actionType) {
        case 'create':
          response = await axiosInstance.post(API_ENDPOINTS.ITEM_CREATION_ENDPOINTS.postCreate, requestData);
          setMessage({ type: "success", text: 'Data saved successfully!' });
          if (onCreated) {
            onCreated({
              name: requestData.fitemName,
              code: requestData.fitemCode,
            });
          }
          break;
        case 'edit':
          response = await axiosInstance.put(API_ENDPOINTS.ITEM_CREATION_ENDPOINTS.putEdit, requestData);
          setMessage({ type: "success", text: 'Data updated successfully!' });
          break;
        case 'delete':
          if (!formData.fitemCode) {
            setMessage({ type: "error", text: 'fitemCode is required for deletion' });
            return;
          }
          response = await axiosInstance.delete(API_ENDPOINTS.ITEM_CREATION_ENDPOINTS.delete(formData.fitemCode));
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
        `${API_ENDPOINTS.ITEM_CREATION_ENDPOINTS.getDropdown}?searchText=${searchText}`,
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

  const fetchCounterList = async () => {
    try {
  // Use the top-level GET_COUNTER_LIST endpoint defined in src/api/endpoints.js
  const response = await axiosInstance.get(API_ENDPOINTS.GET_COUNTER_LIST);
      const counterData = Array.isArray(response.data) ? response.data : [];
      setCounterList(counterData);
      setFilteredCounterList(counterData);
      setCounterModalVisible(true);
    } catch (error) {
      console.error('Error fetching counter list:', error);
      setMessage({ type: "error", text: 'Failed to fetch counter list' });
    }
  };

  const filterCounterList = (searchText) => {
    const filtered = counterList.filter(item =>
      item.fbox?.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredCounterList(filtered);
  };

  const resetForm = (keepAction = false) => {
    setMainGroup('');
    setSelectedNode(null);
    setFormData({
      fitemCode: '',
      itemName: '',
      groupName: '',
      shortName: '',
      counter: '',
      prefix: '',
      hsnCode: '',
      gstin: '',
      pieceRate: 'N',
      gst: 'N',
      manualprefix: 'N'
    });
    setGstChecked(false);
    setManualPrefixChecked(false);
    setPieceRateChecked(false);
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
    <div className="lg-root" role="region" aria-labelledby="item-title">
      {/* Google/Local font — will fallback to system fonts if blocked */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@500;700&display=swap" rel="stylesheet" />

      <style>{`
        :root{
          /* custom blue theme (provided by user) */
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

        .field { margin-bottom:12px; display:flex; flex-direction:column; align-items:flex-start; }

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
          text-align: left;
        }
        .input:focus, .search:focus { outline:none; box-shadow: 0 8px 26px rgba(37,99,235,0.08); transform: translateY(-1px); border-color: rgba(37,99,235,0.25); }

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
        .tree-row:hover { background: linear-gradient(90deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02)); transform: translateX(6px); }
        .tree-row.selected { background: linear-gradient(90deg, rgba(15,23,42,0.03), rgba(15,23,42,0.01)); box-shadow: inset 0 0 0 1px rgba(16,163,98,0.06); }

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
        .muted { color: var(--muted); font-size:13px; }

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
          width: 80%;
        }

        .search-with-clear {
          width: 100%;
           padding: 12px 40px 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }
        /* Limit search width inside panels and modals to avoid overly long inputs */
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
        .dropdown-item:hover { background: linear-gradient(90deg, rgba(16,163,98,0.04), rgba(16,163,98,0.01)); transform: translateX(6px); }
        .dropdown-item, .node-text { text-align: left; }

        /* form grid */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
          align-items: start;
        }
        .full-width {
          grid-column: 1 / -1;
        }

        /* checkbox styles */
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .checkbox.checked {
          background: var(--accent);
          border-color: var(--accent);
        }
        .checkbox.checked::after {
          content: '✓';
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
        .checkbox-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
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
          .input, .search {
            padding: 8px 10px;
            font-size: 13px;
          }
          .btn {
            padding: 8px 10px;
            min-width: 70px;
            font-size: 13px;
          }
          .submit-primary, .submit-clear {
            flex: 1;
            min-width: 0;
          }
          .tree-row {
            padding: 8px;
          }
          .chev, .chev-placeholder {
            width: 22px;
            height: 22px;
          }
          .modal-overlay {
            padding: 12px;
          }
          .modal {
            padding: 12px;
          }
        }

        /* Very small screens */
        @media (max-width: 360px) {
          .lg-root {
            padding: 8px 6px;
          }
          .dashboard {
            padding: 10px;
          }
          .title-block {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .actions {
            gap: 6px;
          }
          .action-pill {
            padding: 6px 8px;
            font-size: 11px;
          }
          .card {
            padding: 12px;
          }
          .stat {
            padding: 10px;
          }
        }
      `}</style>

      <div className="dashboard" aria-labelledby="item-title">
        <div className="top-row">
          <div className="title-block">
            <svg width="38" height="38" viewBox="0 0 24 24" aria-hidden focusable="false">
              <rect width="24" height="24" rx="6" fill="#ecfdf5" />
              <path d="M6 12h12M6 8h12M6 16h12" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <h2 id="item-title">Item Creation</h2>
              <div className="subtitle muted">Create, edit, or delete items — organized & fast.</div>
            </div>
          </div>

          <div className="actions" role="toolbar" aria-label="actions">
            <button
              className={`action-pill ${actionType === 'create' ? 'primary' : ''}`}
              onClick={() => changeActionType('create')}
              disabled={isSubmitting || !formPermissions.add}
              type="button"
              title={!formPermissions.add ? "You don't have permission to create" : "Create new item"}
            >
              <Icon.Plus /> Create
            </button>

            <button
              className={`action-pill ${actionType === 'edit' ? 'warn' : ''}`}
              onClick={() => changeActionType('edit')}
              disabled={isSubmitting || !formPermissions.edit}
              type="button"
              title={!formPermissions.edit ? "You don't have permission to edit" : "Edit existing item"}
            >
              <Icon.Edit /> Edit
            </button>

            <button
              className={`action-pill ${actionType === 'delete' ? 'danger' : ''}`}
              onClick={() => changeActionType('delete')}
              disabled={isSubmitting || !formPermissions.delete}
              type="button"
              title={!formPermissions.delete ? "You don't have permission to delete" : "Delete item"}
            >
              <Icon.Trash /> Delete
            </button>
          </div>
        </div>

        <div className="grid" role="main">
          <div className="card" aria-live="polite">
            {/* Group Name field */}
            <div className="field">
              <label className="field-label">Group Name *</label>
              <div className="row">
                <input
                  className="input"
                  value={mainGroup}
                  onChange={(e) => setMainGroup(e.target.value)}
                  placeholder="Select Group Name"
                  disabled={isSubmitting}
                  aria-label="Group Name"
                />
                <button
                  className="btn"
                  onClick={() => { setIsTreeOpen((v) => !v); setModalVisible(false); }}
                  type="button"
                  aria-expanded={isTreeOpen}
                  aria-controls="group-tree"
                >
                  {isTreeOpen ? "Close" : "Open"}
                </button>
              </div>

              {isTreeOpen && (
                isMobile ? (
                  <div className="modal-overlay" onClick={() => setIsTreeOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Groups tree modal">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 18 }}>Groups</h3>
                        <button
                          onClick={() => setIsTreeOpen(false)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                          aria-label="Close"
                        >
                          <Icon.Close />
                        </button>
                      </div>

                      <div className="row" style={{ marginBottom: 8 }}>
                        <div className="search-container">
                          <input
                            className="search-with-clear"
                            placeholder="Search groups..."
                            value={searchTree}
                            onChange={(e) => setSearchTree(e.target.value)}
                            aria-label="Search groups"
                          />
                          {searchTree && (
                            <button
                              className="clear-search-btn"
                              onClick={() => setSearchTree("")}
                              type="button"
                              aria-label="Clear search"
                            >
                              <Icon.Close size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="tree-scroll" role="tree" aria-label="Group list">
                        {loading ? (
                          <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>Loading...</div>
                        ) : filteredTree.length === 0 ? (
                          <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>No groups found</div>
                        ) : (
                          filteredTree.map((node) => (
                            <TreeNode
                              key={node.key}
                              node={node}
                              onSelect={(n) => { handleSelectNode(n); setIsTreeOpen(false); }}
                              expandedKeys={expandedKeys}
                              toggleExpand={toggleExpand}
                              selectedKey={selectedNode?.key}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id="group-tree" className="panel" role="region" aria-label="Groups tree">
                    <div className="row" style={{ marginBottom: 8 }}>
                      <div className="search-container">
                        <input
                          className="search-with-clear"
                          placeholder="Search groups..."
                          value={searchTree}
                          onChange={(e) => setSearchTree(e.target.value)}
                          aria-label="Search groups"
                        />
                        {searchTree && (
                          <button
                            className="clear-search-btn"
                            onClick={() => setSearchTree("")}
                            type="button"
                            aria-label="Clear search"
                          >
                            <Icon.Close size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="tree-scroll" role="tree" aria-label="Group list">
                      {loading ? (
                        <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>Loading...</div>
                      ) : filteredTree.length === 0 ? (
                        <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>No groups found</div>
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
                )
              )}
            </div>

            {/* Form Grid */}
            <div className="form-grid">
              {/* Item Name */}
              <div className="field full-width">
                <label className="field-label">Item Name *</label>
                <input
                  ref={itemNameRef}
                  className="input"
                  value={formData.itemName}
                  onChange={(e) => handleChange('itemName', e.target.value)}
                  placeholder="Enter Item Name"
                  disabled={isSubmitting}
                  aria-label="Item Name"
                />
              </div>

              {/* Short Name */}
              <div className="field">
                <label className="field-label">Short Name</label>
                <input
                  ref={shortNameRef}
                  className="input"
                  value={formData.shortName}
                  onChange={(e) => handleChange('shortName', e.target.value)}
                  placeholder="Enter Short Name"
                  disabled={isSubmitting}
                  aria-label="Short Name"
                />
              </div>

              {/* Counter */}
              <div className="field">
                <label className="field-label">Counter</label>
                <input
                  ref={counterRef}
                  className="input"
                  value={formData.counter}
                  onChange={(e) => handleChange('counter', e.target.value)}
                  onFocus={fetchCounterList}
                  placeholder="Select Counter"
                  disabled={isSubmitting}
                  aria-label="Counter"
                />
              </div>

              {/* GST Checkbox */}
              <div className="field">
                <div className="checkbox-group">
                  <div 
                    className={`checkbox ${gstChecked ? 'checked' : ''}`}
                    onClick={handleGstToggle}
                  />
                  <span className="checkbox-label">GST</span>
                </div>
              </div>

              {/* GST% */}
              <div className="field">
                <label className="field-label">GST%</label>
                <input
                  ref={gstinRef}
                  className="input"
                  value={formData.gstin}
                  onChange={(e) => {
                    if (/^\d{0,2}$/.test(e.target.value)) {
                      handleChange('gstin', e.target.value);
                    }
                  }}
                  onBlur={() => {
                    const allowedGSTValues = ['3', '5', '12', '18', '28'];
                    const gstValue = formData.gstin;
                    if (gstValue !== '' && !allowedGSTValues.includes(gstValue)) {
                      handleChange('gstin', '');
                      setMessage({ type: "error", text: 'Only 3, 5, 12, 18, or 28 are allowed.' });
                      gstinRef.current?.focus();
                    }
                  }}
                  placeholder="Enter GST%"
                  disabled={isSubmitting || !gstChecked}
                  aria-label="GST Percentage"
                />
              </div>

              {/* Manual Prefix Checkbox */}
              <div className="field">
                <div className="checkbox-group">
                  <div 
                    className={`checkbox ${manualPrefixChecked ? 'checked' : ''}`}
                    onClick={handleManualPrefixToggle}
                  />
                  <span className="checkbox-label">Manual Prefix</span>
                </div>
              </div>

              {/* Prefix */}
              <div className="field">
                <label className="field-label">Prefix</label>
                <input
                  ref={prefixRef}
                  className="input"
                  value={formData.prefix}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      handleChange('prefix', e.target.value);
                    }
                  }}
                  placeholder="Enter Prefix"
                  disabled={isSubmitting || !manualPrefixChecked}
                  aria-label="Prefix"
                />
              </div>

              {/* Piece Rate Checkbox */}
              <div className="field">
                <div className="checkbox-group">
                  <div 
                    className={`checkbox ${pieceRateChecked ? 'checked' : ''}`}
                    onClick={handlePieceRateToggle}
                  />
                  <span className="checkbox-label">Piece Rate</span>
                </div>
              </div>

              {/* HSN Code */}
              <div className="field">
                <label className="field-label">HSN Code</label>
                <input
                  ref={hsnCodeRef}
                  className="input"
                  value={formData.hsnCode}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      handleChange('hsnCode', e.target.value);
                    }
                  }}
                  maxLength="8"
                  placeholder="Enter HSN Code"
                  disabled={isSubmitting}
                  aria-label="HSN Code"
                />
              </div>
            </div>

            {/* Message display */}
            {message && (
              <div className={`message ${message.type}`} role="alert">
                {message.text}
              </div>
            )}

            {/* Submit controls */}
            <div className="submit-row">
              <button
                className="submit-primary"
                onClick={() => {
                  if (!formData.itemName) {
                    setMessage({ type: "error", text: 'Please enter Item Name.' });
                    itemNameRef.current?.focus();
                    return;
                  }
                  if (!mainGroup) {
                    setMessage({ type: "error", text: 'Please select Group Name.' });
                    return;
                  }

                  const confirmationMessage = 
                    actionType === 'create' ? 'Do You Want Save?' :
                    actionType === 'edit' ? 'Do You Want Modify?' :
                    'Do You Want Delete?';

                  showConfirmation(confirmationMessage, handleSubmit);
                }}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? "Processing..." : 
                 actionType === 'create' ? 'Save' : 
                 actionType === 'edit' ? 'Update' : 'Delete'}
              </button>
              <button
                className="submit-clear"
                onClick={handleClear}
                disabled={isSubmitting}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Right side panel */}
          <div className="side" aria-live="polite">
            <div className="stat">
              <div className="muted">Current Action</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--accent)" }}>
                {actionType === 'create' ? 'Create New Item' : 
                 actionType === 'edit' ? 'Edit Item' : 'Delete Item'}
              </div>
            </div>

            <div className="stat">
              <div className="muted">Group Name</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                {mainGroup || ""}
              </div>
            </div>

            <div className="stat">
              <div className="muted">Item Name</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                {formData.itemName || ""}
              </div>
            </div>

            <div className="stat">
              <div className="muted">Short Name</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                {formData.shortName || ""}
              </div>
            </div>

            <div className="stat">
              <div className="muted">F-Code</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                {formData.fitemCode || ""}
              </div>
            </div>

            <div className="stat tips-panel">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="var(--accent)"/>
                </svg>
                <div style={{ fontWeight: 700 }}>Quick Tips</div>
              </div>
              
              <div className="muted" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "8px" }}>
                  <span style={{ color: "#3b82f6", fontWeight: "bold" }}>•</span>
                  <span>Use the tree to quickly select groups</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "8px" }}>
                  <span style={{ color: "#3b82f6", fontWeight: "bold" }}>•</span>
                  <span>Search groups by name in the search box</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "8px" }}>
                  <span style={{ color: "#3b82f6", fontWeight: "bold" }}>•</span>
                  <span>For editing/deleting, items will be listed automatically</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <span style={{ color: "#3b82f6", fontWeight: "bold" }}>•</span>
                  <span>HSN Code must be 8 digits</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data List Modal for Edit/Delete */}
      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Item selection modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Select Item</h3>
              <button
                onClick={() => setModalVisible(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                aria-label="Close"
              >
                <Icon.Close />
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="search-container">
                <input
                  className="search-with-clear"
                  placeholder="Search items..."
                  onChange={(e) => fetchData(e.target.value)}
                  aria-label="Search items"
                />
              </div>
            </div>

            <div className="dropdown-list" role="listbox" aria-label="Item options">
              {loading ? (
                <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>Loading...</div>
              ) : dataList.length === 0 ? (
                <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>No items found</div>
              ) : (
                dataList.map((item, index) => (
                  <div
                    key={index}
                    className="dropdown-item"
                    onClick={() => {
                      setMainGroup(item.fParent || '');
                      setFormData({
                        fitemCode: item.fItemcode || '',
                        itemName: item.fItemName || '',
                        groupName: item.fParent || '',
                        shortName: item.fShort || '',
                        counter: item.fCounter || '',
                        hsnCode: item.fhsn || '',
                        gstin: item.ftax || '',
                        prefix: item.fPrefix || '',
                        pieceRate: item.pieceRate === "Y" ? "Y" : "N",
                        gst: item.gstcheckbox === "Y" ? "Y" : "N",
                        manualprefix: item.manualprefix === "Y" ? "Y" : "N"
                      });
                      setGstChecked(item.gstcheckbox === "Y");
                      setManualPrefixChecked(item.manualprefix === "Y");
                      setPieceRateChecked(item.pieceRate === "Y");
                      setModalVisible(false);
                    }}
                    role="option"
                    aria-selected={item.fItemName === formData.itemName}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && (() => {
                      setMainGroup(item.fParent || '');
                      setFormData({
                        fitemCode: item.fItemcode || '',
                        itemName: item.fItemName || '',
                        groupName: item.fParent || '',
                        shortName: item.fShort || '',
                        counter: item.fCounter || '',
                        hsnCode: item.fhsn || '',
                        gstin: item.ftax || '',
                        prefix: item.fPrefix || '',
                        pieceRate: item.pieceRate === "Y" ? "Y" : "N",
                        gst: item.gstcheckbox === "Y" ? "Y" : "N",
                        manualprefix: item.manualprefix === "Y" ? "Y" : "N"
                      });
                      setGstChecked(item.gstcheckbox === "Y");
                      setManualPrefixChecked(item.manualprefix === "Y");
                      setPieceRateChecked(item.pieceRate === "Y");
                      setModalVisible(false);
                    })()}
                  >
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.fItemName}</div>
                    {item.fParent && (
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>Group: {item.fParent}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Counter List Modal */}
      {counterModalVisible && (
        <div className="modal-overlay" onClick={() => setCounterModalVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Counter selection modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Select Counter</h3>
              <button
                onClick={() => setCounterModalVisible(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                aria-label="Close"
              >
                <Icon.Close />
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="search-container">
                <input
                  className="search-with-clear"
                  placeholder="Search counters..."
                  value={counterSearch}
                  onChange={(e) => {
                    setCounterSearch(e.target.value);
                    filterCounterList(e.target.value);
                  }}
                  aria-label="Search counters"
                />
              </div>
            </div>

            <div className="dropdown-list" role="listbox" aria-label="Counter options">
              {filteredCounterList.length === 0 ? (
                <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>No counters found</div>
              ) : (
                filteredCounterList.map((item, index) => (
                  <div
                    key={index}
                    className="dropdown-item"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, counter: item.fbox || '' }));
                      setCounterModalVisible(false);
                      setCounterSearch('');
                    }}
                    role="option"
                    aria-selected={item.fbox === formData.counter}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && (() => {
                      setFormData(prev => ({ ...prev, counter: item.fbox || '' }));
                      setCounterModalVisible(false);
                      setCounterSearch('');
                    })()}
                  >
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.fbox}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCreation;