"use client"

import { useEffect, useState } from "react"

// This component will handle any client-side interactions
export function AboutInteractiveElements() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return <>{/* Move any interactive elements that use browser APIs here */}</>
}
