const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

let token = null
let onUnauthorized = null

export const setToken = (t) => {
  token = t
}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

const FRIENDLY = {
  0: 'Não foi possível conectar à API. Confira se ela está rodando em ' + API_URL + '.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Seu perfil não tem acesso a esta ação.',
  404: 'Não encontramos o que você procurava.',
  429: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
  500: 'Erro no servidor. Tente novamente em instantes.',
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError(FRIENDLY[0], 0)
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    if (res.status === 401 && auth && onUnauthorized) onUnauthorized()
    throw new ApiError(data?.message || FRIENDLY[res.status] || FRIENDLY[500], res.status)
  }
  return data
}

export const api = {
  login: (Email, Senha) => request('/api/auth/login', { method: 'POST', body: { Email, Senha }, auth: false }),
  listColetas: () => request('/api/coleta/ObterTodasColetas'),
  updateColeta: (c, payload) => request(`/api/coleta/EditarColeta/${c.Cadastrarid}/${c.Id}`, { method: 'PUT', body: payload }),
  deleteColeta: (c) => request(`/api/coleta/DeletarColeta/${c.Cadastrarid}/${c.Id}`, { method: 'DELETE' }),
  listUsuarios: () => request('/api/usuarios'),
  createUsuario: (payload) => request('/api/auth/registro', { method: 'POST', body: payload }),
  deleteUsuario: (id) => request(`/api/usuarios/${id}`, { method: 'DELETE' }),
}
