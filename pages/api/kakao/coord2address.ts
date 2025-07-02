import type { NextApiRequest, NextApiResponse } from 'next';
import {KAKAO_API_KEY} from '../../../lib/server';

type Address = {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  underground_yn: string;
  main_building_no: string;
  sub_building_no: string;
  zip_code: string;
};

type RoadAddress = {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  road_name: string;
  underground_yn: string;
  main_building_no: string;
  sub_building_no: string;
  building_name: string;
  zone_no: string;
};

type Coord2Address = {
  meta: {
    total_count: number;
  };
  documents: {
    road_address: RoadAddress;
    address: Address;
  }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const longitude = req.query.lng;
  const latitude = req.query.lat;
  // fetch data from API
  const API_URI = 'https://dapi.kakao.com/v2/local/geo/coord2address.json';
  const result = await fetch(`${API_URI}?input_coord=WGS84&x=${longitude}&y=${latitude}`, {
    method: "GET",
    headers: {
      "Authorization": `KakaoAK ${KAKAO_API_KEY}`,
    },
  });
  const data: Coord2Address = await result.json();
  if (result.status === 200) {
    if (data.meta.total_count > 0) {
      const address = data.documents[0].road_address ?? data.documents[0].address;
      res.status(200).json(address);
    } else {
      res.status(404).end({
        description: '주소를 찾을 수 없습니다.',
      });
    }
  } else {
    res.status(500).end({
      description: '주소를 찾을 수 없습니다.',
    });
  }
}
