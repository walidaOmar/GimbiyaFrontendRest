import { useNavigate } from 'react-router-dom'
import StoreOnboardingModal from '../../components/stores/StoreOnboardingModal.jsx'
import { ROLE_ROUTES } from '../../context/AuthContext.jsx'
import { useAuthStore } from '../../store/authStore.js'

export default function StoreOnboarding() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  return (
    <StoreOnboardingModal
      isOpen
      onClose={() => navigate(ROLE_ROUTES[user?.role] || '/dashboard/mall')}
    />
  )
}
