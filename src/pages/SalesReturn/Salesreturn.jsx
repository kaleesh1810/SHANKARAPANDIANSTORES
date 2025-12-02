import React, { useEffect, useRef, useState } from "react";

/**
 * SalesReturn component
 * UI FIXED:
 * - Removed top gap
 * - Removed "Sales Return" title
 * - Centered Clear & Save buttons
 * - Added spacing above footer
 * NO LOGIC CHANGES
 */
export default function SalesReturn() {
  // ---------- Mock product database ----------
  const productDB = {
    "123456": {
      itemName: "Fauget Cafe",
      stock: 500,
      mrp: 500,
      uom: "pcs",
      hsn: "ASW090",
      tax: 21,
      srate: 2000000,
    },
    "111222": {
      itemName: "Coffee Beans 1kg",
      stock: 120,
      mrp: 1200,
      uom: "kg",
      hsn: "CB1001",
      tax: 12,
      srate: 1100,
    },
    "999888": {
      itemName: "Chocolate Bar",
      stock: 1000,
      mrp: 50,
      uom: "pcs",
      hsn: "CHOC01",
      tax: 18,
      srate: 45,
    },
  };

  // ---------- State ----------
  const [form, setForm] = useState({
    billNo: "",
    mobile: "",
    mode: "Retail",
    barcode: "",
    billDate: "",
    customer: "",
    salesman: "",
  });

  const [rows, setRows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [toast, setToast] = useState(null);

  const barcodeRef = useRef(null);

  // ---------- Helpers ----------
  const showToast = (msg, ms = 1600) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const beep = (freq = 800, duration = 120) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      setTimeout(() => {
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01);
        o.stop(ctx.currentTime + 0.02);
        try {
          ctx.close();
        } catch {}
      }, duration);
    } catch {}
  };

  const updateField = (field, value) =>
    setForm((s) => ({ ...s, [field]: value }));

  const calcAmount = (row) => {
    const s = Number(row.srate) || 0;
    const q = Number(row.qty) || 0;
    return s * q;
  };

  // ---------- Row operations ----------
  const addRowByBarcode = (barcode) => {
    if (!barcode || barcode.trim() === "") {
      showToast("Empty barcode");
      return;
    }

    const product = productDB[barcode];
    const newRow = {
      id: nextId,
      barcode,
      itemName: product ? product.itemName : "Unknown Item",
      stock: product ? product.stock : 0,
      mrp: product ? product.mrp : 0,
      uom: product ? product.uom : "",
      hsn: product ? product.hsn : "",
      tax: product ? product.tax : 0,
      srate: product ? product.srate : 0,
      qty: 1,
      amount: product ? product.srate : 0,
    };

    setRows((r) => [...r, newRow]);
    setNextId((n) => n + 1);
    setSelectedRowId(newRow.id);
    showToast("Item added");
    beep();
  };

  const handleBarcodeKey = (e) => {
    if (e.key === "Enter") {
      addRowByBarcode(form.barcode.trim());
      updateField("barcode", "");
    }
  };

  const editCell = (id, field, rawValue) => {
    const value =
      field === "qty" || field === "srate" ? Number(rawValue) : rawValue;
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        updated.amount = calcAmount(updated);
        return updated;
      })
    );
  };

  const deleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (selectedRowId === id) setSelectedRowId(null);
  };

  const clearAll = () => {
    setForm({
      billNo: "",
      mobile: "",
      mode: "Retail",
      barcode: "",
      billDate: "",
      customer: "",
      salesman: "",
    });
    setRows([]);
    setNextId(1);
    setSelectedRowId(null);
    showToast("Cleared");
  };

  const saveData = () => {
    const payload = { form, rows, total: rows.reduce((s, r) => s + r.amount, 0) };
    console.log("Saving payload: ", payload);
    showToast("Saved");
  };

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "F2") {
        ev.preventDefault();
        barcodeRef.current?.focus();
        showToast("Focus: Barcode");
      }

      if (ev.key === "F3") {
        ev.preventDefault();
        if (selectedRowId != null) {
          deleteRow(selectedRowId);
          showToast("Deleted row " + selectedRowId);
        }
      }

      if (ev.key === "F4") {
        ev.preventDefault();
        saveData();
      }

      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        saveData();
      }

      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "p") {
        ev.preventDefault();
        window.print();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedRowId, rows]);

  const netTotal = rows.reduce((s, r) => s + (r.amount || 0), 0);

  // ---------- UI FIXED STYLES ----------
  const styles = {
    page: {
      width: "100%",
      minHeight: "100vh",
      background: "#fff",
      fontFamily: "Arial, Helvetica, sans-serif",
    },

    /** TOP BAR FIXED — REMOVED SALES RETURN TEXT */
    topBar: {
      background: "linear-gradient(90deg,#1784e4,#0b68c6)",
      color: "#fff",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      fontWeight: 700,
    },

    formSection: {
      background: "linear-gradient(90deg,#1784e4,#0b68c6)",
      padding: 18,
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      color: "#fff",
    },

    labelBox: {
      display: "flex",
      flexDirection: "column",
      width: 200,
      fontWeight: 600,
    },

    input: {
      height: 34,
      borderRadius: 6,
      border: "1px solid #999",
      padding: "6px 8px",
      marginTop: 6,
      background: "#fff",
      color: "#000",
      fontSize: 14,
    },

    select: {
      height: 36,
      borderRadius: 6,
      border: "1px solid #999",
      padding: "6px 8px",
      marginTop: 6,
      background: "#fff",
      color: "#000",
    },

    buttonsRow: {
      marginLeft: "auto",
      display: "flex",
      gap: 10,
    },

    btn: {
      background: "#0b68c6",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
    },

    tableWrap: {
      padding: 18,
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
    },

    th: {
      background: "#1784e4",
      color: "#fff",
      padding: "10px 8px",
      borderRight: "1px solid #eee",
    },

    td: {
      padding: "10px 8px",
      borderBottom: "1px solid #eee",
    },

    tdInput: {
      width: "100%",
      padding: "6px 8px",
      borderRadius: 6,
      border: "1px solid #bbb",
    },

    /** FOOTER FIX — NET LEFT, BUTTONS RIGHT WITH MIDDLE GAP */
    footer: {
      marginTop: 40,
      padding: "30px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 20,
    },

    netBox: {
      background: "linear-gradient(90deg,#1fb0ff,#1784e4)",
      color: "#fff",
      padding: "12px 30px",
      borderRadius: 10,
      fontSize: 20,
      fontWeight: 700,
    },

    buttonContainer: {
      display: "flex",
      gap: 25,
    },

    toast: {
      position: "fixed",
      right: 20,
      bottom: 20,
      background: "#222",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: 8,
    },
  };

  // ---------- Render ----------
  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>{netTotal}</div>
      </div>

      <div style={styles.formSection}>
        <div style={styles.labelBox}>
          Bill No
          <input
            style={styles.input}
            value={form.billNo}
            onChange={(e) => updateField("billNo", e.target.value)}
            placeholder="Bill No"
          />
        </div>

        <div style={styles.labelBox}>
          Mobile No
          <input
            style={styles.input}
            value={form.mobile}
            onChange={(e) => updateField("mobile", e.target.value)}
            placeholder="Mobile No"
          />
        </div>

        <div style={styles.labelBox}>
          Mode
          <select
            style={styles.select}
            value={form.mode}
            onChange={(e) => updateField("mode", e.target.value)}
          >
            <option>Retail</option>
            <option>Wholesale</option>
          </select>
        </div>

        <div style={styles.labelBox}>
          Barcode
          <input
            ref={barcodeRef}
            style={styles.input}
            value={form.barcode}
            onChange={(e) => updateField("barcode", e.target.value)}
            onKeyDown={handleBarcodeKey}
            placeholder="Scan or type barcode"
          />
        </div>

        <div style={styles.labelBox}>
          Bill Date
          <input
            style={styles.input}
            value={form.billDate}
            onChange={(e) => updateField("billDate", e.target.value)}
            placeholder="DD/MM/YYYY"
          />
        </div>

        <div style={styles.labelBox}>
          Customer Name
          <input
            style={styles.input}
            value={form.customer}
            onChange={(e) => updateField("customer", e.target.value)}
            placeholder="Customer Name"
          />
        </div>

        <div style={styles.labelBox}>
          Salesman
          <input
            style={styles.input}
            value={form.salesman}
            onChange={(e) => updateField("salesman", e.target.value)}
            placeholder="Salesman"
          />
        </div>

        <div style={styles.buttonsRow}>
          <button style={styles.btn}>➕ Add</button>
          <button style={styles.btn}>✏️ Edit</button>
          <button
            style={styles.btn}
            onClick={() => {
              if (selectedRowId != null) deleteRow(selectedRowId);
            }}
          >
            🗑 Delete
          </button>
          <button style={styles.btn} onClick={() => window.print()}>
            🖨 Print
          </button>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {[
                "S.NO",
                "Barcode",
                "Item Name",
                "Stock",
                "MRP",
                "UOM",
                "HSN",
                "Tax",
                "S Rate",
                "Qty",
                "Amount",
                "Action",
              ].map((h) => (
                <th key={h} style={styles.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={12}>
                  No items — scan barcode.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedRowId(r.id)}
                  style={selectedRowId === r.id ? styles.selectedRow : {}}
                >
                  <td style={styles.td}>{r.id}</td>
                  <td style={styles.td}>{r.barcode}</td>
                  <td style={styles.td}>{r.itemName}</td>
                  <td style={styles.td}>{r.stock}</td>
                  <td style={styles.td}>{r.mrp}</td>
                  <td style={styles.td}>{r.uom}</td>
                  <td style={styles.td}>{r.hsn}</td>
                  <td style={styles.td}>{r.tax}</td>

                  <td style={styles.td}>
                    <input
                      style={styles.tdInput}
                      value={r.srate}
                      onChange={(e) => editCell(r.id, "srate", e.target.value)}
                    />
                  </td>

                  <td style={styles.td}>
                    <input
                      style={styles.tdInput}
                      value={r.qty}
                      onChange={(e) => editCell(r.id, "qty", e.target.value)}
                    />
                  </td>

                  <td style={styles.td}>{r.amount}</td>

                  <td style={styles.td}>
                    <button
                      style={styles.btn}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        deleteRow(r.id);
                      }}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.footer}>
        <div style={styles.netBox}>Net: {netTotal}</div>

        <div style={styles.buttonContainer}>
          <button style={styles.btn} onClick={clearAll}>
            ❌ Clear
          </button>

          <button style={styles.btn} onClick={saveData}>
            💾 Save
          </button>
        </div>
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}