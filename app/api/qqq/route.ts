import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/QQQ?interval=1d&range=2d',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 300 }, // cache 5 min
      }
    )
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta) throw new Error('No data')

    const price = meta.regularMarketPrice
    const prevClose = meta.previousClose ?? meta.chartPreviousClose
    const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0

    return NextResponse.json({ price, prevClose, changePct })
  } catch {
    return NextResponse.json({ price: null, prevClose: null, changePct: null, error: true })
  }
}
