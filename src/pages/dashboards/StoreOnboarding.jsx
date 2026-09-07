import { useNavigate } from 'react-router-dom'
import StoreOnboardingModal from '../../components/stores/StoreOnboardingModal.jsx'

export default function StoreOnboarding() {
  const navigate = useNavigate()

  return <StoreOnboardingModal isOpen onClose={() => navigate('/dashboard')} />
}
