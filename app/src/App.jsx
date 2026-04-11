import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import Food from './pages/Food'
import Data from './pages/Data'
import Connectors from './pages/Connectors'
import Settings from './pages/Settings'
import Recommendations from './pages/Recommendations'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="food" element={<Food />} />
          <Route path="data" element={<Data />} />
          <Route path="connectors" element={<Connectors />} />
          <Route path="settings" element={<Settings />} />
          <Route path="recommendations" element={<Recommendations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
