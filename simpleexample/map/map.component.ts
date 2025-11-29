import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";
import { FirebaseService } from '../../services/firebase.service';

import esri = __esri; // Esri TypeScript Types

import Config from '@arcgis/core/config';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Bookmarks from '@arcgis/core/widgets/Bookmarks';
import Expand from '@arcgis/core/widgets/Expand';

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import Polyline from '@arcgis/core/geometry/Polyline';

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import * as route from "@arcgis/core/rest/route.js";
import * as locator from "@arcgis/core/rest/locator.js";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"]
})
export class MapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  map: esri.Map;
  view: esri.MapView;
  graphicsLayer: esri.GraphicsLayer;
  graphicsLayerUserPoints: esri.GraphicsLayer;
  graphicsLayerRoutes: esri.GraphicsLayer;
  graphicsLayerPlaces: esri.GraphicsLayer;
  trailheadsLayer: esri.FeatureLayer;

  zoom = 10;
  center: Array<number> = [-118.73682450024377, 34.07817583063242];
  basemap = "streets-vector";
  loaded = false;
  directionsElement: any;
  firebaseConnected = false;
  firebaseEntries: any[] = [];

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit() {
    this.initializeMap().then(() => {
      this.loaded = this.view.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  async initializeMap() {
    try {
      Config.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurPEBVeGwAP9B3Pew_acu9NtKjxBfyy0HGFCkEypXCmPJ_0oofkqOmR0tdOOT31IOywuFjBCgnCUDm-4kTCu2WeSH0TGR2xT4C35N5irai0LXigcDT1nbNzajcu_bD-vJJqJ3c8YzePzbcyALLDvOpRT5RYkx2SbMJVqX8MOGl_1W1P9Tdw5Dw6RdUgVW3v7ZHG97OjJupfr4H5jEaPEEPCw.AT1_1cHZ9Hrl";

      const mapProperties: esri.WebMapProperties = {
        basemap: this.basemap
      };
      this.map = new WebMap(mapProperties);

      this.addFeatureLayers();
      this.addGraphicsLayer();

      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };
      this.view = new MapView(mapViewProperties);

      this.view.on('pointer-move', ["Shift"], (event) => {
        const point = this.view.toMap({ x: event.x, y: event.y });
        console.log("Map pointer moved: ", point.longitude, point.latitude);
      });

      await this.view.when();
      console.log("ArcGIS map loaded");
      this.addGraphicElements();
      this.addRouting();
      return this.view;
    } catch (error) {
      console.error("Error loading the map: ", error);
      alert("Error loading the map");
    }
  }

  addFeatureLayers() {
    this.trailheadsLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0",
      outFields: ['*']
    });
    this.map.add(this.trailheadsLayer);

    const trailsLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
    });
    this.map.add(trailsLayer, 0);

    const parksLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0"
    });
    this.map.add(parksLayer, 0);

    console.log("Feature layers added");
  }

  addGraphicsLayer() {
    this.graphicsLayer = new GraphicsLayer();
    this.map.add(this.graphicsLayer);
    this.graphicsLayerUserPoints = new GraphicsLayer();
    this.map.add(this.graphicsLayerUserPoints);
    this.graphicsLayerRoutes = new GraphicsLayer();
    this.map.add(this.graphicsLayerRoutes);
    this.graphicsLayerPlaces = new GraphicsLayer();
    this.map.add(this.graphicsLayerPlaces);
  }

  addGraphicElements() {
    const polygon = new Polygon({
      rings: [[
        [-118.818984489994, 34.0137559967283],
        [-118.806796597377, 34.0215816298725],
        [-118.791432890735, 34.0163883241613],
        [-118.79596686535, 34.008564864635],
        [-118.808558110679, 34.0035027131376]
      ]]
    });

    this.graphicsLayer.add(new Graphic({
      geometry: polygon,
      symbol: {
        type: "simple-fill",
        color: [227, 139, 79, 0.8],
        outline: { color: [255, 255, 255], width: 1 }
      } as any
    }));

    const polyline = new Polyline({
      paths: [[
        [-118.821527826096, 34.0139576938577],
        [-118.814893761649, 34.0080602407843],
        [-118.808878330345, 34.0016642996246]
      ]]
    });

    this.graphicsLayer.add(new Graphic({
      geometry: polyline,
      symbol: { type: "simple-line", color: [226, 119, 40], width: 2 } as any
    }));

    const point = new Point({
      longitude: -118.80657463861,
      latitude: 34.0005930608889
    });

    this.graphicsLayer.add(new Graphic({
      geometry: point,
      symbol: {
        type: "simple-marker",
        color: [226, 119, 40],
        outline: { color: [255, 255, 255], width: 2 }
      } as any
    }));
  }

  addRouting() {
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    this.view.on("click", (event) => {
      this.view.hitTest(event).then((elem: esri.HitTestResult) => {
        if (elem && elem.results && elem.results.length > 0) {
          let point: esri.Point = elem.results.find(e => e.layer === this.trailheadsLayer)?.mapPoint;
          if (point) {
            console.log("get selected point: ", elem, point);
            if (this.graphicsLayerUserPoints.graphics.length === 0) {
              this.addPoint(point.latitude, point.longitude);
            } else if (this.graphicsLayerUserPoints.graphics.length === 1) {
              this.addPoint(point.latitude, point.longitude);
              this.calculateRoute(routeUrl);
            } else {
              this.removePoints();
            }
          }
        }
      });
    });
  }

  addPoint(lat: number, lng: number) {
    let point = new Point({
      longitude: lng,
      latitude: lat
    });

    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40],  // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };

    let pointGraphic: esri.Graphic = new Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol
    });

    this.graphicsLayerUserPoints.add(pointGraphic);
  }

  removePoints() {
    this.graphicsLayerUserPoints.removeAll();
  }

  removeRoutes() {
    this.graphicsLayerRoutes.removeAll();
  }

  async calculateRoute(routeUrl: string) {
    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: this.graphicsLayerUserPoints.graphics.toArray()
      }),
      returnDirections: true
    });

    try {
      const data = await route.solve(routeUrl, routeParams);
      this.displayRoute(data);
    } catch (error) {
      console.error("Error calculating route: ", error);
      alert("Error calculating route");
    }
  }

  displayRoute(data: any) {
    // Clear previous routes and directions before displaying new ones
    this.removeRoutes();
    if (this.directionsElement) {
      this.view.ui.remove(this.directionsElement);
    }

    for (const result of data.routeResults) {
      result.route.symbol = {
        type: "simple-line",
        color: [5, 150, 255],
        width: 3
      };
      this.graphicsLayerRoutes.graphics.add(result.route);
    }
    if (data.routeResults.length > 0) {
      this.showDirections(data.routeResults[0].directions.features);
    } else {
      alert("No directions found");
    }
  }

  clearRouter() {
    if (this.view) {
      // Remove all graphics related to routes
      this.removeRoutes();
      this.removePoints();
      console.log("Route cleared");
      this.view.ui.remove(this.directionsElement);
      this.view.ui.empty("top-right");
      console.log("Directions cleared");
    }
  }

  showDirections(features: any[]) {
    this.directionsElement = document.createElement("ol");
    this.directionsElement.classList.add("esri-widget", "esri-widget--panel", "esri-directions__scroller");
    this.directionsElement.style.marginTop = "0";
    this.directionsElement.style.padding = "15px 15px 15px 30px";

    features.forEach((result, i) => {
      const direction = document.createElement("li");
      direction.innerHTML = `${result.attributes.text} (${result.attributes.length} miles)`;
      this.directionsElement.appendChild(direction);
    });

    this.view.ui.empty("top-right");
    this.view.ui.add(this.directionsElement, "top-right");
  }

  async findPlaces(category: string) {
    const locatorUrl = "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

    try {
      this.clearPlaces();

      const results = await locator.addressToLocations(locatorUrl, {
        address: "",
        location: this.view.center,
        categories: [category],
        maxLocations: 25,
        outFields: ["Place_addr", "PlaceName"]
      });

      console.log(`Found ${results.length} places for category: ${category}`);

      results.forEach((result) => {
        const placeGraphic = new Graphic({
          attributes: result.attributes,
          geometry: result.location,
          symbol: {
            type: "simple-marker",
            color: "#000000",
            size: "12px",
            outline: {
              color: "#ffffff",
              width: "2px"
            }
          } as any,
          popupTemplate: {
            title: "{PlaceName}",
            content: "{Place_addr}"
          }
        });

        this.graphicsLayerPlaces.add(placeGraphic);
      });

      if (results.length > 0) {
        console.log(`Added ${results.length} place markers to the map`);
      }
    } catch (error) {
      console.error("Error finding places: ", error);
    }
  }

  onCategoryChange(event: any) {
    const category = event.target.value;
    console.log(`Selected category: ${category}`);
    this.findPlaces(category);
  }

  clearPlaces() {
    if (this.graphicsLayerPlaces) {
      this.graphicsLayerPlaces.removeAll();
      console.log("Places cleared");
    }
  }

  connectToFirebase() {
    const connected = this.firebaseService.connect();
    if (connected) {
      this.firebaseConnected = true;
      console.log('Firebase connection established');
      
      this.firebaseService.listenToChanges('map-entries', (data) => {
        console.log('Real-time update from Firebase:', data);
        if (data) {
          this.firebaseEntries = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          console.log('Current entries:', this.firebaseEntries);
        } else {
          this.firebaseEntries = [];
          console.log('No entries in Firebase');
        }
      });
    } else {
      alert('Failed to connect to Firebase. Please check your configuration.');
    }
  }

  addFirebaseEntry() {
    if (!this.firebaseConnected) {
      alert('Please connect to Firebase first');
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      location: {
        lat: this.view.center.latitude,
        lng: this.view.center.longitude
      },
      zoom: this.view.zoom,
      description: `Map entry at ${new Date().toLocaleString()}`
    };

    this.firebaseService.addEntry('map-entries', entry);
    console.log('Added entry to Firebase:', entry);
  }

  ngOnDestroy() {
    if (this.view) {
      this.view.container = null;
    }
  }
}
