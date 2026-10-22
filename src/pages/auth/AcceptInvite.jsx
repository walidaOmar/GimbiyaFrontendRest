import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { inviteApi } from '../../api/v21.js'
import { Button, Input, Spinner } from '../../components/ui/index.jsx'

export default function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirm: '', residentState: '' })
  const [saving, setSaving] = useState(false)

  const preview = useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => inviteApi.preview(token).then((response) => response.data.invite),
    retry: false,
  })

  const invite = preview.data
  const set = (key) => (event) => setForm((currentForm) => ({ ...currentForm, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { toast.error('The two passwords do not match'); return }
    setSaving(true)
    try {
      await inviteApi.accept(token, {
        name: form.name || invite.name,
        phone: form.phone,
        password: form.password,
        residentState: invite.needsResidence ? form.residentState : undefined,
      })
      toast.success('Account created. Please sign in.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not accept the invitation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {preview.isLoading && <div className="flex justify-center"><Spinner size={8} /></div>}

        {preview.isError && (
          <div className="card text-center">
            <h1 className="font-display text-2xl font-bold mb-2">Invitation not valid</h1>
            <p className="text-text-m text-sm mb-4">{preview.error?.response?.data?.message || 'This link is invalid, already used or expired. Ask the person who invited you for a new one.'}</p>
            <Link to="/login" className="btn btn-primary">Go to sign in</Link>
          </div>
        )}

        {invite && (
          <form onSubmit={submit} className="card space-y-4">
            <div>
              <p className="section-label mb-1">You are invited</p>
              <h1 className="font-display text-2xl font-bold">{invite.roleLabel}</h1>
              <p className="text-sm text-text-m mt-1">
                {invite.assignedState === 'Global' ? 'All markets' : `${invite.assignedState} · ${invite.stateName}`} · {invite.email}
              </p>
            </div>

            <Input label="Full name" required value={form.name || invite.name} onChange={set('name')} />
            <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />

            {invite.needsResidence && (
              <label className="block">
                <span className="input-label">Coordinators must live in {invite.stateName}. Which state do you live in?</span>
                <input className="input" value={form.residentState} onChange={set('residentState')} placeholder={invite.stateName} required />
              </label>
            )}

            <Input label="Password (8+ characters)" type="password" required autoComplete="new-password" value={form.password} onChange={set('password')} />
            <Input label="Confirm password" type="password" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />

            <Button type="submit" loading={saving} className="w-full">Create my account</Button>
          </form>
        )}
      </div>
    </div>
  )
}
