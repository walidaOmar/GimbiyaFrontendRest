import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Building2, Clock, Plus } from 'lucide-react'
import { storeApi } from '../../api/index.js'
import { useAuthStore } from '../../store/authStore.js'
import StoresTable from './StoresTable.jsx'
import StoreDetailPanel from './StoreDetailPanel.jsx'
import CEOPendingStoreRequests from './CEOPendingStoreRequests.jsx'
import StoreOnboardingModal from './StoreOnboardingModal.jsx'

const TABS = [
  { id: 'verified', label: 'Verified Stores', icon: Building2 },
  { id: 'pending', label: 'Pending Requests', icon: Clock, roles: ['super_admin', 'ceo'] },
]

export default function StoresView() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const isCoordinator = user?.role === 'developer_coordinator'
  const tabs = TABS.filter((tab) => !tab.roles || tab.roles.includes(user?.role))
  const [activeTab, setActiveTab] = useState(() => location.pathname.endsWith('/hq/pending') ? 'pending' : 'verified')
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [showOnboardModal, setShowOnboardModal] = useState(false)

  useEffect(() => {
    setActiveTab(location.pathname.endsWith('/hq/pending') ? 'pending' : 'verified')
  }, [location.pathname])

  const { data: storesData, isLoading } = useQuery({
    queryKey: ['stores', activeTab],
    queryFn: () => storeApi.list({ status: 'VERIFIED' }).then((response) => response.data),
    enabled: activeTab === 'verified',
  })

  if (selectedStoreId) {
    return <StoreDetailPanel storeId={selectedStoreId} onBack={() => setSelectedStoreId(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedStoreId(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-brass/10 text-brass border border-brass/30'
                  : 'text-text-m hover:text-text-p hover:bg-surface-h border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        {isCoordinator && (
          <button onClick={() => setShowOnboardModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 transition-all">
            <Plus className="w-4 h-4" /> Request new store
          </button>
        )}
      </div>

      {activeTab === 'verified' && (
        <StoresTable
          stores={storesData?.stores}
          onSelect={(store) => setSelectedStoreId(store._id)}
          loading={isLoading}
        />
      )}

      {activeTab === 'pending' && <CEOPendingStoreRequests />}

      <StoreOnboardingModal isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)} />
    </div>
  )
}
