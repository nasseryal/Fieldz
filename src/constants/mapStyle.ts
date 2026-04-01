// Style sombre pour Google Maps — thème Fieldz

export const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#0F0F0F' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#999999' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0F0F0F' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#1A1A1A' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#666666' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#BBBBBB' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#666666' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#141414' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1A1A1A' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#242424' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#242424' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2A2A2A' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1A1A1A' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#050505' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#444444' }],
  },
];
