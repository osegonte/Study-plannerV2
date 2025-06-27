import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PDFProvider } from './contexts/PDFContext'
import Layout from './components/layout/Layout'
import BasicHomePage from './pages/BasicHomePage'
import SimplePDFViewerPage from './pages/SimplePDFViewerPage'

function App() {
  return (
    <PDFProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<BasicHomePage />} />
            <Route path="/pdf/:id" element={<SimplePDFViewerPage />} />
          </Routes>
        </Layout>
      </Router>
    </PDFProvider>
  )
}

export default App
