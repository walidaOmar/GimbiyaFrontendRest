import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, User, Mail, Phone, Shield, MapPin, Calendar, Copy, CheckCircle } from 'lucide-react'
import { userApi } from '../../api/index.js'
import toast from 'react-hot-toast'

export default function UserLookup() {
  const [userId, setUserId] = useState('')
  const [searchTriggered, setSearchTriggered] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-lookup', userId],
    queryFn: () => userApi.getById(userId).then((r) => r.data),
    enabled: searchTriggered && userId.length === 24,
    retry: false,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (userId.length !== 24) {
      toast.error('Please enter a valid 24-character user ID')
      return
    }
    setSearchTriggered(true)
  }

  const user = data?.user

  return (
    <div className="bg-surface-l border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-brass" />
        </div>
        <div>
          <h3 className="font-display font-bold text-text-p">User Lookup</h3>
          <p className="text-xs text-text-m">Retrieve any user by their public unique ID</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value)
            setSearchTriggered(false)
          }}
          placeholder="Paste user ID (e.g. 6a63e69d2477d7c9a0c30693)"
          className="flex-1 bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none font-mono"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Lookup'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 text-sm">
          User not found or you don\'t have permission to view this account.
        </div>
      )}

      {user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-midnight/40 rounded-xl border border-border">
            <div className="w-14 h-14 rounded-full bg-brass/10 flex items-center justify-center text-brass font-display text-xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h4 className="font-display text-lg font-bold text-text-p">{user.name}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </span>
                <span className="text-xs text-text-m capitalize">{user.role?.replace('_', ' ')}</span>
                <span className="text-xs text-text-m flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {user.kycStatus}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user._id)
                toast.success('User ID copied')
              }}
              className="p-2 hover:bg-surface-h rounded-lg transition-colors text-text-m"
              title="Copy User ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailItem icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
            <DetailItem icon={<Phone className="w-4 h-4" />} label="Phone" value={user.phone || '—'} />
            <DetailItem icon={<MapPin className="w-4 h-4" />} label="Assigned State" value={user.assignedState} />
            <DetailItem icon={<Calendar className="w-4 h-4" />} label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
            <DetailItem icon={<CheckCircle className="w-4 h-4" />} label="Verified" value={user.isVerified ? 'Yes' : 'No'} />
            <DetailItem icon={<User className="w-4 h-4" />} label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'} />
          </div>

          <div className="p-3 bg-midnight/30 rounded-lg border border-border">
            <p className="text-[10px] font-mono text-text-d uppercase tracking-wider mb-1">Public Unique ID</p>
            <p className="text-xs font-mono text-text-p break-all">{user._id}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="bg-midnight/30 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-text-d mb-1">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-text-p font-medium text-sm">{value}</p>
    </div>
  )
}
