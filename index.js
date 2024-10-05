<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Map Application with Dijkstra's Algorithm</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <style>
        #map {
            height: 600px;
            width: 100%;
        }
        #controls {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 1000;
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }
    </style>
</head>
<body>
    <div id="controls">
        <h4>Enter Coordinates</h4>
        <label for="source">Source (lat,lng):</label>
        <input type="text" id="source" placeholder="37.7749,-122.4194"><br>
        <label for="destination">Destination (lat,lng):</label>
        <input type="text" id="destination" placeholder="37.7750,-122.4183"><br>
        <button onclick="findPath()">Find Shortest Path</button>
    </div>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    
    <script>
        const apiKey = 'YOUR_API_KEY'; // Replace with your Google Maps API key
        const centerCoordinates = { lat: 37.7749, lng: -122.4194 }; // Example: San Francisco
        
        const map = L.map('map').setView([centerCoordinates.lat, centerCoordinates.lng], 15);
        
        // Add a tile layer (satellite)
        L.tileLayer(`https://maps.googleapis.com/maps/api/staticmap?center=${centerCoordinates.lat},${centerCoordinates.lng}&zoom=15&size=600x300&maptype=satellite&key=${apiKey}`, {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
        }).addTo(map);
        
        async function fetchStreetData() {
            const query = `
                [out:json];
                (
                    way["highway"](around:1000, ${centerCoordinates.lat}, ${centerCoordinates.lng});
                    relation["highway"](around:1000, ${centerCoordinates.lat}, ${centerCoordinates.lng});
                );
                out body;
            `;
            
            const response = await fetch(`http://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data;
        }
        
        function buildGraph(data) {
            const graph = {};
            data.elements.forEach(element => {
                if (element.type === 'way') {
                    const nodes = element.nodes;
                    for (let i = 0; i < nodes.length - 1; i++) {
                        const from = nodes[i];
                        const to = nodes[i + 1];
                        if (!graph[from]) graph[from] = {};
                        if (!graph[to]) graph[to] = {};
                        graph[from][to] = 1; // Add weight; you can change this based on distance or other factors
                        graph[to][from] = 1; // Add bidirectional edge
                    }
                }
            });
            return graph;
        }

        function dijkstra(graph, start, end) {
            const distances = {};
            const previous = {};
            const queue = new Set();

            for (const vertex in graph) {
                distances[vertex] = Infinity;
                previous[vertex] = null;
                queue.add(vertex);
            }
            distances[start] = 0;

            while (queue.size) {
                const currentVertex = [...queue].reduce((minVertex, vertex) => 
                    distances[vertex] < distances[minVertex] ? vertex : minVertex
                );

                if (distances[currentVertex] === Infinity) break;

                queue.delete(currentVertex);

                for (const neighbor in graph[currentVertex]) {
                    const alt = distances[currentVertex] + graph[currentVertex][neighbor];
                    if (alt < distances[neighbor]) {
                        distances[neighbor] = alt;
                        previous[neighbor] = currentVertex;
                    }
                }
            }

            const path = [];
            for (let at = end; at !== null; at = previous[at]) {
                path.push(at);
            }
            path.reverse();
            return path.length ? path : null;
        }

        function visualizeRoute(path) {
            const routeCoordinates = path.map(node => {
                // Assuming you have a way to convert node IDs to lat/lng, here we just use example coords
                return [37.7750, -122.4183]; // Replace with actual lat/lng for each node in the path
            });

            const routeLine = L.polyline(routeCoordinates, { color: 'blue' }).addTo(map);
            map.fitBounds(routeLine.getBounds());
        }

        async function findPath() {
            const sourceInput = document.getElementById('source').value.split(',');
            const destinationInput = document.getElementById('destination').value.split(',');
            
            const sourceCoords = { lat: parseFloat(sourceInput[0]), lng: parseFloat(sourceInput[1]) };
            const destinationCoords = { lat: parseFloat(destinationInput[0]), lng: parseFloat(destinationInput[1]) };

            const streetData = await fetchStreetData();
            const graph = buildGraph(streetData);
            
            const sourceNode = 'YOUR_SOURCE_NODE'; // Replace with actual node ID for source
            const destinationNode = 'YOUR_DESTINATION_NODE'; // Replace with actual node ID for destination

            const shortestPath = dijkstra(graph, sourceNode, destinationNode);
            visualizeRoute(shortestPath);
        }
    </script>
</body>
</html>
