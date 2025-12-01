import React, { useState, useMemo, useEffect } from "react";
import Select from "react-select";

const API_BASE = "http://dikshiserver/spstores/api/Administartor";
const USERS_URL = `${API_BASE}/UserNameList`;
const GET_PERMS_URL = `${API_BASE}/GetPermissionsByUserCode`;
const INSERT_BATCH_URL = `${API_BASE}/adminstration/InsertBatch`;
const DELETE_URL = `${API_BASE}/administration/delete`;

const MASTER_ITEMS = ["Ledger Group Creation", "Item Group Creation", "Ledger Creation", "Item Creation", "User Creation", "Administration", "Company", "Transport Creation", "Place Of Supply", "Route Creation"];
const TRANSACTION_ITEMS = ["Sales Invoice", "Sales Return", "Purchase Invoice", "Purchase Return", "Outward", "Inward"];
const REPORT_ITEMS = ["Sales Report", "Stock Report", "Purchase Report"];

function makeEmptyPerms(list, modelShort = "M") {
  const o = {};
  list.forEach(l => {
    const c = l.replace(/\s+/g, "_").toUpperCase();
    o[c] = { formCode: c, modelShort, label: l, permission: false, add: false, edit: false, del: false, print: false }
  });
  return o;
}

const Administration = () => {
  const [users, setUsers] = useState([{ id: "0", code: "0", name: "Select User" }]);
  const [filterText, setFilterText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("0");
  const [activeTab, setActiveTab] = useState("master");
  const [loaded, setLoaded] = useState(false);
  const [perms, setPerms] = useState({});

  const LS_LAST_USER = "admin_last_selected_user_id";
  const LS_PERMS_PREFIX = "admin_perms_user_";

  useEffect(() => { loadUsers() }, []);
  useEffect(() => {
    setPerms(p => {
      const c = { ...p };
      users.forEach(u => {
        if (!c[u.id]) c[u.id] = {
          ...makeEmptyPerms(MASTER_ITEMS, "M"),
          ...makeEmptyPerms(TRANSACTION_ITEMS, "T"),
          ...makeEmptyPerms(REPORT_ITEMS, "R")
        };
      });
      return c;
    });
    const last = localStorage.getItem(LS_LAST_USER);
    if (last) {
      const f = users.find(u => u.id === last);
      if (f) {
        setSelectedUserId(last);
        (async () => {
          const cached = localStorage.getItem(LS_PERMS_PREFIX + f.code);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setPerms(p => {
                const c = JSON.parse(JSON.stringify(p || {}));
                c[last] = { ...c[last], ...parsed };
                return c;
              });
            } catch { }
          }
          await fetchAndMapPermissions(f.code, last);
        })();
      }
    }
    setTimeout(() => setLoaded(true), 80);
  }, [users]);

  const selectedUserPerms = useMemo(() => perms[selectedUserId] || {}, [perms, selectedUserId]);

  async function loadUsers() {
    try {
      const r = await fetch(USERS_URL);
      if (!r.ok) throw new Error();
      const d = await r.json();
      const m = Array.isArray(d) ? d.map((u, i) => ({
        id: String(i + 1),
        code: u.userCode ?? u.code ?? String(i + 1),
        name: u.userName ?? u.name ?? `User ${i + 1}`
      })) : [];
      setUsers([{ id: "0", code: "0", name: "Select User" }, ...m]);
    } catch (e) { console.error(e); }
  }

  async function fetchPermissionsForCode(code) {
    if (!code) return null;
    const v = [
      `${GET_PERMS_URL}?fUcode=${code}`,
      `${GET_PERMS_URL}?userCode=${code}`,
      `${GET_PERMS_URL}/${code}`
    ];
    for (const u of v) {
      try {
        const r = await fetch(u);
        if (r.ok) return await r.json();
      } catch { }
    }
    return null;
  }

  async function fetchAndMapPermissions(userCode, userId) {
    const dataRaw = await fetchPermissionsForCode(userCode);
    if (!dataRaw) return null;
    let data = dataRaw;
    if (!Array.isArray(data) && typeof data === "object") data = Object.values(data);
    if (!Array.isArray(data)) return null;

    setPerms(prev => {
      const c = JSON.parse(JSON.stringify(prev || {}));
      if (!c[userId]) c[userId] = {
        ...makeEmptyPerms(MASTER_ITEMS, "M"),
        ...makeEmptyPerms(TRANSACTION_ITEMS, "T"),
        ...makeEmptyPerms(REPORT_ITEMS, "R")
      };
      const map = {};
      Object.values(c[userId]).forEach(v => map[v.formCode] = { ...v });

      const b = v => v === true || v === "1" || v === 1 || v === "true" || v === "True";

      data.forEach(it => {
        const fc = it.formCode || it.form_permission || it.formPermission || it.form || (it.formName ? it.formName.replace(/\s+/g, "_").toUpperCase() : null);
        let p = b(it.permission) || b(it.fPermission) || b(it.formPermission);
        let a = b(it.add) || b(it.addPermission);
        let e = b(it.edit) || b(it.editPermission);
        let d = b(it.del) || b(it.deletePermission) || b(it.delPermission);
        let pr = b(it.print) || b(it.printPermission);
        let n = fc;
        if (!n && it.label) n = it.label.replace(/\s+/g, "_").toUpperCase();
        if (n && map[n]) map[n] = { ...map[n], permission: !!p, add: !!a, edit: !!e, del: !!d, print: !!pr };
      });
      c[userId] = { ...c[userId], ...map };
      try {
        localStorage.setItem(LS_PERMS_PREFIX + userCode, JSON.stringify(c[userId]));
      } catch { }
      return c;
    });
    return true;
  }

  async function deletePermissionsForCode(code) {
    const urls = [
      `${DELETE_URL}/${code}`,
      `${DELETE_URL}?userCode=${code}`,
      DELETE_URL
    ];
    for (const u of urls.slice(0, 2)) {
      try {
        const r = await fetch(u, { method: "DELETE" });
        if (r.ok) return { ok: true };
      } catch { }
    }
    try {
      const r = await fetch(DELETE_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCode: code })
      });
      if (r.ok) return { ok: true };
      return { ok: false };
    } catch (err) {
      return { ok: false };
    }
  }

  async function insertBatchForUser(code) {
    const o = perms[selectedUserId];
    if (!o) return { ok: false };
    const payload = Object.values(o).map(p => ({
      userCode: code,
      modelShort: p.modelShort,
      formPermission: p.formCode,
      fPermission: p.permission ? "1" : "0",
      addPermission: p.add ? "1" : "0",
      editPermission: p.edit ? "1" : "0",
      deletePermission: p.del ? "1" : "0",
      printPermission: p.print ? "1" : "0"
    }));
    try {
      const r = await fetch(INSERT_BATCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) return { ok: false };
      try {
        localStorage.setItem(LS_PERMS_PREFIX + code, JSON.stringify(o));
      } catch { }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  async function handleUserChange(e) {
    const id = e.value;
    setSelectedUserId(id);
    localStorage.setItem(LS_LAST_USER, id);
    const u = users.find(x => x.id === id);
    if (!u || u.code === "0") return;

    try {
      const c = localStorage.getItem(LS_PERMS_PREFIX + u.code);
      if (c) {
        const p = JSON.parse(c);
        setPerms(prev => {
          const cp = JSON.parse(JSON.stringify(prev || {}));
          cp[id] = { ...cp[id], ...p };
          return cp;
        });
      }
    } catch { }
    await fetchAndMapPermissions(u.code, id);
  }

  const toggle = (fc, key) => {
    if (selectedUserId === "0") return;
    setPerms(prev => {
      const cp = JSON.parse(JSON.stringify(prev));
      const it = cp[selectedUserId][fc];
      if (!it) return prev;
      if (key === "permission") {
        it.permission = !it.permission;
        if (!it.permission) it.add = it.edit = it.del = it.print = false;
      }
      else if (it.permission) it[key] = !it[key];
      return cp;
    });
  };

  const handleClear = () => {
    // Reset user selection to "Select User"
    setSelectedUserId("0");
    localStorage.setItem(LS_LAST_USER, "0");
    
    // Clear all permissions for all users
    setPerms(p => {
      const c = JSON.parse(JSON.stringify(p || {}));
      Object.keys(c).forEach(userId => {
        Object.keys(c[userId]).forEach(f => {
          const x = c[userId][f];
          x.permission = x.add = x.edit = x.del = x.print = false;
        });
      });
      return c;
    });
  };

  const handleSubmit = async () => {
    if (selectedUserId === "0") return alert("Select user");
    const u = users.find(x => x.id === selectedUserId);
    if (!u) return alert("User missing");
    const code = u.code;
    await deletePermissionsForCode(code);
    const ins = await insertBatchForUser(code);
    if (ins.ok) {
      alert("Submitted");
      await fetchAndMapPermissions(code, selectedUserId);
    } else alert("Failed");
  };

  const itemsForRender = useMemo(() => {
    let list = MASTER_ITEMS;
    if (activeTab === "transaction") list = TRANSACTION_ITEMS;
    if (activeTab === "report") list = REPORT_ITEMS;
    return list.map(l => {
      const c = l.replace(/\s+/g, "_").toUpperCase();
      return selectedUserPerms[c] || { formCode: c, label: l };
    });
  }, [activeTab, selectedUserPerms]);

  const summary = useMemo(() => {
    const s = {
      total: 0,
      granted: 0,
      master: { permission: 0, add: 0, edit: 0, del: 0, print: 0 },
      transaction: {},
      report: { permission: 0, add: 0, edit: 0, del: 0, print: 0 }
    };
    s.transaction = { permission: 0, add: 0, edit: 0, del: 0, print: 0 };
    if (!perms[selectedUserId]) return s;
    Object.values(perms[selectedUserId]).forEach(p => {
      s.total += 5;
      const sec = p.modelShort === "M" ? s.master : p.modelShort === "T" ? s.transaction : s.report;
      if (p.permission) (sec.permission++, s.granted++);
      if (p.add) (sec.add++, s.granted++);
      if (p.edit) (sec.edit++, s.granted++);
      if (p.del) (sec.del++, s.granted++);
      if (p.print) (sec.print++, s.granted++);
    });
    return s;
  }, [perms, selectedUserId]);

  const filteredUsers = users;
  const options = filteredUsers.map(u => ({ value: u.id, label: u.name }));

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.8.1/font/bootstrap-icons.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        
        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        /* Custom switch styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
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
          border-radius: 20px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: #307AC8;
        }
        
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        
        input:disabled + .slider {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Select styling */
        .react-select-container .react-select__control {
          border-radius: 6px;
          border: 1px solid #d1d5db;
          box-shadow: none;
          min-height: 38px;
          font-size: 14px;
        }
        
        .react-select-container .react-select__control:hover {
          border-color: #307AC8;
        }
        
        .react-select-container .react-select__control--is-focused {
          border-color: #307AC8;
          box-shadow: 0 0 0 2px rgba(48, 122, 200, 0.1);
        }
        
        /* Responsive styles */
        @media (max-width: 1200px) {
          .main-content {
            flex-direction: column !important;
          }
          
          .left-column {
            margin-right: 0 !important;
            margin-bottom: 20px;
            flex: none !important;
          }
          
          .right-column {
            flex: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .table-container {
            min-width: 100% !important;
          }
        }
        
        @media (max-width: 768px) {
          .page-title {
            font-size: 20px !important;
          }
          
          .tabs-container {
            flex-wrap: wrap;
          }
          
          .tab-button {
            flex: 1 0 calc(33.333% - 8px) !important;
            min-width: 100px;
          }
          
          .table-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px;
          }
          
          .table-actions {
            width: 100%;
            justify-content: space-between;
          }
          
          .table-container {
            max-height: 400px !important;
          }
        }
        
        @media (max-width: 576px) {
          .container {
            padding: 10px !important;
          }
          
          .table-container {
            max-height: 350px !important;
          }
          
          .stat-item {
            min-width: 45px !important;
          }
          
          .tab-button {
            padding: 8px 10px !important;
            font-size: 13px !important;
          }
        }
      `}</style>

      <div style={styles.contentWrapper}>
        {/* Page Header */}
        

        <div style={styles.mainContent} className="main-content">
          {/* Left Column - Main Content */}
          <div style={styles.leftColumn} className="left-column">
            {/* User Selection */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Select User</h3>
              <div className="react-select-container" style={styles.selectWrapper}>
                <Select
                  options={options}
                  value={options.find(o => o.value === selectedUserId)}
                  onChange={handleUserChange}
                  isSearchable
                  placeholder="Select User..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: state.isFocused ? '#307AC8' : '#d1d5db',
                      borderRadius: '6px',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(48, 122, 200, 0.1)' : 'none',
                      minHeight: '38px',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#307AC8'
                      }
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#6b7280',
                      fontSize: '14px'
                    })
                  }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div style={styles.card}>
              <div style={styles.tabsContainer}>
                <button
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'master' ? styles.activeTab : {})
                  }}
                  onClick={() => setActiveTab('master')}
                >
                  Master
                </button>
                <button
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'transaction' ? styles.activeTab : {})
                  }}
                  onClick={() => setActiveTab('transaction')}
                >
                  Transaction
                </button>
                <button
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === 'report' ? styles.activeTab : {})
                  }}
                  onClick={() => setActiveTab('report')}
                >
                  Report
                </button>
              </div>
            </div>

            {/* Table Section */}
            <div style={styles.card}>
              <div style={styles.tableHeader}>
                <h2 style={styles.sectionTitle}>{activeTab.toUpperCase()}</h2>
                <div style={styles.tableActions}>
                  <button style={styles.clearButton} onClick={handleClear}>
                    Clear
                  </button>
                  <button 
                    style={{
                      ...styles.submitButton,
                      ...(selectedUserId === "0" ? styles.disabledButton : {})
                    }} 
                    onClick={handleSubmit}
                    disabled={selectedUserId === "0"}
                  >
                    Submit
                  </button>
                </div>
              </div>
              
              <div style={styles.tableContainer} className="custom-scrollbar">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeaderCell}>No</th>
                      <th style={styles.tableHeaderCell}>Particulars</th>
                      <th style={{...styles.tableHeaderCell, ...styles.centerCell}}>Permission</th>
                      <th style={{...styles.tableHeaderCell, ...styles.centerCell}}>Add</th>
                      <th style={{...styles.tableHeaderCell, ...styles.centerCell}}>Edit</th>
                      <th style={{...styles.tableHeaderCell, ...styles.centerCell}}>Delete</th>
                      <th style={{...styles.tableHeaderCell, ...styles.centerCell}}>Print</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsForRender.map((it, i) => {
                      const dis = !it.permission || selectedUserId === "0";
                      return (
                        <tr key={it.formCode} style={styles.tableRow}>
                          <td style={styles.tableCell}>{i + 1}</td>
                          <td style={styles.tableCell}>
                            <span style={styles.itemLabel}>
                              {it.label}
                            </span>
                          </td>
                          
                          <td style={{...styles.tableCell, ...styles.centerCell}}>
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={!!it.permission}
                                onChange={() => toggle(it.formCode, "permission")}
                              />
                              <span className="slider"></span>
                            </label>
                          </td>
                          
                          <td style={{...styles.tableCell, ...styles.centerCell}}>
                            <label className="switch">
                              <input
                                type="checkbox"
                                disabled={dis}
                                checked={!!it.add}
                                onChange={() => toggle(it.formCode, "add")}
                              />
                              <span className="slider"></span>
                            </label>
                          </td>
                          
                          <td style={{...styles.tableCell, ...styles.centerCell}}>
                            <label className="switch">
                              <input
                                type="checkbox"
                                disabled={dis}
                                checked={!!it.edit}
                                onChange={() => toggle(it.formCode, "edit")}
                              />
                              <span className="slider"></span>
                            </label>
                          </td>
                          
                          <td style={{...styles.tableCell, ...styles.centerCell}}>
                            <label className="switch">
                              <input
                                type="checkbox"
                                disabled={dis}
                                checked={!!it.del}
                                onChange={() => toggle(it.formCode, "del")}
                              />
                              <span className="slider"></span>
                            </label>
                          </td>
                          
                          <td style={{...styles.tableCell, ...styles.centerCell}}>
                            <label className="switch">
                              <input
                                type="checkbox"
                                disabled={dis}
                                checked={!!it.print}
                                onChange={() => toggle(it.formCode, "print")}
                              />
                              <span className="slider"></span>
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div style={styles.rightColumn} className="right-column">
            <div style={styles.card}>
              <h3 style={styles.summaryTitle}>Permission Summary</h3>
              
              {/* User Info */}
              <div style={styles.userInfo}>
                <i className="bi bi-person-circle" style={styles.userIcon}></i>
                <div style={styles.userName}>
                  {users.find(u => u.id === selectedUserId)?.name || "Select User"}
                </div>
              </div>
              
              {/* Totals */}
              <div style={styles.totalsSection}>
                <div style={styles.totalItem}>
                  <span style={styles.totalLabel}>Total</span>
                  <span style={styles.totalValue}>{summary.total}</span>
                </div>
                <div style={styles.totalItem}>
                  <span style={styles.totalLabel}>Granted</span>
                  <span style={styles.totalValue}>{summary.granted}/{summary.total}</span>
                </div>
              </div>
              
              <hr style={styles.divider} />
              
              {/* Master Summary */}
              <div style={styles.categorySection}>
                <h4 style={styles.categoryTitle}>Master</h4>
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <i className="bi bi-check-circle-fill" style={{...styles.statIcon, color: '#307AC8'}}></i>
                    <span style={styles.statValue}>{summary.master.permission}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-plus-circle-fill" style={{...styles.statIcon, color: '#28a745'}}></i>
                    <span style={styles.statValue}>{summary.master.add}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-pencil-square" style={{...styles.statIcon, color: '#ff9800'}}></i>
                    <span style={styles.statValue}>{summary.master.edit}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-trash3-fill" style={{...styles.statIcon, color: '#dc3545'}}></i>
                    <span style={styles.statValue}>{summary.master.del}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-printer-fill" style={{...styles.statIcon, color: '#6a1b9a'}}></i>
                    <span style={styles.statValue}>{summary.master.print}</span>
                  </div>
                </div>
              </div>
              
              {/* Transaction Summary */}
              <div style={styles.categorySection}>
                <h4 style={styles.categoryTitle}>Transaction</h4>
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <i className="bi bi-check-circle-fill" style={{...styles.statIcon, color: '#307AC8'}}></i>
                    <span style={styles.statValue}>{summary.transaction.permission}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-plus-circle-fill" style={{...styles.statIcon, color: '#28a745'}}></i>
                    <span style={styles.statValue}>{summary.transaction.add}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-pencil-square" style={{...styles.statIcon, color: '#ff9800'}}></i>
                    <span style={styles.statValue}>{summary.transaction.edit}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-trash3-fill" style={{...styles.statIcon, color: '#dc3545'}}></i>
                    <span style={styles.statValue}>{summary.transaction.del}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-printer-fill" style={{...styles.statIcon, color: '#6a1b9a'}}></i>
                    <span style={styles.statValue}>{summary.transaction.print}</span>
                  </div>
                </div>
              </div>
              
              {/* Report Summary */}
              <div style={styles.categorySection}>
                <h4 style={styles.categoryTitle}>Report</h4>
                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <i className="bi bi-check-circle-fill" style={{...styles.statIcon, color: '#307AC8'}}></i>
                    <span style={styles.statValue}>{summary.report.permission}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-plus-circle-fill" style={{...styles.statIcon, color: '#28a745'}}></i>
                    <span style={styles.statValue}>{summary.report.add}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-pencil-square" style={{...styles.statIcon, color: '#ff9800'}}></i>
                    <span style={styles.statValue}>{summary.report.edit}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-trash3-fill" style={{...styles.statIcon, color: '#dc3545'}}></i>
                    <span style={styles.statValue}>{summary.report.del}</span>
                  </div>
                  <div style={styles.statItem}>
                    <i className="bi bi-printer-fill" style={{...styles.statIcon, color: '#6a1b9a'}}></i>
                    <span style={styles.statValue}>{summary.report.print}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline CSS Styles
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '0',
    margin: '0',
  },
  contentWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  pageHeader: {
    padding: '16px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
    boxShadow: '10 20px 20px rgba(0, 0, 0, 0.06)',
  },
  pageTitle: {
    margin: '0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#1f2937',
  },
  mainContent: {
    display: 'flex',
    flex: '1',
    padding: '20px',
    gap: '20px',
  },
  leftColumn: {
    flex: '3',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: '0',
  },
  rightColumn: {
    flex: '1',
    minWidth: '320px',
    maxWidth: '400px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'box-shadow 0.3s ease',
  },
  cardTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  selectWrapper: {
    width: '100%',
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
  },
  tabButton: {
    flex: '1',
    padding: '10px 16px',
    backgroundColor: 'transparent',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    outline: 'none',
  },
  activeTab: {
    backgroundColor: '#307AC8',
    color: 'white',
    borderColor: '#307AC8',
    fontWeight: '600',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: '0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },
  tableActions: {
    display: 'flex',
    gap: '8px',
  },
  clearButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    }
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#307AC8',
    border: '1px solid #307AC8',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    '&:hover': {
      backgroundColor: '#2563eb',
    }
  },
  disabledButton: {
    opacity: '0.5',
    cursor: 'not-allowed',
  },
  tableContainer: {
    overflow: 'auto',
    maxHeight: 'calc(100vh - 350px)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  tableHeaderCell: {
    padding: '14px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e5e7eb',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '700',
    color: '#374151',
    position: 'sticky',
    top: '0',
    zIndex: '10',
  },
  centerCell: {
    textAlign: 'center',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    '&:hover': {
      backgroundColor: '#f8fafc',
    },
  },
  tableCell: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
  },
  itemLabel: {
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  userIcon: {
    fontSize: '48px',
    color: '#307AC8',
    marginBottom: '8px',
  },
  userName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#307AC8',
    textAlign: 'center',
  },
  totalsSection: {
    marginBottom: '20px',
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  totalItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  totalLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
  divider: {
    border: 'none',
    borderTop: '2px solid #e5e7eb',
    margin: '20px 0',
  },
  categorySection: {
    marginBottom: '20px',
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  categoryTitle: {
    margin: '0 0 12px 0',
    fontSize: '15px',
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  statsGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flex: '1',
    minWidth: '50px',
  },
  statIcon: {
    fontSize: '20px',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1f2937',
  },
};

export default Administration;