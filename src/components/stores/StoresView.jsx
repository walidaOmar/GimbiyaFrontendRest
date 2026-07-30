import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Clock, Plus } from 'lucide-react'
import { storeApi } from '../../api/index.js'
import StoresTable from './StoresTable.jsx'
import StoreDetailPanel from './StoreDetailPanel.jsx'
import PendingStoresList from './PendingStoresList.jsx'
import StoreOnboardingModal from './StoreOnboardingModal.jsx'

const TABS = [
  { id: 'verified', label: 'Verified Stores', icon: Building2 },
  { id: 'pending', label: 'Pending Requests', icon: Clock },
]

export default function StoresView() {
  const [activeTab, setActiveTab] = useState('verified')
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [showOnboardModal, setShowOnboardModal] = useState(false)

  const { data: storesData, isLoading } = useQuery({
    queryKey: ['stores', activeTab],
    queryFn: () => storeApi.list({ status: activeTab === 'verified' ? 'VERIFIED' : 'PENDING' }).then((r) => r.data),
    enabled: activeTab === 'verified',
  })

  if (selectedStoreId) {
    return <StoreDetailPanel storeId={selectedStoreId} onBack={() => setSelectedStoreId(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {TABS.map((tab) => (
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
        <button onClick={() => setShowOnboardModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 transition-all">
          <Plus className="w-4 h-4" /> Onboarding+
        </button>
      </div>

      {activeTab === 'verified' && (
        <StoresTable
          stores={storesData?.stores}
          onSelect={(store) => setSelectedStoreId(store._id)}
          loading={isLoading}
        />
      )}

      {activeTab === 'pending' && <PendingStoresList onSelect={(store) => setSelectedStoreId(store._id)} />}

      <StoreOnboardingModal isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)} />
    </div>
  )
}
