import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyRound, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { Avatar, Button, Dialog, EmptyState, ErrorState, Field, IconButton, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useColetas } from '../context/ColetasContext'
import { useConfirm, useToast } from '../context/UiContext'
import { api } from '../lib/api'
import { formatLitros, formatRelative, isValidEmail, isValidPhone, maskPhone } from '../lib/format'

export default function Usuarios() {
  const { user } = useAuth()
  const { dropUser } = useColetas()
  const toast = useToast()
  const confirm = useConfirm()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try {
      setUsers(await api.listUsuarios())
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    let alive = true
    api
      .listUsuarios()
      .then((u) => alive && setUsers(u))
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])

  const del = async (u) => {
    const ok = await confirm({
      title: `Excluir ${u.Nome}?`,
      message: u.Coletas ? `A conta e as ${u.Coletas} coletas registradas por essa pessoa serão apagadas. Essa ação não pode ser desfeita.` : 'A conta será apagada. Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir usuário',
      destructive: true,
    })
    if (!ok) return
    try {
      await api.deleteUsuario(u.Cadastrarid)
      setUsers((list) => list.filter((x) => x.Cadastrarid !== u.Cadastrarid))
      dropUser(u.Cadastrarid)
      toast(`${u.Nome} foi excluído.`)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (users || []).filter((u) => !s || u.Nome.toLowerCase().includes(s) || u.Email.toLowerCase().includes(s))
  }, [users, q])
  const ativos = (users || []).filter((u) => u.Coletas > 0).length

  return (
    <>
      <header className="ph">
        <div>
          <h1>Usuários</h1>
          <p>{users ? `${users.length} ${users.length === 1 ? 'conta' : 'contas'}, ${ativos} com coletas registradas` : 'Quem tem acesso ao app EcoUni'}</p>
        </div>
        <Button icon={UserPlus} onClick={() => setCreating(true)}>
          Cadastrar usuário
        </Button>
      </header>

      <div className="card">
        <div className="toolbar">
          <Field small icon={Search} placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar usuários" />
        </div>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !users ? (
          <div style={{ display: 'grid', gap: 12, padding: 20 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} h={36} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={Users} title={users.length ? 'Ninguém encontrado' : 'Nenhum usuário'} message={users.length ? 'Tente outro nome ou e-mail.' : 'Cadastre o primeiro colaborador para ele usar o app.'} />
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Perfil</th>
                  <th className="r">Coletas</th>
                  <th className="r">Volume</th>
                  <th>Última coleta</th>
                  <th style={{ width: 56 }}>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.Cadastrarid}>
                    <td>
                      <div className="who">
                        <Avatar name={u.Nome} dark={u.IsAdmin} />
                        <div style={{ minWidth: 0 }}>
                          <b>{u.Nome}</b>
                          <span>{u.Email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num muted" style={{ whiteSpace: 'nowrap' }}>
                      {maskPhone(u.Telefone)}
                    </td>
                    <td>
                      <span className={`pill${u.IsAdmin ? ' brand' : ''}`}>{u.IsAdmin ? 'Administrador' : 'Colaborador'}</span>
                    </td>
                    <td className="num r">{u.Coletas}</td>
                    <td className="num r" style={{ fontWeight: 600 }}>
                      {formatLitros(u.Litros)}
                    </td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {u.UltimaColeta ? formatRelative(u.UltimaColeta) : 'Nunca'}
                    </td>
                    <td>
                      <div className="row-acts">{u.IsAdmin || u.Cadastrarid === user?.Cadastrarid ? null : <IconButton icon={Trash2} danger label={`Excluir ${u.Nome}`} onClick={() => del(u)} />}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating ? (
        <NovoUsuario
          onClose={() => setCreating(false)}
          onCreated={(nome) => {
            setCreating(false)
            toast(`${nome} foi cadastrado.`)
            load()
          }}
        />
      ) : null}
    </>
  )
}

function NovoUsuario({ onClose, onCreated }) {
  const [form, setForm] = useState({ Nome: '', Email: '', Telefone: '', Senha: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const validate = (f = form) => {
    const e = {}
    if (f.Nome.trim().split(/\s+/).length < 2) e.Nome = 'Informe nome e sobrenome.'
    if (!isValidEmail(f.Email)) e.Email = 'Digite um e-mail válido, como nome@ecouni.dev.'
    if (!isValidPhone(f.Telefone)) e.Telefone = 'Digite um telefone com DDD, como (11) 90000-0000.'
    if (f.Senha.length < 8) e.Senha = 'A senha inicial precisa ter 8 ou mais caracteres.'
    return e
  }
  const blur = (k) => form[k] && setErrors((e) => ({ ...e, [k]: validate()[k] }))
  const set = (k) => (e) => {
    const v = k === 'Telefone' ? maskPhone(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length || saving) return
    setSaving(true)
    try {
      await api.createUsuario({ Nome: form.Nome.trim(), Email: form.Email.trim(), Telefone: form.Telefone, Senha: form.Senha, ConfirmarSenha: form.Senha })
      onCreated(form.Nome.trim().split(' ')[0])
    } catch (err) {
      if (err.status === 409) setErrors((x) => ({ ...x, Email: 'Já existe uma conta com este e-mail.' }))
      else setErrors((x) => ({ ...x, form: err.message }))
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title="Novo usuário" lead="A pessoa entra no app como colaborador.">
      <form onSubmit={submit} noValidate>
        <div className="stack">
          <Field label="Nome completo" placeholder="Nome e sobrenome" value={form.Nome} onChange={set('Nome')} onBlur={() => blur('Nome')} error={errors.Nome} autoComplete="off" />
          <Field label="E-mail institucional" type="email" inputMode="email" placeholder="nome@ecouni.dev" value={form.Email} onChange={set('Email')} onBlur={() => blur('Email')} error={errors.Email} autoComplete="off" />
          <Field label="Telefone" type="tel" inputMode="tel" placeholder="(11) 90000-0000" value={form.Telefone} onChange={set('Telefone')} onBlur={() => blur('Telefone')} error={errors.Telefone} />
          <Field label="Senha inicial" type="password" placeholder="Mínimo de 8 caracteres" value={form.Senha} onChange={set('Senha')} onBlur={() => blur('Senha')} error={errors.Senha} autoComplete="new-password" />
          <div className="note">
            <KeyRound size={17} aria-hidden />
            <span>A pessoa pode trocar essa senha depois, em Conta, no app.</span>
          </div>
          {errors.form ? (
            <p className="err" role="alert">
              {errors.form}
            </p>
          ) : null}
        </div>
        <div className="df">
          <Button variant="s" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Cadastrar usuário
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
