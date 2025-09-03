// Only run if coordinates are available
if (window.listingCoordinates) {
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
    center: window.listingCoordinates,
    zoom: 11
  });

  new maplibregl.Marker()
    .setLngLat(window.listingCoordinates)
    .setPopup(new maplibregl.Popup().setHTML(`<b>${window.listingTitle}</b>`))
    .addTo(map);
} else {
  document.getElementById('map').innerHTML = "Location not available";
}
