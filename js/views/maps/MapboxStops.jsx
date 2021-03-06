import local from '../../../local'
import SettingsStore from '../../stores/SettingsStore.js'
import StationStore from '../../stores/StationStore.js'
import UiStore from '../../stores/UiStore.js'

import { getDist, getIconName } from './util.jsx'

export default class MapboxStops {
  map = null

  history = null

  hideStops = false

  mapboxLoaded = false

  position = [...SettingsStore.getState().lastLocation, 16.5]

  constructor(map, history) {
    this.map = map
    this.history = history

    UiStore.bind('stop-visibility', this.stopVisibility)

    const dataLoad = this.getData(...this.position)
    const mapLoad = new Promise((resolve, reject) => {
      // this is here so it handles the initial load race condition
      map.on('moveend', () => {
        this.loadStops()
      })
      this.map.on('load', () => {
        this.setupStops()
        this.mapboxLoaded = true
        resolve()
      })
    })
    Promise.all([dataLoad, mapLoad]).then(data => {
      if (!this.hideStops) {
        this.map.getSource('stops').setData(data[0])
      }
    })
  }

  setupStops = () => {
    const map = this.map
    map.addSource('stops', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })
    const layerData = {
      id: 'stops',
      type: 'symbol',
      source: 'stops',
      layout: {
        'icon-image': '{icon}',
        'icon-size': { type: 'identity', property: 'icon_size' },
        'icon-ignore-placement': true,
      },
    }
    if (map.getLayer('selected-stop') != null) {
      map.addLayer(layerData, 'selected-stop')
    } else {
      map.addLayer(layerData)
    }
    map.on('click', 'stops', e => {
      const { stop_region, stop_id } = e.features[0].properties
      this.viewServices(stop_region, stop_id)
    })
    map.on('mouseenter', 'stops', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'stops', () => {
      map.getCanvas().style.cursor = ''
    })
  }

  stopVisibility = (state, load = true) => {
    if (this.hideStops !== state) {
      const map = this.map
      this.hideStops = state

      // hide the layer
      if (!this.mapboxLoaded) return
      if (state === true) {
        map.setLayoutProperty('stops', 'visibility', 'none')
      } else {
        map.setLayoutProperty('stops', 'visibility', 'visible')
        if (load) this.loadStops()
      }
    }
  }

  loadStops = async (centerOverride, zoomOverride) => {
    const map = this.map
    const center = centerOverride || map.getCenter()
    const zoom = zoomOverride || map.getZoom()
    if (this.hideStops) return
    const data = await this.getData(center.lat, center.lng, zoom)
    if (!this.hideStops && this.mapboxLoaded) {
      this.map.getSource('stops').setData(data)
    }
  }

  viewServices = (region, station) => {
    const history = this.history
    const split = history.location.pathname.split('/')
    const currentStation = `/s/${region}/${station}`
    if (split[1] === 's' && split.length === 4) {
      history.replace(currentStation)
    } else {
      history.push(currentStation)
    }
  }

  async getData(lat, lon, zoom) {
    const dist = getDist(zoom)
    this.position = [lat, lon, dist]

    if (zoom <= 9.5) {
      return {
        type: 'FeatureCollection',
        features: [],
      }
    }

    try {
      const res = await fetch(
        `${local.endpoint}/auto/station/search?lat=${lat.toFixed(
          4
        )}&lon=${lon.toFixed(4)}&distance=${dist}`
      )
      const data = await res.json()
      const features = data.map(stop => {
        StationStore.stationCache[stop.stop_id] = stop
        return {
          type: 'Feature',
          properties: {
            stop_region: stop.stop_region,
            stop_id: stop.stop_id,
            stop_name: stop.stop_name,
            route_type: stop.route_type,
            icon: getIconName(
              stop.stop_region,
              stop.route_type,
              'stops',
              stop.stop_name
            ),
            icon_size: zoom >= 16 ? 1 : 0.75,
          },
          geometry: {
            type: 'Point',
            coordinates: [stop.stop_lon, stop.stop_lat],
          },
        }
      })
      return {
        type: 'FeatureCollection',
        features: features,
      }
    } catch (error) {
      console.log(error)
    }
  }
}
