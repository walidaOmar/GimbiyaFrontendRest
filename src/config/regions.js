export const REGIONS = [
  { id: "Ado bayero mall", label: "Ado Bayero Mall", shortCode: "KN", commissionPct: 5.5, region: "North West", state: "Kano", market: "Ado Bayero Mall", focus: "Premium retail, dining and professional services (Level 1)" },
  { id: "Tafawa balewa refinery", label: "Tafawa Balewa Refinery", shortCode: "ABJ", commissionPct: 5.0, region: "North Central", state: "Abuja", market: "Tafawa Balewa Refinery", focus: "Heavy processing, logistics hubs and energy (Level 2)" },
  { id: "Sardauna market", label: "Sardauna Market", shortCode: "KD", commissionPct: 4.5, region: "North West", state: "Kaduna", market: "Sardauna Market", focus: "High-velocity consumer goods, traditional retail and B2B wholesaling" },
];

export const GLOBAL_REGION = "Global";

export const STATE_OPTIONS = REGIONS.map((region) => ({ value: region.id, label: `${region.label} (${region.state})` }));

export const STATE_ENUM = REGIONS.map((region) => region.id);

export function getRegionLabel(id) {
  const region = REGIONS.find((item) => item.id === id);
  return region ? region.label : id;
}

export function getRegionShortCode(id) {
  const region = REGIONS.find((item) => item.id === id);
  return region ? region.shortCode : id;
}

export function describeNode(id) {
  const region = REGIONS.find((item) => item.id === id);
  return region ? `${region.region} › ${region.state} › ${region.label}` : id;
}