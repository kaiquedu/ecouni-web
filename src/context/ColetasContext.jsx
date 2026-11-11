import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { parseDate } from '../lib/format'

const ColetasContext = createContext(null)
const sort = (list) => [...list].sort((a, b) => parseDate(b.DataRegistro) - parseDate(a.DataRegistro))

export function ColetasProvider({ children }) {
  const [coletas, setColetas] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setStatus('loading')
    try {
      setColetas(sort((await api.listColetas()) || []))
      setError(null)
      setStatus('ready')
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const update = useCallback(async (c, payload) => {
    const updated = await api.updateColeta(c, payload)
    setColetas((list) => sort(list.map((x) => (x.Id === updated.Id ? updated : x))))
    return updated
  }, [])

  const remove = useCallback(async (c) => {
    await api.deleteColeta(c)
    setColetas((list) => list.filter((x) => x.Id !== c.Id))
  }, [])

  const dropUser = useCallback((id) => setColetas((list) => list.filter((x) => x.Cadastrarid !== id)), [])

  const value = useMemo(() => ({ coletas, status, error, reload, update, remove, dropUser }), [coletas, status, error, reload, update, remove, dropUser])
  return <ColetasContext.Provider value={value}>{children}</ColetasContext.Provider>
}

export const useColetas = () => useContext(ColetasContext)
