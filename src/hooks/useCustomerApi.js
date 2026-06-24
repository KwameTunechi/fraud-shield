import { useEffect, useState, useCallback } from 'react'
import { customerApi } from '../api/customerClient'

export function useCustomerApi(path) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(!!path)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    if (!path) return
    setLoading(true)
    try {
      const result = await customerApi.get(path)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, reload: fetch }
}
