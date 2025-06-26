import { useState, useEffect, useRef } from 'react'

export function useReadingTimer() {
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = () => {
    const now = new Date()
    setStartTime(now)
    setIsRunning(true)
    setElapsedTime(0)
  }

  const stopTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return elapsedTime
  }

  const resetTimer = () => {
    setStartTime(null)
    setIsRunning(false)
    setElapsedTime(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime())
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, startTime])

  return {
    startTimer,
    stopTimer,
    resetTimer,
    isRunning,
    elapsedTime,
    formattedTime: formatTime(elapsedTime)
  }
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
