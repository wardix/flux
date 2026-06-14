import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapView } from '../../src/components/board/MapView'

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: any) => (
    <div data-testid="marker" data-position={position.join(',')}>{children}</div>
  ),
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ fitBounds: vi.fn(), setView: vi.fn() }),
}))

// Mock api to return mapCards
import { api } from '../../src/lib/api'
vi.mock('../../src/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          title: 'Site Survey Kelapa Gading',
          latitude: -6.1578,
          longitude: 106.9046,
          address: 'Kelapa Gading, Jakarta Utara',
          list_id: 1,
          list_title: 'To Do',
          labels: [],
          assignees: [],
          due_date: null,
        },
        {
          id: 2,
          title: 'Client Meeting Sudirman',
          latitude: -6.2088,
          longitude: 106.8219,
          address: 'Sudirman, Jakarta Selatan',
          list_id: 2,
          list_title: 'In Progress',
          labels: [],
          assignees: [],
          due_date: null,
        },
      ]
    })
  }
}))

describe('MapView', () => {
  test('should render map container', async () => {
    render(<MapView boardId={1} onCardClick={vi.fn()} />)
    expect(await screen.findByTestId('map-container')).toBeDefined()
  })

  test('should render markers for each card with location', async () => {
    render(<MapView boardId={1} onCardClick={vi.fn()} />)
    const markers = await screen.findAllByTestId('marker')
    expect(markers).toHaveLength(2)
  })

  test('should render correct positions for markers', async () => {
    render(<MapView boardId={1} onCardClick={vi.fn()} />)
    const markers = await screen.findAllByTestId('marker')
    expect(markers[0].getAttribute('data-position')).toBe('-6.1578,106.9046')
    expect(markers[1].getAttribute('data-position')).toBe('-6.2088,106.8219')
  })
})
