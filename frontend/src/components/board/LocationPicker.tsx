import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Search, Loader2 } from 'lucide-react'
import L from 'leaflet'

interface LocationPickerProps {
  initialLat?: number | null
  initialLng?: number | null
  initialAddress?: string | null
  onLocationSelect: (lat: number, lng: number, address: string) => void
  onClose: () => void
}

function LocationMarker({ position, setPosition, setAddress }: any) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      fetchAddress(e.latlng.lat, e.latlng.lng).then(setAddress)
    },
  })

  // Fit map to initial position if present
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom())
    }
  }, []) // eslint-disable-line

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      return data.display_name || ''
    } catch (err) {
      return ''
    }
  }

  const icon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  return position === null ? null : (
    <Marker position={position} icon={icon} />
  )
}

function SearchBar({ map, setPosition, setAddress }: { map: any, setPosition: any, setAddress: any }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (r: any) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    const newPos = new L.LatLng(lat, lng)
    setPosition(newPos)
    setAddress(r.display_name)
    if (map) {
      map.flyTo(newPos, 15)
    }
    setResults([])
  }

  return (
    <div className="absolute top-2 left-2 right-2 z-[1000] bg-base-100/90 backdrop-blur rounded-lg shadow-lg p-2 border border-base-300">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-base-content/50" />
          <input
            type="text"
            className="input input-bordered input-sm w-full pl-9"
            placeholder="Search location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-sm btn-primary" disabled={isSearching}>
          {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
        </button>
      </form>
      {results.length > 0 && (
        <ul className="mt-2 max-h-40 overflow-y-auto bg-base-100 rounded-lg shadow border border-base-200">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-base-200 border-b border-base-200 last:border-0"
                onClick={() => handleSelect(r)}
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MapSearchWrapper({ setPosition, setAddress }: any) {
  const map = useMap()
  return <SearchBar map={map} setPosition={setPosition} setAddress={setAddress} />
}

export function LocationPicker({ initialLat, initialLng, initialAddress, onLocationSelect, onClose }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null
  )
  const [address, setAddress] = useState(initialAddress || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b border-base-200 flex items-center justify-between">
          <h3 className="font-bold text-lg">Pick Location</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">×</button>
        </div>
        
        <div className="flex-1 relative">
          <MapContainer 
            center={position || [-6.2088, 106.8456]} 
            zoom={position ? 15 : 11} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} />
            <MapSearchWrapper setPosition={setPosition} setAddress={setAddress} />
          </MapContainer>
        </div>
        
        <div className="p-4 border-t border-base-200 bg-base-50">
          <div className="mb-3">
            <label className="text-xs font-bold text-base-content/70 uppercase">Selected Address</label>
            <p className="text-sm mt-1">{address || 'No location selected'}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button 
              className="btn btn-primary"
              disabled={!position}
              onClick={() => {
                if (position) {
                  onLocationSelect(position.lat, position.lng, address)
                }
              }}
            >
              Save Location
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
