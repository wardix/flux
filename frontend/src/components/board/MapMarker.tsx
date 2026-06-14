import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import { CardWithLocation } from '../../lib/types'
import { CardMapPopup } from './CardMapPopup'
import L from 'leaflet'

interface MapMarkerProps {
  card: CardWithLocation
  onClick: () => void
}

// Function to generate a colored marker icon based on list/status
function getColoredMarkerIcon(colorName: string) {
  // A simple SVG marker with a specific color
  const colorHex = '#3B82F6' // default blue
  // We can just use the default leaflet marker for now, or customize based on colorName
  return new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

export function MapMarker({ card, onClick }: MapMarkerProps) {
  // We can parse a color from list_title or something else later.
  const icon = getColoredMarkerIcon(card.list_title)
  
  return (
    <Marker position={[card.latitude, card.longitude]} icon={icon}>
      <Popup>
        <CardMapPopup card={card} onOpenCard={onClick} />
      </Popup>
    </Marker>
  )
}
