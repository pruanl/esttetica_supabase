import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface InteractiveMapProps {
  latitude?: number
  longitude?: number
  onLocationSelect: (lat: number, lng: number) => void
  className?: string
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude = -23.5505, // São Paulo default
  longitude = -46.6333,
  onLocationSelect,
  className = "h-64 w-full rounded-md border"
}) => {
  const mapRef = useRef<L.Map>(null)

  useEffect(() => {
    // Invalidate size when component mounts to ensure proper rendering
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Update map center when coordinates change
  useEffect(() => {
    if (mapRef.current && latitude && longitude) {
      mapRef.current.setView([latitude, longitude], 15)
    }
  }, [latitude, longitude])

  const position: [number, number] = [latitude, longitude]

  return (
    <div className={className}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        {latitude && longitude && (
          <Marker position={[latitude, longitude]} />
        )}
      </MapContainer>
    </div>
  )
}