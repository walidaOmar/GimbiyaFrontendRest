import { useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, UserPlus } from 'lucide-react'
import { userApi } from '../../api/index.js'
import { Badge, Button, Card, Input, Select } from '../../components/ui/index.jsx'
import { STATE_OPTIONS } from '../../config/regions.js'
import { STAFF_ROLES } from '../../config/businessClassification.js'
import { useAuthStore } from '../../store/authStore.js'

export default function StaffOnboarding() {
  const user = useAuthStore((state) => state.user)
  const allowedRoles = STAFF_ROLES.filter((item) => item.creators.includes(user?.role))
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: allowedRoles[0]?.value || '', assignedState: user?.role === 'developer_coordinator' ? user.assignedState : '', onboardingNotes: '' })
  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const submit = async (event) => { event.preventDefault(); setLoading(true); try { await userApi.onboardStaff(form); setDone(true); toast.success('Staff onboarding submitted.') } catch (error) { toast.error(error.response?.data?.message || 'Staff onboarding failed') } finally { setLoading(false) } }
  if (done) return <Card className="max-w-xl mx-auto text-center py-12"><CheckCircle className="w-12 h-12 text-success mx-auto mb-4" /><h1 className="font-display text-2xl font-bold">Staff member submitted</h1><p className="text-text-m mt-2 mb-6">The account is now awaiting the backend verification workflow.</p><Button onClick={() => { setDone(false); setForm({ name: '', email: '', phone: '', role: allowedRoles[0]?.value || '', assignedState: user?.role === 'developer_coordinator' ? user.assignedState : '', onboardingNotes: '' }) }}>Add another</Button></Card>
  return <div className="space-y-6 max-w-3xl"><div><p className="section-label mb-1">Team access</p><h1 className="font-display text-3xl font-bold">Staff Onboarding</h1><p className="text-sm text-text-m mt-2">Create a role-aware staff account within your permission scope.</p></div><Card><form onSubmit={submit} className="grid sm:grid-cols-2 gap-4"><Input label="Full name" required value={form.name} onChange={setField('name')} placeholder="Full name" /><Input label="Email" required type="email" value={form.email} onChange={setField('email')} placeholder="name@example.com" /><Input label="Phone" value={form.phone} onChange={setField('phone')} placeholder="+234..." /><Select label="Role" value={form.role} onChange={setField('role')} options={allowedRoles.map((item) => ({ value: item.value, label: item.label }))} /><Select label="Assigned state" required={!user?.assignedState} disabled={Boolean(user?.assignedState)} value={form.assignedState} onChange={setField('assignedState')} options={[{ value: '', label: user?.assignedState ? user.assignedState : 'Select a state' }, ...STATE_OPTIONS]} /><div className="sm:col-span-2"><label className="input-label">Onboarding notes</label><textarea value={form.onboardingNotes} onChange={setField('onboardingNotes')} rows={4} className="input w-full resize-none" placeholder="Context for verification or assignment" /></div><div className="sm:col-span-2 flex items-center justify-between border-t border-border pt-4"><Badge color="muted"><UserPlus className="w-3 h-3 inline mr-1" /> Creator: {user?.role}</Badge><Button type="submit" loading={loading}>Submit staff member</Button></div></form></Card></div>
}
