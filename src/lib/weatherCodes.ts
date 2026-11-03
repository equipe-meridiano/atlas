/**
 * Códigos de tempo da Organização Meteorológica Mundial (WMO), usados pelo Open-Meteo,
 * traduzidos para o português.
 * Tabela da documentação oficial: https://open-meteo.com/en/docs
 */
const descriptions: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina com geada',
  51: 'Garoa fraca',
  53: 'Garoa moderada',
  55: 'Garoa forte',
  56: 'Garoa congelante fraca',
  57: 'Garoa congelante forte',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante fraca',
  67: 'Chuva congelante forte',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva fracas',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva fortes',
  85: 'Pancadas de neve fracas',
  86: 'Pancadas de neve fortes',
  95: 'Trovoada',
  96: 'Trovoada com granizo fraco',
  97: 'Trovoada forte',
  99: 'Trovoada com granizo forte',
};

export function describeWeather(code: number): string {
  return descriptions[code] ?? 'Condição indisponível';
}
