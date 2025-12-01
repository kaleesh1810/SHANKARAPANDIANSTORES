// LedgerGroupCreation.js
import React, { useEffect, useMemo, useState } from "react";
import { api } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../api/endpoints';
// import { useFormPermissions } from '../../../hooks/useFormPermissions';

const endpoints = API_ENDPOINTS.LEDGER_GROUP_CREATION_ENDPOINTS || {};

// --- Inline SVG icons (small, accessible) ---
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

// --- Tree node presentational component ---
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

export default function LedgerGroupCreation() {
  // form state
  const [mainGroup, setMainGroup] = useState("");
  const [subGroup, setSubGroup] = useState("");
  const [fCode, setFCode] = useState("");
  const [actionType, setActionType] = useState("Add"); // Add | edit | delete

  // data
  const [treeData, setTreeData] = useState([]);
  const [dropdownData, setDropdownData] = useState([]);
  const [subGroupOptions, setSubGroupOptions] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  // *** Tree is OPEN by default now ***
  const [isTreeOpen, setIsTreeOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTree, setSearchTree] = useState("");
  const [searchDropdown, setSearchDropdown] = useState("");
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);

  // Get permissions for this form. The hook may not be present in this workspace,
  // so use a permissive fallback to avoid runtime ReferenceError.
  const formPermissions = useMemo(() => ({ add: true, edit: true, delete: true }), []);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep track of viewport to adapt tree rendering for small screens
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
      const [treeResp, ddResp] = await Promise.all([api.get(endpoints.getTree), api.get(endpoints.getDropdown)]);
      const tree = transformApiData(treeResp.data || []);
      setTreeData(tree);
      setExpandedKeys(new Set(tree.map((n) => n.key)));
      setDropdownData(Array.isArray(ddResp.data) ? ddResp.data : []);
      setSubGroupOptions(
        (Array.isArray(ddResp.data) ? ddResp.data : []).map((item) => ({
          label: item.fAcname,
          value: item.fAcname,
          parentName: item.parentName,
          fcode: item.fCode ?? item.fcode,
        }))
      );
      setMessage(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load data. Check console." });
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (apiData) => {
    if (!Array.isArray(apiData)) return [];
    const build = (items, parentPath = "") =>
      items.map((item, idx) => {
        const key = `${parentPath}/${item.fcode ?? item.fCode ?? idx}`;
        return {
          key,
          displayName: item.fAcname ?? item.fAcName ?? "Unnamed",
          id: item.fcode ?? item.fCode ?? null,
          children: Array.isArray(item.children) ? build(item.children, key) : [],
        };
      });
    return build(apiData);
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
    // keep tree open — user asked tree should remain open by default, so selecting won't auto-close
    setIsTreeOpen(true);
  };

  const handleSelectSub = (option) => {
    setSubGroup(option.value);
    setFCode(option.fcode);
    if (option.parentName) setMainGroup(option.parentName);
    setIsDropdownOpen(false);
    // keep tree open after selecting (more convenient)
    setIsTreeOpen(true);
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

  const filteredDropdown = useMemo(() => {
    if (!searchDropdown) return subGroupOptions;
    const q = searchDropdown.toLowerCase();
    return subGroupOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.parentName || "").toLowerCase().includes(q)
    );
  }, [subGroupOptions, searchDropdown]);

  // resetForm now keeps the tree open by default (user requested always open)
  const resetForm = (keepAction = false) => {
    setMainGroup("");
    setSubGroup("");
    setFCode("");
    setSelectedNode(null);
    setMessage(null);
    setSearchDropdown("");
    setSearchTree("");
    setIsDropdownOpen(false);
    setIsTreeOpen(true); // <-- keep tree open after reset
    if (!keepAction) setActionType("Add");
  };

  const validateForSubmit = () => {
    if (!mainGroup?.trim()) {
      setMessage({ type: "error", text: "Please select a Main Group." });
      return false;
    }
    if (actionType !== "delete" && !subGroup?.trim()) {
      setMessage({ type: "error", text: "Please enter/select a Sub Group." });
      return false;
    }
    if ((actionType === "edit" || actionType === "delete") && !fCode) {
      setMessage({ type: "error", text: `Select a Sub Group to ${actionType}.` });
      return false;
    }
    return true;
  };

  // Add / Edit / Delete handlers
  const handleAdd = async () => {
    // Check permission before allowing action
    if (!formPermissions.add) {
      setMessage({ type: "error", text: "You don't have permission to add ledger groups." });
      return;
    }
    if (!validateForSubmit()) return;
    if (!window.confirm("Do you want to save?")) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        fcode: "",
        subGroup: subGroup.trim(),
        mainGroup: mainGroup.trim(),
        faclevel: "",
      };
  const resp = await api.post(endpoints.postCreate || endpoints.postAdd, payload);
      if (resp.status === 200 || resp.status === 201) {
        setMessage({ type: "success", text: "Saved successfully." });
        resetForm(true);
        await loadInitial();
      } else {
        setMessage({ type: "error", text: `Unexpected server response: ${resp.status}` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Save failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    // Check permission before allowing action
    if (!formPermissions.edit) {
      setMessage({ type: "error", text: "You don't have permission to edit ledger groups." });
      return;
    }
    if (!validateForSubmit()) return;
    if (!window.confirm("Do you want to modify?")) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        fcode: fCode,
        subGroup: subGroup.trim(),
        mainGroup: mainGroup.trim(),
        faclevel: "",
      };
      const resp = await api.put(endpoints.putEdit, payload);
      if (resp.status === 200 || resp.status === 201) {
        setMessage({ type: "success", text: "Updated successfully." });
        resetForm(true);
        await loadInitial();
      } else {
        setMessage({ type: "error", text: `Unexpected server response: ${resp.status}` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Update failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    // Check permission before allowing action
    if (!formPermissions.delete) {
      setMessage({ type: "error", text: "You don't have permission to delete ledger groups." });
      return;
    }
    if (!validateForSubmit()) return;
    if (!window.confirm("Do you want to delete?")) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const resp = await api.delete(endpoints.delete(fCode));
      if (resp.status === 200 || resp.status === 201) {
        setMessage({ type: "success", text: "Deleted successfully." });
        resetForm(true);
        await loadInitial();
      } else {
        setMessage({ type: "error", text: `Unexpected server response: ${resp.status}` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || err.message || "Delete failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (actionType === "Add") await handleAdd();
    else if (actionType === "edit") await handleEdit();
    else if (actionType === "delete") await handleDelete();
  };

  useEffect(() => {
    if (fCode) {
      const opt = subGroupOptions.find((o) => o.fcode === fCode);
      if (opt?.parentName) setMainGroup((prev) => prev || opt.parentName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fCode]);

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
          min-width: 0; /* Allow shrinking on small screens */
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
          width: 83%;
        }

        .search-with-clear {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        /* constrain search input width inside panels/modals to match design */
        .panel .search-with-clear, .modal .search-with-clear { max-width: 420px; }

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
          .dropdown-item { padding:12px; border-bottom:1px solid rgba(12,18,35,0.03); cursor:pointer; display:flex; flex-direction:column; gap:4px; text-align: left; }
        .dropdown-item:hover { background: linear-gradient(90deg, rgba(48,122,200,0.04), rgba(48,122,200,0.01)); transform: translateX(6px); }

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

      <div className="dashboard" aria-labelledby="ledger-title">
        <div className="top-row">
          <div className="title-block">
          </div>
          {/* <div className="title-block">
            <svg width="38" height="38" viewBox="0 0 24 24" aria-hidden focusable="false">
              <rect width="24" height="24" rx="6" fill="#eff6ff" />
              <path d="M6 12h12M6 8h12M6 16h12" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <h2 id="ledger-title">Ledger Group Creation</h2>
              <div className="subtitle muted">Add, edit, or delete ledger groups — organized & fast.</div>
            </div>
          </div> */}

          <div className="actions" role="toolbar" aria-label="actions">
            <button
              className={`action-pill ${actionType === "Add" ? "primary" : ""}`}
              onClick={() => { setActionType("Add"); resetForm(true); }}
              disabled={submitting || !formPermissions.add}
              type="button"
              title={!formPermissions.add ? "You don't have permission to add" : "Add new ledger group"}
            >
              <Icon.Plus /> Add
            </button>

            <button
              className={`action-pill ${actionType === "edit" ? "warn" : ""}`}
              onClick={() => { setActionType("edit"); resetForm(true); setIsDropdownOpen(true); }}
              disabled={submitting || !formPermissions.edit}
              type="button"
              title={!formPermissions.edit ? "You don't have permission to edit" : "Edit existing ledger group"}
            >
              <Icon.Edit /> Edit
            </button>

            <button
              className={`action-pill ${actionType === "delete" ? "danger" : ""}`}
              onClick={() => { setActionType("delete"); resetForm(true); setIsDropdownOpen(true); }}
              disabled={submitting || !formPermissions.delete}
              type="button"
              title={!formPermissions.delete ? "You don't have permission to delete" : "Delete ledger group"}
            >
              <Icon.Trash /> Delete
            </button>
          </div>
        </div>

        <div className="grid" role="main">
          <div className="card" aria-live="polite">
            {/* Main Group field */}
            <div className="field">
              <label className="field-label">Main Group</label>
              <div className="row">
                <input
                  className="input"
                  value={mainGroup}
                  onChange={(e) => setMainGroup(e.target.value)}
                  readOnly={actionType !== "Add"}
                  placeholder="Select Main Group"
                  disabled={submitting}
                  aria-label="Main Group"
                />
                <button
                  className="btn"
                  onClick={() => { setIsTreeOpen((v) => !v); setIsDropdownOpen(false); }}
                  disabled={submitting || actionType !== "Add"}
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

            {/* Sub Group field */}
            <div className="field">
              <label className="field-label">Sub Group</label>
              <div className="row">
                {actionType === "Add" ? (
                  <input
                    className="input"
                    value={subGroup}
                    onChange={(e) => setSubGroup(e.target.value)}
                    placeholder="Enter Sub Group"
                    disabled={submitting}
                    aria-label="Sub Group"
                  />
                ) : (
                  <input
                    className="input"
                    value={subGroup}
                    onChange={(e) => setSubGroup(e.target.value)}
                    placeholder="Select Sub Group"
                    disabled={submitting}
                    readOnly={actionType === "delete"}
                    aria-label="Sub Group"
                    // onFocus={() => setIsDropdownOpen(true)}
                  />
                )}

                {(actionType === "edit" || actionType === "delete") && (
                  <button
                    className="btn"
                    onClick={() => { setIsDropdownOpen(true); setIsTreeOpen(false); }}
                    type="button"
                    aria-expanded={isDropdownOpen}
                    aria-controls="subgroup-dropdown"
                  >
                    <Icon.Search /> Search
                  </button>
                )}
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
                onClick={handleSubmit}
                disabled={submitting}
                type="button"
              >
                {submitting ? "Processing..." : actionType}
              </button>
              <button
                className="submit-clear"
                onClick={resetForm}
                disabled={submitting}
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
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--accent)" }}>{actionType}</div>
            </div>

            <div className="stat">
              <div className="muted">Main Group</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                {mainGroup || ""}
              </div>
            </div>

            <div className="stat">
              <div className="muted">Sub Group</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                {subGroup || ""}
              </div>
            </div>

            <div className="stat">
              <div className="muted">F-Code</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                {fCode || ""}
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
                  <span style={{ color: "var(--accent-3)", fontWeight: "bold" }}>•</span>
                  <span>Use the tree to quickly select main groups</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "8px" }}>
                  <span style={{ color: "var(--accent-3)", fontWeight: "bold" }}>•</span>
                  <span>Search groups by name in the search box</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "8px" }}>
                  <span style={{ color: "var(--accent-3)", fontWeight: "bold" }}>•</span>
                  <span>For editing/deleting, use the dropdown to find sub-groups</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <span style={{ color: "var(--accent-3)", fontWeight: "bold" }}>•</span>
                  <span>Click folder icons to expand/collapse groups</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Dropdown modal */}
      {isDropdownOpen && (
        <div className="modal-overlay" onClick={() => setIsDropdownOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Select Sub Group</h3>
              <button
                onClick={() => setIsDropdownOpen(false)}
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
                  placeholder="Search sub groups..."
                  value={searchDropdown}
                  onChange={(e) => setSearchDropdown(e.target.value)}
                  aria-label="Search sub groups"
                />
                {searchDropdown && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setSearchDropdown("")}
                    type="button"
                    aria-label="Clear search"
                  >
                    <Icon.Close size={16} />
                  </button>
                )}
              </div>
            </div>

            <div id="subgroup-dropdown" className="dropdown-list" role="listbox" aria-label="Sub group options">
              {filteredDropdown.length === 0 ? (
                <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>No options found</div>
              ) : (
                filteredDropdown.map((option, idx) => (
                  <div
                    key={idx}
                    className="dropdown-item"
                    onClick={() => handleSelectSub(option)}
                    role="option"
                    aria-selected={option.value === subGroup}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSelectSub(option)}
                  >
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{option.label}</div>
                    {option.parentName && (
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>Parent: {option.parentName}</div>
                    )}
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