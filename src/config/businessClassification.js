// The backend remains the source of truth. This tree only drives the cascading UI.
export const BUSINESS_CLASSIFICATION = [
  { value: 'retail', label: 'Retail', businessType: 'retailer', marketTier: 'consumer', categories: [
    { value: 'food_grocery', label: 'Food & Grocery Retail', subcategories: ['Supermarkets', 'Specialty Grocers', 'Convenience Stores', 'Fresh Produce', 'Packaged Foods'] },
    { value: 'fashion', label: 'Fashion & Apparel', subcategories: ['Clothing', 'Footwear', 'Accessories', 'Tailoring', 'Sportswear'] },
    { value: 'beauty', label: 'Beauty & Personal Care', subcategories: ['Cosmetics', 'Skincare', 'Haircare', 'Barbering', 'Fragrance'] },
    { value: 'electronics', label: 'Electronics & Technology', subcategories: ['Mobile Devices', 'Computers', 'Home Electronics', 'Accessories', 'Repairs'] },
    { value: 'home_lifestyle', label: 'Home & Lifestyle', subcategories: ['Furniture', 'Home Decor', 'Kitchenware', 'Bedding', 'Household Goods'] },
  ] },
  { value: 'wholesale', label: 'Wholesale', businessType: 'wholesaler', marketTier: 'wholesale', categories: [
    { value: 'consumer_goods', label: 'Consumer Goods Wholesale', subcategories: ['Food Distribution', 'Household Supplies', 'Personal Care', 'General Merchandise', 'Import Distribution'] },
    { value: 'fashion_distribution', label: 'Fashion Distribution', subcategories: ['Textiles', 'Ready-to-Wear', 'Footwear', 'Accessories', 'Uniforms'] },
    { value: 'building_materials', label: 'Building Materials', subcategories: ['Cement & Aggregates', 'Finishes', 'Plumbing', 'Electrical', 'Hardware'] },
    { value: 'agricultural_inputs', label: 'Agricultural Inputs', subcategories: ['Seeds', 'Fertilizer', 'Farm Tools', 'Animal Feed', 'Irrigation'] },
    { value: 'industrial_supplies', label: 'Industrial Supplies', subcategories: ['Packaging', 'Safety Equipment', 'Cleaning Supplies', 'Machinery Parts', 'Office Supplies'] },
  ] },
  { value: 'manufacturing', label: 'Manufacturing', businessType: 'manufacturer', marketTier: 'manufacturing', categories: [
    { value: 'food_manufacturing', label: 'Food Manufacturing', subcategories: ['Beverages', 'Baked Goods', 'Packaged Foods', 'Spices', 'Processed Produce'] },
    { value: 'textile_manufacturing', label: 'Textile Manufacturing', subcategories: ['Garments', 'Fabric', 'Leather Goods', 'Footwear', 'Home Textiles'] },
    { value: 'chemical_manufacturing', label: 'Chemical Manufacturing', subcategories: ['Soaps', 'Paints', 'Cosmetics', 'Industrial Chemicals', 'Pharmaceuticals'] },
    { value: 'construction_manufacturing', label: 'Construction Manufacturing', subcategories: ['Blocks', 'Metalwork', 'Doors & Windows', 'Roofing', 'Furniture Components'] },
    { value: 'equipment_manufacturing', label: 'Equipment Manufacturing', subcategories: ['Machinery', 'Electrical Equipment', 'Solar Equipment', 'Tools', 'Vehicle Parts'] },
  ] },
]

export const STAFF_ROLES = [
  { value: 'developer_coordinator', label: 'State Coordinator', creators: ['super_admin'] },
  { value: 'affiliate', label: 'Affiliate', creators: ['super_admin'] },
  { value: 'property_admin', label: 'Property Admin', creators: ['super_admin'] },
  { value: 'deal_initiator', label: 'Deal Initiator', creators: ['super_admin'] },
  { value: 'auditor', label: 'Auditor', creators: ['super_admin'] },
  { value: 'support', label: 'Support', creators: ['super_admin'] },
  { value: 'business_owner', label: 'Business Owner', creators: ['super_admin', 'developer_coordinator'] },
  { value: 'manager', label: 'Manager', creators: ['super_admin', 'developer_coordinator'] },
  { value: 'stock_manager', label: 'Stock Manager', creators: ['super_admin', 'developer_coordinator'] },
  { value: 'delivery', label: 'Delivery', creators: ['super_admin', 'developer_coordinator'] },
]

export function getCategories(sector) {
  return BUSINESS_CLASSIFICATION.find((item) => item.value === sector)?.categories || []
}

export function getSubcategories(sector, category) {
  return getCategories(sector).find((item) => item.value === category)?.subcategories || []
}
