// Базова адреса API.
// - локально (dev): змінна не задана → '/api', запити йдуть через Vite-проксі на :3000;
// - у проді (Vercel): VITE_API_BASE_URL = https://<backend>.onrender.com/api.
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

// Origin бекенду без хвостового /api — для прямих посилань на файли та WebSocket.
// Локально → '' (відносні шляхи, проксі Vite); у проді → https://<backend>.onrender.com
export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

// Будує абсолютний (у проді) або відносний (локально) URL до ресурсу бекенду.
export function serverUrl(path: string): string {
  return `${SERVER_ORIGIN}${path}`;
}
