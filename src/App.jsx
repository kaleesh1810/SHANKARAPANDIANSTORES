import './App.css'
import AppRoutes from './routes/AppRoutes'
import LedgerCreation from './pages/Ledgercreation/Ledgercreation'
import ItemCreation from './pages/ItemCreation/ItemCreation'
import LedgerGroupCreation from './pages/Ledgergroupcreation/Ledgergroupcreation'
import ItemGroupCreation from './pages/ItemGroupCreation/ItemGroupCreation'
function App() {
  return (
    <div className="App">
      <ItemCreation />
    </div>
  )
}

export default App