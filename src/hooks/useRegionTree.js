import { useQuery } from '@tanstack/react-query'
import { regionApi } from '../api/index.js'
import { REGIONS } from '../config/regions.js'

export function useRegionTree() {
  const query = useQuery({
    queryKey: ['region-tree'],
    queryFn: () => regionApi.tree().then((response) => response.data),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  })
  const nodes = query.data?.nodes?.length
    ? query.data.nodes
    : REGIONS.map((region) => ({
      key: region.id,
      name: region.label,
      region: region.region,
      state: region.state,
      market: region.market,
    }))
  const byKey = Object.fromEntries(nodes.map((node) => [node.key, node]))
  return {
    nodes,
    byKey,
    label: (key) => byKey[key]?.name || key,
    path: (key) => (byKey[key] ? `${byKey[key].region} › ${byKey[key].state} › ${byKey[key].name}` : key),
    isLoading: query.isLoading,
  }
}
