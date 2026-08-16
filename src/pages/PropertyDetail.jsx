import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { propertyApi } from '../api/index.js'
import { useAuthStore } from '../store/authStore.js'
import { Button, Badge, Card, Input, Spinner } from '../components/ui/index.jsx'
import {
  MapPin, BedDouble, Bath, Maximize, Car, Home, Briefcase, LandPlot, Factory,
  Calendar, Phone, Mail, User, ArrowLeft, Share2, Heart, MessageSquare, CheckCircle2,
} from 'lucide-react'
import { formatNaira } from '../utils/index.js'
import toast from 'react-hot-toast'

const PROPERTY_TYPE_ICONS = {
  residential: Home,
  commercial: Briefcase,
  land: LandPlot,
  industrial: Factory,
}

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inquiryForm, setInquiryForm] = useState({ buyerPhone: '', buyerBudgetKobo: '', buyerMessage: '' })
  const [inquiryLoading, setInquiryLoading] = useState(false)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const { data } = await propertyApi.getById(id)
      setProperty(data.property || data)
    } catch (err) {
      toast.error('Property not found')
      navigate('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperty()
  }, [id])

  const handleInquiry = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please log in to inquire')
      navigate('/login', { state: { from: `/properties/${id}` } })
      return
    }
    if (user.role !== 'buyer') {
      toast.error('Only buyers can submit inquiries')
      return
    }

    try {
      setInquiryLoading(true)
      await propertyApi.createInquiry(id, {
        buyerPhone: inquiryForm.buyerPhone,
        buyerBudgetKobo: inquiryForm.buyerBudgetKobo ? Number(inquiryForm.buyerBudgetKobo) * 100 : null,
        buyerMessage: inquiryForm.buyerMessage,
      })
      toast.success('Inquiry sent! The property manager will contact you.')
      setShowInquiryForm(false)
      setInquiryForm({ buyerPhone: '', buyerBudgetKobo: '', buyerMessage: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Inquiry failed')
    } finally {
      setInquiryLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-midnight flex items-center justify-center"><Spinner size={12} /></div>
  }

  if (!property) return null

  const Icon = PROPERTY_TYPE_ICONS[property.propertyType] || Home
  const images = property.imageUrls?.length ? property.imageUrls : []

  return (
    <div className="min-h-screen bg-midnight text-text-p">
      <div className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/marketplace')} className="flex items-center gap-2 text-text-m hover:text-text-p transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </button>
          <div className="flex gap-2">
            <button className="p-2 rounded-btn bg-surface-h hover:bg-surface transition-colors"><Share2 className="w-4 h-4" /></button>
            <button className="p-2 rounded-btn bg-surface-h hover:bg-surface transition-colors"><Heart className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-card overflow-hidden bg-surface-h">
              {images.length > 0 ? (
                <>
                  <div className="h-96 relative">
                    <img src={images[currentImage]} alt={property.title} className="w-full h-full object-cover" />
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-midnight/50 rounded-full hover:bg-midnight/70"><ArrowLeft className="w-5 h-5" /></button>
                        <button onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-midnight/50 rounded-full hover:bg-midnight/70 rotate-180"><ArrowLeft className="w-5 h-5" /></button>
                      </>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {images.map((img, idx) => (
                        <button key={idx} onClick={() => setCurrentImage(idx)} className={`flex-shrink-0 w-20 h-20 rounded-btn overflow-hidden border-2 ${currentImage === idx ? 'border-brass' : 'border-transparent'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-96 flex items-center justify-center bg-brass/10"><Icon className="w-24 h-24 text-brass opacity-30" /></div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Badge color="muted">{property.propertyType}</Badge>
                <Badge color="green">{property.listingType}</Badge>
                {property.verificationStatus === 'verified' && (
                  <Badge color="green" className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold text-text-p mb-2">{property.title}</h1>
              <p className="text-text-m flex items-center gap-2 mb-4"><MapPin className="w-4 h-4" /> {property.address}, {property.city}, {property.state}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.bedrooms !== null && (
                  <Card className="p-4 text-center">
                    <BedDouble className="w-6 h-6 text-brass mx-auto mb-2" />
                    <p className="text-lg font-bold text-text-p">{property.bedrooms}</p>
                    <p className="font-mono text-[10px] text-text-m uppercase tracking-wider">Bedrooms</p>
                  </Card>
                )}
                {property.bathrooms !== null && (
                  <Card className="p-4 text-center">
                    <Bath className="w-6 h-6 text-brass mx-auto mb-2" />
                    <p className="text-lg font-bold text-text-p">{property.bathrooms}</p>
                    <p className="font-mono text-[10px] text-text-m uppercase tracking-wider">Bathrooms</p>
                  </Card>
                )}
                {property.squareMeters !== null && (
                  <Card className="p-4 text-center">
                    <Maximize className="w-6 h-6 text-brass mx-auto mb-2" />
                    <p className="text-lg font-bold text-text-p">{property.squareMeters}</p>
                    <p className="font-mono text-[10px] text-text-m uppercase tracking-wider">Sq Meters</p>
                  </Card>
                )}
                {property.parkingSpaces !== null && (
                  <Card className="p-4 text-center">
                    <Car className="w-6 h-6 text-brass mx-auto mb-2" />
                    <p className="text-lg font-bold text-text-p">{property.parkingSpaces}</p>
                    <p className="font-mono text-[10px] text-text-m uppercase tracking-wider">Parking</p>
                  </Card>
                )}
              </div>

              <Card className="p-5 mb-6">
                <h3 className="font-display text-xl font-bold text-text-p mb-3">Description</h3>
                <p className="text-text-m leading-relaxed">{property.description || 'No description provided.'}</p>
              </Card>

              {property.amenities?.length > 0 && (
                <Card className="p-5 mb-6">
                  <h3 className="font-display text-xl font-bold text-text-p mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span key={a} className="px-3 py-1 rounded-full bg-brass/10 text-brass text-sm">{a}</span>
                    ))}
                  </div>
                </Card>
              )}

              {property.documentUrls?.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-display text-xl font-bold text-text-p mb-3">Documents</h3>
                  <div className="space-y-2">
                    {property.documentUrls.map((doc, idx) => (
                      <a key={idx} href={doc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brass hover:underline text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Document {idx + 1}
                      </a>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 sticky top-6">
              <p className="font-mono text-[10px] text-text-m uppercase tracking-wider mb-1">Price</p>
              <p className="text-3xl font-bold text-brass mb-2">{formatNaira((property.priceKobo || 0) / 100)}</p>
              {property.priceNegotiable && <p className="text-sm text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Price is negotiable</p>}

              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-3 text-sm text-text-m"><User className="w-4 h-4" /><span>{property.propertyAdminId?.name || 'Property Manager'}</span></div>
                <div className="flex items-center gap-3 text-sm text-text-m"><Phone className="w-4 h-4" /><span>{property.propertyAdminId?.phone || 'Contact via inquiry'}</span></div>
                <div className="flex items-center gap-3 text-sm text-text-m"><Mail className="w-4 h-4" /><span>{property.propertyAdminId?.email || 'N/A'}</span></div>
                <div className="flex items-center gap-3 text-sm text-text-m"><Calendar className="w-4 h-4" /><span>Listed {new Date(property.createdAt).toLocaleDateString()}</span></div>
              </div>

              <div className="mt-6 space-y-3">
                {!showInquiryForm ? (
                  <Button className="w-full py-3 text-lg" onClick={() => setShowInquiryForm(true)}>
                    <MessageSquare className="w-5 h-5 mr-2" /> Send Inquiry
                  </Button>
                ) : (
                  <form onSubmit={handleInquiry} className="space-y-3">
                    <Input placeholder="Your phone number" value={inquiryForm.buyerPhone} onChange={(e) => setInquiryForm({ ...inquiryForm, buyerPhone: e.target.value })} className="bg-midnight border-border" />
                    <Input type="number" placeholder="Your budget (₦)" value={inquiryForm.buyerBudgetKobo} onChange={(e) => setInquiryForm({ ...inquiryForm, buyerBudgetKobo: e.target.value })} className="bg-midnight border-border" />
                    <textarea placeholder="Message to the property manager..." value={inquiryForm.buyerMessage} onChange={(e) => setInquiryForm({ ...inquiryForm, buyerMessage: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-btn bg-midnight border border-border text-text-p text-sm focus:border-brass focus:outline-none resize-none" />
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={inquiryLoading}>{inquiryLoading ? 'Sending...' : 'Submit Inquiry'}</Button>
                      <Button type="button" variant="secondary" onClick={() => setShowInquiryForm(false)}>Cancel</Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between text-sm text-text-m">
                <span>{property.viewCount} views</span>
                <span>{property.inquiryCount} inquiries</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
