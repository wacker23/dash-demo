import { useCallback, useEffect, useState } from 'react';
import { ProvinceMap } from './constants';

export const useGeoLocation = () => {
  const [coords, setCoords] = useState({lat: 37.56563133478328, lng: 126.97802809370009});

  const updater = useCallback(() => {
    navigator.geolocation.getCurrentPosition((position) =>
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      null,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
      }
    );
  }, []);

  return {coords, updatePosition: updater};
}

export const getAddressByCoords = (lat: number, lng: number): Promise<string[]> => {
  const geocoder = new kakao.maps.services.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const province = ProvinceMap[result[0].address.region_1depth_name];
        const district = result[0].address.region_2depth_name;
        resolve([province, district]);
      } else {
        reject('주소를 가져오는데 실패했습니다.');
      }
    });
  });
}

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handler = (e: MediaQueryListEvent) => {
    setIsDarkMode(e.matches);
  }

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(query.matches);
    query.addEventListener('change', handler);

    return () => {
      query.removeEventListener('change', handler);
    }
  }, []);

  return isDarkMode;
}

export default async function fetchJson<JSON = any>(
  request: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const response = await fetch(request, init)

  const data = await response.json()

  if (response.ok) {
    return data
  }

  throw new FetchJsonError(response.statusText, response, data)
}

export class FetchJsonError extends Error {

  response: Response
  data: { message: string }

  constructor(message: string, response: Response, data: { message: string }) {
    super(message)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchJsonError)
    }

    this.name = "FetchJsonError"
    this.response = response
    this.data = data ?? { message }
  }
}

export const toDateLocaleString = (date: Date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')
  return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분 ${second}초`;
}

export const toDateString = (date: Date) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

export const stateToString = (state: 'normal' | 'warn' | 'emergency' | 'blank') => {
  switch (state) {
    case 'normal':
      return '정상';
    case 'warn':
      return '경고';
    case 'emergency':
      return '고장';
    default:
      return '설치안됨';
  }
}

export const addressSearch = (addr: string): Promise<kakao.maps.LatLng> =>
  new Promise((resolve, reject) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addr, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result.length > 0) {
        const address = result[0];
        const latitude = Number(result[0].y);
        const longitude = Number(result[0].x);
        resolve(new kakao.maps.LatLng(latitude, longitude));
      } else {
        reject();
      }
    });
  });
