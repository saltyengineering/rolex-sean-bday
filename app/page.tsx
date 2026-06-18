import contributions from '@/data/contributions.json'
import GiftScreen from '@/components/GiftScreen'

export const revalidate = 0

export default function Home() {
  return <GiftScreen contributions={contributions} goal={14000} />
}