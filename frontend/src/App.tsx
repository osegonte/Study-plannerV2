import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PDFProvider } from './contexts/PDFContext'
import Layout from './components/layout/Layout'
import EnhancedHomePage from './pages/EnhancedHomePage'
import EnhancedPDFViewerPage from './pages/EnhancedPDFViewerPage'

function App() {
  return (
    <PDFProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<EnhancedHomePage />} />
            <Route path="/pdf/:id" element={<EnhancedPDFViewerPage />} />
          </Routes>
        </Layout>
      </Router>
    </PDFProvider>
  )
}

export default App