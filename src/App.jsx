import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home'
import Navbar from './components/Navbar/Navbar'
import { Test } from './pages/test'
import LedgerCreation from './pages/Ledgercreation/Ledgercreation'
import ItemCreation from './pages/ItemCreation/ItemCreation'
import LedgerGroupCreation from './pages/Ledgergroupcreation/Ledgergroupcreation'
import ItemGroupCreation from './pages/ItemGroupCreation/ItemGroupCreation'
function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="test" element={<Test />} />
          <Route path="/masters/ledger-creation" element={<LedgerCreation />} />
          <Route path="/masters/item-creation" element={<ItemCreation />} />
          <Route path="/masters/ledger-group-creation" element={<LedgerGroupCreation />} />
          <Route path="/masters/item-group-creation" element={<ItemGroupCreation />} />
        </Routes>
      </main>
    </div>
  )
}

export default App