import './style.css';
import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';

const authSection = document.getElementById('auth-section');
const chatSection = document.getElementById('chat-section');

// Registro
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value.trim();

  const res = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('username', username);
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
    document.getElementById('map-section')?.classList.remove('hidden');
    document.getElementById('chat-map-container')?.classList.remove('hidden');
    startChat(username);
  } else {
    alert(data.error);
  }
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  const res = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('username', username);
    authSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    startChat(username);
  } else {
    alert(data.error);
  }
});

function startChat(username) {
  const socket = io('http://localhost:3000');

  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const messages = document.getElementById('messages');
  const locationDisplay = document.getElementById('location');
  const nearbyUsersDisplay = document.getElementById('nearby-users');

  let userLocation = null;

  const successCallback = (position) => {
    userLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    locationDisplay.textContent = `Ubicación: ${userLocation.latitude}, ${userLocation.longitude}`;
    socket.emit('user location', { username, location: userLocation });
  };

  const errorCallback = (error) => {
    locationDisplay.textContent = 'No se pudo obtener la ubicación. Por favor, habilita la geolocalización.';
    console.error(error);
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    });
  } else {
    locationDisplay.textContent = 'Geolocalización no soportada por tu navegador.';
  }

  socket.on('chat message', (msg) => {
    const isMine = msg.sender === username;
  
    const messageElement = document.createElement('div');
    messageElement.className = isMine ? 'chat chat-end' : 'chat chat-start';
    messageElement.innerHTML = `
      <div class="chat-header">
        ${msg.sender}
      </div>
      <div class="chat-bubble ${isMine ? 'chat-bubble-primary' : 'bg-base-300'}">
        ${msg.text}
      </div>
    `;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
  
    // Agregado para actualizar el mapa dinámicamente
    if (msg.location) {
      const { latitude, longitude } = msg.location;
    
      const userIcon = L.icon({
        iconUrl: '/usuario.png', 
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });
    
      if (!userMarkers[msg.sender]) {
        const marker = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup(`<b>${msg.sender}</b><br>📍 (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`)
          .bindTooltip(msg.sender, { permanent: false, direction: 'top' }); 
    
        userMarkers[msg.sender] = marker;
        if (!hasSetInitialView) {
          map.setView([latitude, longitude], 12);
          hasSetInitialView = true;
        }        
      } else {
        userMarkers[msg.sender].setLatLng([latitude, longitude]);
      }
    }
    
  });
  
  socket.on('nearby users', (count) => {
    nearbyUsersDisplay.textContent = `Usuarios cerca: ${count}`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();

    if (text) {
      const message = {
        text,
        sender: username,
        location: userLocation || null
      };

      socket.emit('chat message', message);
      input.value = '';
    }
  });
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.error('Error al registrar el Service Worker:', error);
      });
  });
}

// MAPS
let hasSetInitialView = false;
const map = L.map('map'); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// Diccionario de marcadores
const userMarkers = {};

