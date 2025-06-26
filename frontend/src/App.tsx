import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PDFProvider } from './contexts/PDFContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import PDFViewerPage from './pages/PDFViewerPage'

function App() {
  return (
    <PDFProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pdf/:id" element={<PDFViewerPage />} />
          </Routes>
        </Layout>
      </Router>
    </PDFProvider>
  )
}

export default App
