import { globalRateLimiter } from '../middleware/rateLimiter' // We can implement rate limiting directly or use a custom one

export interface UnsplashPhoto {
  id: string
  url_thumb: string
  url_regular: string
  photographer: string
  photographer_url: string
}

export async function searchPhotos(query: string, page = 1, perPage = 20): Promise<UnsplashPhoto[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    throw new Error('UNSPLASH_NOT_CONFIGURED')
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    }
  )

  if (!res.ok) {
    throw new Error(`Unsplash API returned ${res.status}`)
  }

  const body: any = await res.json()
  return (body.results || []).map((photo: any) => ({
    id: photo.id,
    url_thumb: photo.urls.thumb,
    url_regular: photo.urls.regular,
    photographer: photo.user.name,
    photographer_url: photo.user.links.html,
  }))
}

export async function getRandomPhotos(count = 20): Promise<UnsplashPhoto[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    throw new Error('UNSPLASH_NOT_CONFIGURED')
  }

  const res = await fetch(`https://api.unsplash.com/photos/random?count=${count}`, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Unsplash API returned ${res.status}`)
  }

  const body: any = await res.json()
  const list = Array.isArray(body) ? body : [body]
  return list.map((photo: any) => ({
    id: photo.id,
    url_thumb: photo.urls.thumb,
    url_regular: photo.urls.regular,
    photographer: photo.user.name,
    photographer_url: photo.user.links.html,
  }))
}
