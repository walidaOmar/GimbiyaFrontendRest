import { Link } from 'react-router-dom'
import { Building2, Info } from 'lucide-react'
import { Card } from '../../components/ui/index.jsx'

export default function StaffOnboarding() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="section-label mb-1">Team access</p>
        <h1 className="font-display text-3xl font-bold">Staff Onboarding</h1>
      </div>
      <Card className="text-center py-10">
        <Info className="w-10 h-10 text-brass mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold">Staff are added through store requests</h2>
        <p className="text-sm text-text-m mt-2 max-w-md mx-auto">
          Propose managers, stock managers and riders when you submit a store request.
          Their accounts are created automatically once the CEO approves it.
        </p>
        <Link to="/dashboard/stores/onboard" className="btn btn-primary mt-6 inline-flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Submit a store request
        </Link>
      </Card>
    </div>
  )
}
