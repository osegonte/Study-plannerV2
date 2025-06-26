import React, { createContext, useContext, useReducer, ReactNode } from 'react'

interface PDFState {
  currentPDF: any | null
  readingTimes: Record<string, number[]>
  totalPages: number
  currentPage: number
}

interface PDFAction {
  type: string
  payload?: any
}

interface PDFContextType {
  state: PDFState
  dispatch: React.Dispatch<PDFAction>
}

const PDFContext = createContext<PDFContextType | undefined>(undefined)

const initialState: PDFState = {
  currentPDF: null,
  readingTimes: {},
  totalPages: 0,
  currentPage: 1,
}

function pdfReducer(state: PDFState, action: PDFAction): PDFState {
  switch (action.type) {
    case 'SET_PDF':
      return { ...state, currentPDF: action.payload }
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload }
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload }
    case 'ADD_READING_TIME':
      return {
        ...state,
        readingTimes: {
          ...state.readingTimes,
          [action.payload.page]: [
            ...(state.readingTimes[action.payload.page] || []),
            action.payload.time,
          ],
        },
      }
    default:
      return state
  }
}

export function PDFProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pdfReducer, initialState)

  return (
    <PDFContext.Provider value={{ state, dispatch }}>
      {children}
    </PDFContext.Provider>
  )
}

export function usePDF() {
  const context = useContext(PDFContext)
  if (context === undefined) {
    throw new Error('usePDF must be used within a PDFProvider')
  }
  return context
}
