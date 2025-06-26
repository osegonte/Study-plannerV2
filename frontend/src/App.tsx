import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PDFProvider } from './contexts/PDFContext'
import Layout from './components/layout/Layout'
import BasicHomePage from './pages/BasicHomePage'  // Changed from EnhancedHomePage
import BasicPDFViewerPage from './pages/BasicPDFViewerPage'  // Changed from EnhancedPDFViewerPage

function App() {
  return (
    <PDFProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<BasicHomePage />} />
            <Route path="/pdf/:id" element={<BasicPDFViewerPage />} />
          </Routes>
        </Layout>
      </Router>
    </PDFProvider>
  )
}

export default App