import AffiliateWaiverPanel from '../../components/waivers/AffiliateWaiverPanel.jsx'
import CoordinatorWaiverPanel from '../../components/waivers/CoordinatorWaiverPanel.jsx'
import CEOQuotaPanel from '../../components/waivers/CEOQuotaPanel.jsx'
import { FulfillmentGroupsPanel } from '../../components/stores/FulfillmentGroupsPanel.jsx'
import StoresView from '../../components/stores/StoresView.jsx'
import UserLookup from '../../components/users/UserLookup.jsx'
import { PageHeader } from '../../components/ui/Polish.jsx'

export function AffiliateWaiverPage() {
  return <div><PageHeader eyebrow="Affiliate operations" title="Waiver requests" description="Request a waiver for 2–10 consumers by user ID. A coordinator approves and a 6-hour coupon is issued. The same consumer can be requested again after 96 hours." /><AffiliateWaiverPanel /></div>
}

export function CoordinatorWaiverPage() {
  return <div><PageHeader eyebrow="Regional operations" title="Waiver requests" description="Approve or reject requests from your affiliate officers. Approval draws down your quota." /><CoordinatorWaiverPanel /></div>
}

export function HqWaiverQuotaPage() {
  return <div><PageHeader eyebrow="Group HQ" title="Waiver quotas" description="Allocate waiver slots and budget to coordinators." /><CEOQuotaPanel /></div>
}

export function MerchantFulfillmentPage() {
  return <div><PageHeader eyebrow="Merchant" title="Fulfillment groups" description="Confirm your part of each order to lock escrow and release it for rider pickup." /><FulfillmentGroupsPanel /></div>
}

export function HqStoresPage() {
  return <div><PageHeader eyebrow="Group HQ" title="Stores" /><StoresView /></div>
}

export function HqUsersPage() {
  return <div><PageHeader eyebrow="Group HQ" title="Users" description="Look up any user by account ID." /><UserLookup /></div>
}
