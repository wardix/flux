import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { CardWithLocation } from '../../lib/types'
import { api } from '../../lib/api'
import { MapMarker } from './MapMarker'

interface MapViewProps {
  boardId: number
  cards: any[] // Just the initial cards or full list if needed, but we'll fetch map specific data
  onCardClick?: (card: any) => void
  onLocationSet?: () => void
}

function BoundsFitter({ cards }: { cards: CardWithLocation[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (cards.length > 0) {
      const lats = cards.map(c => c.latitude)
      const lngs = cards.map(c => c.longitude)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      
      // Add a little padding to the bounds
      const padding = 0.05
      map.fitBounds([
        [minLat - padding, minLng - padding],
        [maxLat + padding, maxLng + padding]
      ])
    }
  }, [cards, map])
  
  return null
}

export function MapView({ boardId, onCardClick }: MapViewProps) {
  const [mapCards, setMapCards] = useState<CardWithLocation[]>([])
  
  const fetchMapCards = async () => {
    try {
      const res = await api.get<{ data: CardWithLocation[] }>(`/boards/${boardId}/cards/map`)
      setMapCards(res.data)
    } catch (err) {
      console.error('Failed to fetch map cards', err)
    }
  }

  useEffect(() => {
    fetchMapCards()
  }, [boardId])

  return (
    <div className="w-full h-[600px] bg-base-100 rounded-xl border border-base-300 overflow-hidden relative">
      <MapContainer 
        center={[-6.2088, 106.8456]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        data-testid="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapCards.map(card => (
          <MapMarker 
            key={card.id} 
            card={card} 
            onClick={() => onCardClick && onCardClick(card)} 
          />
        ))}
        {mapCards.length > 0 && <BoundsFitter cards={mapCards} />}
      </MapContainer>
    </div>
  )
}
