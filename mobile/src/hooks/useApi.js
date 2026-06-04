import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

export function useApi(path) {
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try    { setData(await api.get(path)) }
    catch  (err) { setError(err) }
    finally { setLoading(false) }
  }, [path])

  useEffect(() => { load() }, [load])

  return { data, error, loading, reload: load }
}
