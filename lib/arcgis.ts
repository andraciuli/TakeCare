import esriConfig from '@arcgis/core/config'

// Initialize ArcGIS with API key
esriConfig.apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY!

export const mapConfig = {
  center: [26.1025, 44.4268], // Bucharest, Romania [longitude, latitude]
  zoom: 7,
  basemap: 'arcgis-streets'
}
