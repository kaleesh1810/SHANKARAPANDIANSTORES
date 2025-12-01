import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TestPage from '../pages/TestPage/TestPage';
import LedgerCreation from '../pages/Ledgercreation/Ledgercreation';
import ItemCreation from '../pages/ItemCreation/ItemCreation';
import LedgerGroupCreation from '../pages/Ledgergroupcreation/Ledgergroupcreation';
import ItemGroupCreation from '../pages/ItemGroupCreation/ItemGroupCreation';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<div>This is HOME page , use /test for testing</div>} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/ledger-creation" element={<LedgerCreation />} />
        <Route path="/item-creation" element={<ItemCreation />} />
        <Route path="/ledger-group-creation" element={<LedgerGroupCreation />} />
        <Route path="/item-group-creation" element={<ItemGroupCreation />} />
        {/* Add more routes here */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/products" element={<Products />} /> */}
        {/* <Route path="/settings" element={<Settings />} /> */}

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

const NotFound = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go back to home</a>
  </div>
);

export default AppRoutes;
